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

  return {
    data,
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
