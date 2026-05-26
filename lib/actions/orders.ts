"use server";

import { createClient } from "../supabase/server";
import { Order, OrderStatus } from "@/types";
import { sendOrderPlacedSMS, sendDeliveredSMS } from "./sms";
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

  // Create new customer if needed
  if (!customerId && data.new_customer) {
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
      product_id: data.product_id || null,
      rate_per_piece: data.rate_per_piece,
      qty: data.qty,
      total_amount: data.rate_per_piece * data.qty,
      notes: data.notes || ''
    })
    .select('*, customer:customers(phone)')
    .single();

  if (orderError) throw new Error(orderError.message);

  // Log activity
  if (profile) {
    await supabase.rpc('log_activity', {
      p_user_id: profile.id,
      p_action: 'created_order',
      p_entity_type: 'orders',
      p_entity_id: order.id,
      p_details: { status: 'order_placed', total: order.total_amount }
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
  if (newStatus !== 'canceled') {
    const oldIdx = ORDER_STATUS_FLOW.indexOf(oldStatus);
    const newIdx = ORDER_STATUS_FLOW.indexOf(newStatus);
    if (newIdx <= oldIdx) {
      throw new Error("Status can only move forward");
    }
  }

  const privileges = Array.isArray(profile.privileges) ? profile.privileges : [];
  const isAdmin = profile.role === 'admin';
  const isOrderManager = privileges.includes('order_manager') || profile.role === 'manager';
  const isDeliveryManager = privileges.includes('delivery_manager');

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

  // Stock check if delivering
  if (newStatus === 'delivered' && order.product_id) {
    if ((order.product?.qty || 0) < order.qty) {
      throw new Error("অপর্যাপ্ত স্টক (Insufficient Stock)");
    }
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  // Log activity
  await supabase.rpc('log_activity', {
    p_user_id: profile.id,
    p_action: 'updated_order_status',
    p_entity_type: 'orders',
    p_entity_id: order.id,
    p_details: { from: oldStatus, to: newStatus }
  });

  // Triggers handle stock reduction if status is delivered
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
  let query = supabase.from('orders').select('*, customer:customers(name, phone)');

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
    .select('role')
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
  
  revalidatePath('/orders');
  return true;
}
