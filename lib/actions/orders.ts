"use server";

import { createClient } from "../supabase/server";
import { Order, OrderStatus } from "@/types";
import { sendOrderPlacedSMS, sendDeliveredSMS } from "./sms";
import { logActivity } from "@/lib/utils/activityLogger";
import { revalidatePath } from "next/cache";

const ORDER_STATUS_FLOW: OrderStatus[] = [
  'order_placed', 'designing', 'design_waiting_confirmation', 'design_confirmed', 
  'waiting_for_plate', 'plate_done', 'waiting_stock', 'waiting_print', 
  'one_color_done', 'drying', 'two_color_done', 'waiting_handle', 
  'handle_done', 'ready_delivery', 'on_the_way', 'delivered'
];

export async function createOrder(data: any) {
  const supabase = await createClient();
  
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userData.user.id).single();

  let customerId = data.customer_id;

  if (data.qty <= 0 || !Number.isInteger(data.qty)) throw new Error("Quantity must be a positive integer.");
  if (data.rate_per_piece < 0) throw new Error("Rate cannot be negative.");

  // Create new customer if needed
  if (!customerId && data.new_customer) {
    if (!/^01[3-9]\d{8}$/.test(data.new_customer.phone)) {
      throw new Error("Invalid phone number format. Must be a valid BD number (e.g., 017...).");
    }
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: data.new_customer.name,
        phone: data.new_customer.phone,
        address: data.new_customer.address || '',
        balance: 0
      })
      .select('id, phone')
      .single();

    if (customerError) throw new Error("Failed to create customer");
    customerId = newCustomer.id;
  }

  let finalProductId = data.product_id;

  // Auto-create virtual stock if custom bag is used
  if (!finalProductId && data.manual_bag_size) {
    const bagSize = data.manual_bag_size.trim();
    
    // Check if a matching product exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('bag_size', bagSize)
      .eq('bag_color', data.body_color)
      .eq('gsm', data.gsm)
      .eq('cutting_type', data.cutting_type)
      .maybeSingle();

    if (existingProduct) {
      finalProductId = existingProduct.id;
    } else {
      // Create new virtual product with 0 qty
      const { data: newProduct, error: prodError } = await supabase
        .from('products')
        .insert({
          bag_size: bagSize,
          bag_color: data.body_color,
          gsm: data.gsm,
          cutting_type: data.cutting_type,
          category: 'raw_material',
          qty: 0,
          cost_per_piece: 0 // Will be updated when actually purchased
        })
        .select('id')
        .single();
        
      if (prodError) throw new Error("Failed to create virtual stock: " + prodError.message);
      finalProductId = newProduct.id;
    }
  }

  // Insert Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      order_date: data.order_date || new Date().toISOString(),
      delivery_date: data.delivery_date,
      status: 'order_placed',
      location: data.location || '',
      cutting_type: data.cutting_type,
      gsm: data.gsm,
      body_color: data.body_color,
      handle_color: data.handle_color || '',
      print_color_type: data.print_color_type,
      print_color_config: data.print_color_config || null,
      product_id: finalProductId || null,
      rate_per_piece: data.rate_per_piece,
      qty: data.qty,
      total_amount: data.rate_per_piece * data.qty,
      paid_amount: data.paid_amount || 0,
      notes: data.notes || ''
    })
    .select('*, customer:customers(phone)')
    .single();

  if (orderError) throw new Error(orderError.message);

  // --- IMMEDIATE DEDUCTIONS (Stock & Balance) ---
  
  // 1. Customer Balance Debit
  // If order is placed, customer owes us, so balance decreases (gets more negative).
  const paidAmount = data.paid_amount || 0;
  
  const { data: customerData } = await supabase.from('customers').select('balance').eq('id', customerId).single();
  if (customerData) {
    // Net balance change: (balance - total) + paid
    const newBalance = customerData.balance - order.total_amount + paidAmount;
    await supabase.from('customers').update({ balance: newBalance }).eq('id', customerId);
    
    // Add transaction ledger entry for the order
    await supabase.from('customer_transactions').insert({
      customer_id: customerId,
      type: 'debit',
      amount: order.total_amount,
      description: `Order Placed (#${order.id.slice(0, 8)})`,
      order_id: order.id
    });

    // If there is an advance payment, record cash collection operations
    if (paidAmount > 0) {
      // Customer Transaction for the payment (Credit)
      await supabase.from('customer_transactions').insert({
        customer_id: customerId,
        type: 'credit',
        amount: paidAmount,
        description: `Advance Payment (#${order.id.slice(0, 8)})`,
        order_id: order.id
      });

      // Global Cash Transaction (In)
      await supabase.from('cash_transactions').insert({
        type: 'in',
        category: 'collection',
        amount: paidAmount,
        description: `Advance Payment for Order #${order.id.slice(0, 8)}`,
        customer_id: customerId,
        created_by: profile?.id
      });
    }
  }

  // 2. Stock Reduction
  if (order.product_id) {
    const { data: productData } = await supabase.from('products').select('qty').eq('id', order.product_id).single();
    if (productData) {
      await supabase.from('products').update({ qty: productData.qty - order.qty }).eq('id', order.product_id);
    }
  }

  // Log activity
  if (profile) {
    await logActivity(supabase, {
      userId: profile.id,
      action: 'CREATE_ORDER',
      entityType: 'orders',
      entityId: order.id,
      details: { status: 'order_placed', total: order.total_amount }
    });
  }

  // Send SMS
  if (order.customer?.phone) {
    await sendOrderPlacedSMS(order.id, order.customer.phone, new Date(order.delivery_date));
  }

  revalidatePath('/orders');
  revalidatePath('/customers');
  return order;
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const supabase = await createClient();
  
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, privileges')
    .eq('user_id', userData.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, customer:customers(phone), product:products(qty, id)')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) throw new Error("Order not found");

  const oldStatus = order.status;
  
  // Validation Rules
  // Removed forward-only restriction to allow reverse status updates


  const role = profile.role;
  let privileges: any = {};
  if (typeof profile.privileges === 'string') {
    try { privileges = JSON.parse(profile.privileges); } catch (e) {}
  } else if (profile.privileges) {
    privileges = profile.privileges;
  }
  const isOrderManager = (Array.isArray(privileges) ? privileges.includes('order_manager') : privileges?.order_manager === true) || role === 'manager';
  const isDeliveryManager = Array.isArray(privileges) ? privileges.includes('delivery_manager') : privileges?.delivery_manager === true;

  const isAdmin = profile.role === 'admin';

  if (!isAdmin && !isOrderManager) {
    // Delivery manager restriction
    if (isDeliveryManager) {
      if (!['ready_delivery', 'on_the_way', 'delivered'].includes(oldStatus) || !['ready_delivery', 'on_the_way', 'delivered'].includes(newStatus)) {
         throw new Error("Delivery manager can only manage delivery statuses");
      }
    } else if (profile.role === 'staff') {
      throw new Error("Staff cannot update order status directly");
    }
  }

  // The old stock check during delivery has been removed because stock is now deducted immediately at order creation.

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  // Log activity
  await logActivity(supabase, {
    userId: profile.id,
    action: 'UPDATE_STATUS',
    entityType: 'orders',
    entityId: order.id,
    details: { from: oldStatus, to: newStatus }
  });

  // --- REVERT DEDUCTIONS IF CANCELED ---
  if (newStatus === 'canceled' && oldStatus !== 'canceled') {
    // 1. Revert Balance (Credit)
    const { data: customerData } = await supabase.from('customers').select('balance').eq('id', order.customer_id).single();
    if (customerData) {
      const newBalance = customerData.balance + order.total_amount;
      await supabase.from('customers').update({ balance: newBalance }).eq('id', order.customer_id);
      
      // Add transaction ledger entry
      await supabase.from('customer_transactions').insert({
        customer_id: order.customer_id,
        type: 'credit',
        amount: order.total_amount,
        description: `Order Canceled (#${order.id.slice(0, 8)})`,
        order_id: order.id
      });
    }

    // 2. Revert Stock
    if (order.product_id) {
      const { data: productData } = await supabase.from('products').select('qty').eq('id', order.product_id).single();
      if (productData) {
        await supabase.from('products').update({ qty: productData.qty + order.qty }).eq('id', order.product_id);
      }
    }
  }

  // Triggers handle stock reduction if status is delivered -> REMOVED IN DB (now handled on create)
  // Send delivered SMS
  if (newStatus === 'delivered' && order.customer?.phone) {
    await sendDeliveredSMS(order.id, order.customer.phone, order.total_amount);
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  return updatedOrder;
}

export async function getOrders(search?: string, statusFilter?: string) {
  const supabase = await createClient();
  let query = supabase.from('orders').select('*, customer:customers(name, phone), product:products(bag_size)');

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'active') {
      query = query.not('status', 'in', '("delivered","canceled")');
    } else {
      query = query.eq('status', statusFilter);
    }
  }

  if (search) {
    // supabase doesn't have an easy way to search joined table along with current table in one line without RPC
    // so we will search by id
    query = query.or(`id.eq.${search}`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  
  // Client side filter for customer name if search is provided
  if (search) {
     return data.filter((o: any) => o.id === search || o.customer?.name.toLowerCase().includes(search.toLowerCase()));
  }
  return data;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, customer:customers(*), product:products(*)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteOrder(id: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', userData.user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error("Only admin can delete orders");
  }

  const { data: order } = await supabase.from('orders').select('status').eq('id', id).single();
  if (order?.status !== 'order_placed') {
    throw new Error("Can only delete orders in order_placed status");
  }

  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw new Error(error.message);
  
  await logActivity(supabase, {
    userId: profile!.id,
    action: 'DELETE_ORDER',
    entityType: 'orders',
    entityId: id,
    details: { order_id: id }
  });

  revalidatePath('/orders');
  return true;
}

export async function getDeliverySchedule() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  
  // We want orders that are NOT delivered or canceled
  // AND (delivery_date <= today OR status IN ('ready_delivery', 'on_the_way'))
  
  const { data, error } = await supabase
    .from('orders')
    .select('*, customer:customers(name, phone, address, balance), product:products(bag_size, bag_color, gsm)')
    .not('status', 'in', '("delivered","canceled")')
    .or(`delivery_date.lte.${today},status.in.("ready_delivery","on_the_way")`)
    .order('delivery_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}
