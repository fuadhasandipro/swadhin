"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { startOfDay, startOfMonth, format, subMonths, subDays } from "date-fns";

const getCachedStats =
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
    let totalStockQty = 0;
    if (products) {
      products.forEach(p => {
        stockValue += (Number(p.qty) * Number(p.cost_per_piece));
        totalStockQty += Number(p.qty);
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
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('qty, total_amount')
      .not('status', 'in', '("delivered","canceled")');

    let activeOrdersCount = 0;
    let activeOrdersQty = 0;
    let activeOrdersValue = 0;

    if (activeOrders) {
      activeOrdersCount = activeOrders.length;
      activeOrders.forEach(o => {
        activeOrdersQty += Number(o.qty);
        activeOrdersValue += Number(o.total_amount);
      });
    }

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
      stockValue,
      totalStockQty,
      activeOrders: activeOrdersCount,
      activeOrdersQty,
      activeOrdersValue,
      deliveriesToday: deliveriesTodayCount || 0
    };
  };

export async function getDashboardStats(period: 'today' | 'month' = 'today') {
  return getCachedStats(period);
}

export async function getDailyActivityData() {
  const supabase = await createClient();

  const fourteenDaysAgo = subDays(startOfDay(new Date()), 13); // 14 days including today

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('action, details, created_at, entity_type, entity_id')
    .gte('created_at', fourteenDaysAgo.toISOString());

  // Fetch quantities for the orders in these logs
  const orderIds = Array.from(new Set(logs?.filter(l => l.entity_type === 'orders' && l.entity_id).map(l => l.entity_id) || []));
  const orderQtyMap: Record<string, number> = {};
  
  if (orderIds.length > 0) {
    const { data: orders } = await supabase.from('orders').select('id, qty').in('id', orderIds);
    if (orders) {
      orders.forEach(o => {
        orderQtyMap[o.id] = Number(o.qty);
      });
    }
  }

  const dailyData: Record<string, { date: string, orders: number, prints: number, handles: number }> = {};

  for (let i = 13; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateKey = format(d, 'MMM dd');
    dailyData[dateKey] = { date: dateKey, orders: 0, prints: 0, handles: 0 };
  }

  if (logs) {
    logs.forEach(log => {
      const dateKey = format(new Date(log.created_at), 'MMM dd');
      const qty = (log.entity_type === 'orders' && log.entity_id) ? (orderQtyMap[log.entity_id] || 0) : 0;
      
      if (dailyData[dateKey] && qty > 0) {
        if (log.action === 'CREATE_ORDER') {
          dailyData[dateKey].orders += qty;
        } else if (log.action === 'UPDATE_STATUS') {
          const status = log.details?.status;
          if (status === 'one_color_done' || status === 'two_color_done') {
            dailyData[dateKey].prints += qty;
          } else if (status === 'handle_done') {
            dailyData[dateKey].handles += qty;
          }
        }
      }
    });
  }

  return Object.values(dailyData);
}

export async function getLowStockItems() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .lt('qty', 10);
  
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
