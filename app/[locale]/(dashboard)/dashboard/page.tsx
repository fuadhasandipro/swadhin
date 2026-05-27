import { getDashboardStats, getMonthlyChartData, getLowStockItems, getTopStockItems, getRecentOrders, getOrderStatusBreakdown } from '@/lib/actions/dashboard';
import { KPICard } from '@/components/dashboard/KPICard';
import { MonthlyCashChart } from '@/components/dashboard/MonthlyCashChart';
import { OrderStatusWidget } from '@/components/dashboard/OrderStatusWidget';
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

  const [stats, chartData, lowStockItems, recentOrders, orderStatusBreakdown] = await Promise.all([
    getDashboardStats(period),
    getMonthlyChartData(),
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Cash In Hand"
          value={stats.cashInHand}
          icon={<Wallet size={20} />}
          variant="emerald"
          valueColor="text-[#016335] dark:text-emerald-400"
          prefix="৳"
        />
        <KPICard
          title="Monthly Inflow"
          value={stats.cashIn}
          icon={<ArrowDownToLine size={20} />}
          variant="blue"
          valueColor="text-blue-600 dark:text-blue-400"
          prefix="৳"
          subtitle={format(new Date(), "MMM yyyy")}
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
          title="Active Orders"
          value={stats.activeOrders}
          icon={<Activity size={20} />}
          variant="emerald"
          valueColor="text-slate-800 dark:text-slate-200"
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t('monthlyCashFlow')}</CardTitle>
            <CardDescription>{t('monthlyCashFlowDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyCashChart data={chartData} />
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <div className="lg:col-span-1">
          <OrderStatusWidget breakdown={orderStatusBreakdown} />
        </div>
      </div>

      {/* Recent Orders Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <RecentOrdersWidget orders={recentOrders} />
      </div>

    </div>
  );
}
