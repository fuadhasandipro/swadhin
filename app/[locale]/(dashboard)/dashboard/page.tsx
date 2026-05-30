import { getDashboardStats, getDailyActivityData, getLowStockItems, getTopStockItems, getRecentOrders, getOrderStatusBreakdown } from '@/lib/actions/dashboard';
import { KPICard } from '@/components/dashboard/KPICard';
import { DailyActivityChart } from '@/components/dashboard/DailyActivityChart';
import { OrderStatusWidget } from '@/components/dashboard/OrderStatusWidget';
import { StockInfoWidget } from '@/components/dashboard/StockInfoWidget';
import { RecentOrdersWidget } from '@/components/dashboard/RecentOrdersWidget';
import { LowStockBanner } from '@/components/dashboard/LowStockBanner';
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Users, AlertCircle, Building2, Truck, Activity, PackageCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const t = await getTranslations('dashboard');
  const period = 'month';

  const [stats, dailyData, lowStockItems, recentOrders, orderStatusBreakdown] = await Promise.all([
    getDashboardStats(period),
    getDailyActivityData(),
    getLowStockItems(),
    getRecentOrders(),
    getOrderStatusBreakdown()
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <LowStockBanner count={lowStockItems.length} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-medium">
            {format(new Date(), "dd MMM yyyy")}
          </span>
          <Link
            href="/orders/create"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
          >
            + New Order
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard
          title="Cash In Hand"
          value={stats.cashInHand}
          icon={<Wallet size={20} />}
          variant="emerald"
          valueColor="text-[#016335] dark:text-emerald-400"
          prefix="৳"
        />
        <KPICard
          title="They Owe Us"
          value={stats.totalDueFromCustomers}
          icon={<Users size={20} />}
          variant="amber"
          valueColor="text-orange-500 dark:text-orange-400"
          prefix="৳"
        />
        <KPICard
          title="We Owe Them"
          value={stats.weOweThem}
          icon={<AlertCircle size={20} />}
          variant="rose"
          valueColor="text-red-500 dark:text-red-400"
          prefix="৳"
        />
        <KPICard
          title="Total Business Value"
          value={stats.totalBusinessValue}
          icon={<Building2 size={20} />}
          variant="amber"
          valueColor="text-amber-600 dark:text-amber-400"
          prefix="৳"
        />
        <KPICard
          title="Active Orders"
          value={stats.activeOrdersQty}
          icon={<Activity size={20} />}
          variant="emerald"
          valueColor="text-slate-800 dark:text-slate-200"
          prefix=""
          suffix=" pcs"
          subtitle={`${stats.activeOrders} orders | ৳${stats.activeOrdersValue.toLocaleString('en-IN')}`}
        />
        <KPICard
          title="Deliveries Today"
          value={stats.deliveriesToday}
          icon={<PackageCheck size={20} />}
          variant="blue"
          valueColor="text-slate-800 dark:text-slate-200"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Daily Activity (Last 14 Days)</CardTitle>
            <CardDescription>Orders placed, printed, and handled</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyActivityChart data={dailyData} />
          </CardContent>
        </Card>

        {/* Breakdown Widgets */}
        <div className="lg:col-span-1 space-y-6">
          <OrderStatusWidget breakdown={orderStatusBreakdown} />
          <StockInfoWidget 
            totalQty={stats.totalStockQty} 
            totalValue={stats.stockValue} 
            lowStockItems={lowStockItems} 
          />
        </div>
      </div>

      {/* Recent Orders Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <RecentOrdersWidget orders={recentOrders} />
      </div>

    </div>
  );
}
