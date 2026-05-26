"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./auth";
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

export async function createProduct(data: { bag_size: string; bag_color: string; gsm: number; cost_per_piece: number; qty: number }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  
  const supabase = await createClient();
  
  const { data: newProduct, error } = await supabase
    .from('products')
    .insert([data])
    .select()
    .single();
    
  if (error) throw new Error("Failed to create product: " + error.message);

  await supabase.from('activity_log').insert([{
    user_id: profile.id,
    action: 'create_product',
    entity_type: 'product',
    entity_id: newProduct.id,
    details: { bag_size: data.bag_size, qty: data.qty }
  }]);

  revalidatePath('/stock');
  return newProduct;
}

export async function updateProduct(id: string, data: { bag_size?: string; bag_color?: string; gsm?: number; cost_per_piece?: number }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id);
    
  if (error) throw new Error("Failed to update product: " + error.message);

  await supabase.from('activity_log').insert([{
    user_id: profile.id,
    action: 'update_product',
    entity_type: 'product',
    entity_id: id,
    details: data
  }]);

  revalidatePath('/stock');
}

export async function restockProduct(id: string, addQty: number) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  if (addQty <= 0) throw new Error("Quantity must be positive");

  const supabase = await createClient();
  
  const { data: product } = await supabase.from('products').select('qty').eq('id', id).single();
  if (!product) throw new Error("Product not found");

  const newQty = product.qty + addQty;

  const { error } = await supabase
    .from('products')
    .update({ qty: newQty })
    .eq('id', id);

  if (error) throw new Error("Failed to restock: " + error.message);

  await supabase.from('activity_log').insert([{
    user_id: profile.id,
    action: 'restock_product',
    entity_type: 'product',
    entity_id: id,
    details: { previous_qty: product.qty, added_qty: addQty, new_qty: newQty }
  }]);

  revalidatePath('/stock');
  revalidatePath('/dashboard');
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

  await supabase.from('activity_log').insert([{
    user_id: profile.id,
    action: 'delete_product',
    entity_type: 'product',
    entity_id: id,
    details: { deleted_product_id: id }
  }]);

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
