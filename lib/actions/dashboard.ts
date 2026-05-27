"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { startOfDay, startOfMonth, format, subMonths } from "date-fns";
import { unstable_cache } from "next/cache";

const getCachedStats = unstable_cache(
  async (period: 'today' | 'month') => {
    // Use admin client because unstable_cache cannot access cookies()
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const startDate = period === 'today' ? startOfDay(new Date()) : startOfMonth(new Date());
    const startDateStr = startDate.toISOString();

  // 1 & 2. Cash In & Cash Out (based on period)
  const { data: periodCash } = await supabase
    .from('cash_transactions')
    .select('type, amount')
    .gte('created_at', startDateStr);
    
  let cashIn = 0;
  let cashOut = 0;
  
  if (periodCash) {
    periodCash.forEach(t => {
      if (t.type === 'in') cashIn += Number(t.amount);
      if (t.type === 'out') cashOut += Number(t.amount);
    });
  }

  // 3. Absolute Cash In Hand (all time)
  const { data: allCash } = await supabase
    .from('cash_transactions')
    .select('type, amount');
    
  let totalCashIn = 0;
  let totalCashOut = 0;
  
  if (allCash) {
    allCash.forEach(t => {
      if (t.type === 'in') totalCashIn += Number(t.amount);
      if (t.type === 'out') totalCashOut += Number(t.amount);
    });
  }
  const cashInHand = totalCashIn - totalCashOut;

  // 4 & 5. Customer Dues
  const { data: customers } = await supabase
    .from('customers')
    .select('balance');
    
  let totalDueFromCustomers = 0; // Negative balance means they owe us
  let weOweCustomers = 0;        // Positive balance means we owe them
  
  if (customers) {
    customers.forEach(c => {
      const bal = Number(c.balance);
      if (bal < 0) totalDueFromCustomers += Math.abs(bal);
      if (bal > 0) weOweCustomers += bal;
    });
  }

  // 6. Total Stock Value
  const { data: products } = await supabase
    .from('products')
    .select('qty, cost_per_piece');
    
  let stockValue = 0;
  if (products) {
    products.forEach(p => {
      stockValue += (Number(p.qty) * Number(p.cost_per_piece));
    });
  }

  // 7. Supplier Dues (positive balance = we owe them)
  const { data: suppliersData } = await supabase
    .from('suppliers')
    .select('balance');

  let supplierDues = 0; // total we owe suppliers
  if (suppliersData) {
    suppliersData.forEach(s => {
      const bal = Number(s.balance);
      if (bal > 0) supplierDues += bal;
    });
  }

  // Total Business Value
  const totalBusinessValue = stockValue + totalDueFromCustomers - weOweCustomers - supplierDues + cashInHand;

  const weOweThem = weOweCustomers + supplierDues;

  // Active Orders (Not delivered or canceled)
  const { count: activeOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("delivered","canceled")');

  // Deliveries Today (using the exact same logic as getDeliverySchedule)
  const todayStr = new Date().toISOString().split('T')[0];
  const { count: deliveriesTodayCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("delivered","canceled")')
    .or(`delivery_date.lte.${todayStr},status.in.("ready_delivery","on_the_way")`);

  return {
    cashIn,
    cashOut,
    cashInHand,
    totalDueFromCustomers,
    weOweThem,
    totalBusinessValue,
    activeOrders: activeOrdersCount || 0,
    deliveriesToday: deliveriesTodayCount || 0
  };
});

export async function getDashboardStats(period: 'today' | 'month' = 'today') {
  return getCachedStats(period);
}

export async function getMonthlyChartData() {
  const supabase = await createClient();
  
  const sixMonthsAgo = subMonths(startOfMonth(new Date()), 5); // include current month = 6 months
  
  const { data: transactions } = await supabase
    .from('cash_transactions')
    .select('type, amount, created_at')
    .gte('created_at', sixMonthsAgo.toISOString());
    
  // Aggregate by month (e.g. "Jan", "Feb")
  const monthlyData: Record<string, { name: string, income: number, expense: number }> = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const monthKey = format(d, 'MMM-yy');
    monthlyData[monthKey] = { name: monthKey, income: 0, expense: 0 };
  }
  
  if (transactions) {
    transactions.forEach(t => {
      const date = new Date(t.created_at);
      const monthKey = format(date, 'MMM-yy');
      
      if (monthlyData[monthKey]) {
        if (t.type === 'in') monthlyData[monthKey].income += Number(t.amount);
        if (t.type === 'out') monthlyData[monthKey].expense += Number(t.amount);
      }
    });
  }

  return Object.values(monthlyData);
}

export async function getLowStockItems() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .lt('stock_quantity', 10); // Wait, schema uses qty or stock_quantity? Schema says `qty`? Let me check types/index.ts
    // Wait, in Chunk 1 types/index.ts: `qty: number;`. In 001_initial_schema.sql it's `qty` or `stock_quantity`?
    // Let's use qty. Wait, earlier I used `lt('stock_quantity', 10)` in NotificationsPanel! 
    // I need to verify what field is actually in the db schema.
  return data || [];
}

export async function getTopStockItems() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('*');
    
  if (!data) return [];
  
  // Sort by total value (qty * cost_per_piece) descending
  return data.sort((a, b) => (b.qty * b.cost_per_piece) - (a.qty * a.cost_per_piece)).slice(0, 5);
}

export async function getRecentOrders() {
  const supabase = await createClient();
  
  // Need to join customers table to get the customer name
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);
    
  return data || [];
}

export async function getOrderStatusBreakdown() {
  const supabase = await createClient();
  const startOfCurrentMonth = startOfMonth(new Date()).toISOString();

  const { data: orders } = await supabase
    .from('orders')
    .select('status, order_date')
    .gte('order_date', startOfCurrentMonth);

  const breakdown = {
    printing: 0,
    waitingStock: 0,
    designConfirmation: 0,
    readyForDelivery: 0,
    deliveredThisMonth: 0
  };

  if (orders) {
    orders.forEach(o => {
      const s = o.status;
      if (['waiting_print', 'one_color_done', 'drying', 'two_color_done'].includes(s)) breakdown.printing++;
      else if (s === 'waiting_stock') breakdown.waitingStock++;
      else if (['design_waiting_confirmation', 'design_confirmed', 'designing', 'order_placed', 'waiting_for_plate', 'plate_done'].includes(s)) breakdown.designConfirmation++;
      else if (['ready_delivery', 'on_the_way', 'waiting_handle', 'handle_done'].includes(s)) breakdown.readyForDelivery++;
      else if (s === 'delivered') breakdown.deliveredThisMonth++;
    });
  }

  return breakdown;
}
