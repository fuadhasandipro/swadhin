"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./auth";
import { format, parseISO } from "date-fns";

export async function getSalesReport(startDate: string, endDate: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, customers(name)')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw new Error(error.message);

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const canceledOrders = orders.filter(o => o.status === 'canceled').length;
  
  // Exclude canceled orders from revenue calculation usually, but it depends on business logic.
  // We'll calculate total revenue from non-canceled orders.
  const validOrders = orders.filter(o => o.status !== 'canceled');
  const totalRevenue: number = validOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const averageOrderValue: number = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  // Group by status for donut chart
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const ordersByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value: value as number }));

  // Group by customer for top 5 customers
  const customerRevenues = validOrders.reduce((acc, o) => {
    const custName = o.customers?.name || 'Unknown';
    acc[custName] = (acc[custName] || 0) + Number(o.total_price || 0);
    return acc;
  }, {} as Record<string, number>);
  const topCustomers = Object.entries(customerRevenues)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Daily Revenue (for line chart)
  const dailyRevenues = validOrders.reduce((acc, o) => {
    const day = format(new Date(o.created_at), 'MMM dd');
    acc[day] = (acc[day] || 0) + Number(o.total_price || 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Ensure daily array is sorted by actual date
  const dailyRevenueChart = Object.entries(dailyRevenues).map(([date, revenue]) => ({ date, revenue: revenue as number }));

  return {
    totalOrders,
    deliveredOrders,
    canceledOrders,
    totalRevenue,
    averageOrderValue,
    ordersByStatus,
    topCustomers,
    dailyRevenueChart,
    rawOrders: orders // Useful for export
  };
}

export async function getCashFlowReport(startDate: string, endDate: string) {
  const supabase = await createClient();

  const { data: txs, error } = await supabase
    .from('cash_transactions')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw new Error(error.message);

  let totalIncome = 0;
  let totalExpense = 0;

  const incomeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};

  const dailyCashFlow: Record<string, { date: string, income: number, expense: number }> = {};

  for (const tx of txs) {
    const day = format(new Date(tx.created_at), 'MMM dd');
    if (!dailyCashFlow[day]) {
      dailyCashFlow[day] = { date: day, income: 0, expense: 0 };
    }

    const amt = Number(tx.amount);
    if (tx.type === 'in') {
      totalIncome += amt;
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + amt;
      dailyCashFlow[day].income += amt;
    } else {
      totalExpense += amt;
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + amt;
      dailyCashFlow[day].expense += amt;
    }
  }

  const netProfit = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netProfit,
    incomeByCategory: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
    expenseByCategory: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
    dailyCashFlowChart: Object.values(dailyCashFlow),
    rawTxs: txs
  };
}

export async function getStockReport() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('qty', { ascending: true });

  if (error) throw new Error(error.message);

  let totalStockValue = 0;
  const lowStockItems = [];

  for (const p of products) {
    totalStockValue += Number(p.qty) * Number(p.cost_per_piece);
    if (Number(p.qty) <= 500) {
      lowStockItems.push({ ...p, minimum_stock: 500 });
    }
  }

  // Group by bag size
  const stockBySize = products.reduce((acc, p) => {
    acc[p.bag_size] = (acc[p.bag_size] || 0) + Number(p.qty);
    return acc;
  }, {} as Record<string, number>);

  return {
    totalStockValue,
    lowStockItems,
    stockBySizeChart: Object.entries(stockBySize).map(([name, value]) => ({ name, value: value as number })).sort((a,b) => b.value - a.value),
    rawProducts: products
  };
}

export async function getCustomerReport(startDate: string, endDate: string) {
  const supabase = await createClient();

  // Get all customers for current balances
  const { data: allCustomers, error: custErr } = await supabase
    .from('customers')
    .select('*');

  if (custErr) throw new Error(custErr.message);

  let totalReceivables = 0;
  let totalPayables = 0;

  for (const c of allCustomers) {
    const bal = Number(c.balance_amount);
    if (bal > 0) totalReceivables += bal;
    else if (bal < 0) totalPayables += Math.abs(bal);
  }

  const topDebtors = [...allCustomers]
    .filter(c => Number(c.balance_amount) > 0)
    .sort((a, b) => Number(b.balance_amount) - Number(a.balance_amount))
    .slice(0, 10);

  // New customers in period
  const newCustomers = allCustomers.filter(c => c.created_at >= startDate && c.created_at <= endDate).length;

  return {
    totalCustomers: allCustomers.length,
    newCustomers,
    totalReceivables,
    totalPayables,
    topDebtors,
    rawCustomers: allCustomers
  };
}

export async function getSalaryReport(startDate: string, endDate: string) {
  const supabase = await createClient();

  // Convert dates to YYYY-MM format to match salary_records.month
  const startMonth = format(new Date(startDate), 'yyyy-MM');
  const endMonth = format(new Date(endDate), 'yyyy-MM');

  const { data: records, error } = await supabase
    .from('salary_records')
    .select('*, profiles(full_name)')
    .gte('month', startMonth)
    .lte('month', endMonth);

  if (error) throw new Error(error.message);

  let totalPaid = 0;
  let totalDue = 0;
  const employeeBreakdown: Record<string, { paid: number, due: number }> = {};

  for (const r of records) {
    const paid = Number(r.paid_amount);
    const due = Number(r.due_amount);
    totalPaid += paid;
    totalDue += due;

    const empName = r.profiles?.full_name || 'Unknown';
    if (!employeeBreakdown[empName]) {
      employeeBreakdown[empName] = { paid: 0, due: 0 };
    }
    employeeBreakdown[empName].paid += paid;
    employeeBreakdown[empName].due += due;
  }

  return {
    totalPaid,
    totalDue,
    employeeBreakdown: Object.entries(employeeBreakdown).map(([name, data]) => ({ name, ...data })),
    rawRecords: records
  };
}
