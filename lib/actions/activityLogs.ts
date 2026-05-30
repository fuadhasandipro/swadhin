"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./auth";

export interface ActivityFilterParams {
  page?: number;
  limit?: number;
  userId?: string;
  actionType?: string[];
  startDate?: string;
  endDate?: string;
}

export async function getActivityLogs(params: ActivityFilterParams = {}) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    throw new Error("Unauthorized to view activity logs");
  }

  const supabase = await createClient();
  const page = params.page || 1;
  const limit = params.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('activity_logs')
    .select('*, profile:profiles(id, full_name, role)', { count: 'exact' });

  // Security: Managers can only see their own logs
  if (profile.role === 'manager') {
    query = query.eq('user_id', profile.id);
  } else if (params.userId && params.userId !== 'all') {
    // Admins can filter by specific user
    query = query.eq('user_id', params.userId);
  }

  // Filters
  if (params.actionType && params.actionType.length > 0 && !params.actionType.includes('all')) {
    query = query.in('action', params.actionType);
  }

  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  // Sort and paginate
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  
  if (error) throw new Error("Failed to fetch activity logs: " + error.message);

  const logs = data || [];

  // Fetch related entity names for better display
  const orderIds = logs.filter(l => l.entity_type === 'orders' && l.entity_id).map(l => l.entity_id);
  const customerIds = logs.filter(l => l.entity_type === 'customers' && l.entity_id).map(l => l.entity_id);
  const productIds = logs.filter(l => l.entity_type === 'products' && l.entity_id).map(l => l.entity_id);

  const entityCache: Record<string, any> = {};

  if (orderIds.length > 0) {
    const { data: orders } = await supabase.from('orders').select('id, customer:customers(name), qty').in('id', orderIds);
    orders?.forEach(o => {
      const customer: any = Array.isArray(o.customer) ? o.customer[0] : o.customer;
      entityCache[o.id] = { customer_name: customer?.name, order_qty: o.qty };
    });
  }

  if (customerIds.length > 0) {
    const { data: customers } = await supabase.from('customers').select('id, name').in('id', customerIds);
    customers?.forEach(c => {
      entityCache[c.id] = { name: c.name };
    });
  }

  if (productIds.length > 0) {
    const { data: products } = await supabase.from('products').select('id, bag_size, bag_color').in('id', productIds);
    products?.forEach(p => {
      entityCache[p.id] = { bag_size: p.bag_size, color: p.bag_color };
    });
  }

  // Inject fetched details into logs
  const enrichedLogs = logs.map(log => {
    const cached = entityCache[log.entity_id] || {};
    return {
      ...log,
      details: { ...log.details, ...cached }
    };
  });

  return {
    data: enrichedLogs,
    totalCount: count || 0,
    page,
    totalPages: count ? Math.ceil(count / limit) : 0
  };
}

export async function getActivityLogById(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  
  let query = supabase
    .from('activity_logs')
    .select('*, profile:profiles(id, full_name, role)')
    .eq('id', id);

  if (profile.role === 'manager') {
    query = query.eq('user_id', profile.id);
  }

  const { data, error } = await query.single();
  
  if (error) throw new Error("Failed to fetch activity log details: " + error.message);
  return data;
}

export async function getActivityUsers() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    return []; // Managers don't need the user filter list
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name');

  if (error) return [];
  return data;
}
