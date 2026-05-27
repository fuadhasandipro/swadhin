"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./auth";
import { logActivity } from "@/lib/utils/activityLogger";
import { revalidatePath } from "next/cache";

export async function getProducts(searchQuery?: string) {
  const supabase = await createClient();
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  
  if (searchQuery) {
    query = query.or(`bag_size.ilike.%${searchQuery}%,bag_color.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch products: " + error.message);
  
  return data;
}

export async function createProduct(data: { bag_size: string; bag_color: string; gsm: number; cost_per_piece: number; qty: number; cutting_type: string; category?: string; supplier_id?: string }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  
  const supabase = await createClient();
  
  const insertData: any = { ...data, bag_size: data.bag_size };
  if (!data.category) insertData.category = 'raw_material';
  if (!data.supplier_id) delete insertData.supplier_id;

  const { data: newProduct, error } = await supabase
    .from('products')
    .insert([insertData])
    .select()
    .single();
    
  if (error) throw new Error("Failed to create product: " + error.message);

  await logActivity(supabase, {
    userId: profile.id,
    action: 'ADD_STOCK',
    entityType: 'products',
    entityId: newProduct.id,
    details: { bag_size: data.bag_size, qty: data.qty }
  });

  revalidatePath('/stock');
  return newProduct;
}

export async function updateProduct(id: string, data: { bag_size?: string; bag_color?: string; gsm?: number; cost_per_piece?: number; cutting_type?: string; category?: string; supplier_id?: string | null }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id);
    
  if (error) throw new Error("Failed to update product: " + error.message);

  await logActivity(supabase, {
    userId: profile.id,
    action: 'UPDATE_PRODUCT',
    entityType: 'products',
    entityId: id,
    details: data
  });

  revalidatePath('/stock');
}

export async function restockProduct(
  id: string,
  addQty: number,
  supplierId?: string,
  paidAmount?: number,
  description?: string,
  costPerPiece?: number,
) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  if (addQty <= 0) throw new Error("Quantity must be positive");

  const supabase = await createClient();
  
  const { data: product } = await supabase.from('products').select('qty, cost_per_piece, bag_size, bag_color').eq('id', id).single();
  if (!product) throw new Error("Product not found");

  const newQty = product.qty + addQty;
  const effectiveCost = costPerPiece ?? product.cost_per_piece;
  const totalCost = addQty * effectiveCost;
  const paid = paidAmount ?? 0;
  const desc = description || `Restock: ${product.bag_size} - ${product.bag_color} (${addQty} pcs)`;

  // Update product qty (and optionally cost)
  const updateData: any = { qty: newQty };
  if (costPerPiece !== undefined) updateData.cost_per_piece = costPerPiece;
  if (supplierId) updateData.supplier_id = supplierId;

  const { error } = await supabase.from('products').update(updateData).eq('id', id);
  if (error) throw new Error("Failed to restock: " + error.message);

  // If supplier selected, record purchase via supplier action logic
  if (supplierId && totalCost > 0) {
    const { recordSupplierPurchase } = await import('./suppliers');
    await recordSupplierPurchase({
      supplier_id: supplierId,
      amount: totalCost,
      description: desc,
      paid_amount: paid,
    });
  } else if (paid > 0) {
    // No supplier but cash was paid — just record cash out
    const cashPayload: any = {
      type: 'out',
      category: 'expense',
      amount: paid,
      description: desc,
      created_by: profile.id,
    };
    await supabase.from('cash_transactions').insert([cashPayload]);
  }

  await logActivity(supabase, {
    userId: profile.id,
    action: 'RESTOCK_PRODUCT',
    entityType: 'products',
    entityId: id,
    details: { previous_qty: product.qty, added_qty: addQty, new_qty: newQty, supplier_id: supplierId, total_cost: totalCost, paid }
  });

  revalidatePath('/stock');
  revalidatePath('/dashboard');
  if (supplierId) {
    revalidatePath('/suppliers');
    revalidatePath('/cash');
  }
}

export async function deleteProduct(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error("Unauthorized: Only admins can delete products");
  }

  const supabase = await createClient();
  
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', id);

  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error("Cannot delete product because it is referenced by existing orders.");
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error("Failed to delete product: " + error.message);

  await logActivity(supabase, {
    userId: profile.id,
    action: 'DELETE_PRODUCT',
    entityType: 'products',
    entityId: id,
    details: { deleted_product_id: id }
  });

  revalidatePath('/stock');
  revalidatePath('/dashboard');
}

export async function checkStockAvailability(productId: string, requiredQty: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('products').select('qty, bag_size').eq('id', productId).single();
  
  if (error || !data) return { available: false, error: "Product not found" };
  
  if (data.qty < requiredQty) {
    return { 
      available: false, 
      error: `Insufficient stock for ${data.bag_size}. Need ${requiredQty}, but only ${data.qty} available.` 
    };
  }
  
  return { available: true };
}
