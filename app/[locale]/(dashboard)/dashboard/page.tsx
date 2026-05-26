import { getDashboardStats, getMonthlyChartData, getLowStockItems, getTopStockItems, getRecentOrders } from '@/lib/actions/dashboard';
import { KPICard } from '@/components/dashboard/KPICard';
import { MonthlyCashChart } from '@/components/dashboard/MonthlyCashChart';
import { StockSummaryCard } from '@/components/dashboard/StockSummaryCard';
import { RecentOrdersWidget } from '@/components/dashboard/RecentOrdersWidget';
import { LowStockBanner } from '@/components/dashboard/LowStockBanner';
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Users, AlertCircle, Building2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const t = await getTranslations('dashboard');
  const sp = await searchParams;
  const period = (sp.period === 'month' ? 'month' : 'today') as 'today' | 'month';

  const [stats, chartData, lowStockItems, topStockItems, recentOrders] = await Promise.all([
    getDashboardStats(period),
    getMonthlyChartData(),
    getLowStockItems(),
    getTopStockItems(),
    getRecentOrders()
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <LowStockBanner count={lowStockItems.length} />

      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">{t('overview')}</h2>
          <p className="text-sm text-muted-foreground">{t('overviewDesc')}</p>
        </div>

        <div className="flex items-center bg-muted p-1 rounded-xl w-fit">
          <Link
            href="?period=today"
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              period === 'today'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t('today')}
          </Link>
          <Link
            href="?period=month"
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              period === 'month'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t('thisMonth')}
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title={period === 'today' ? t('today') + " " + t('cashIn') : t('thisMonth') + " " + t('cashIn')}
          value={stats.cashIn}
          icon={<ArrowDownToLine size={20} />}
          variant="emerald"
        />
        <KPICard
          title={period === 'today' ? t('today') + " " + t('cashOut') : t('thisMonth') + " " + t('cashOut')}
          value={stats.cashOut}
          icon={<ArrowUpFromLine size={20} />}
          variant="rose"
        />
        <KPICard
          title={t('cashInHand')}
          value={stats.cashInHand}
          icon={<Wallet size={20} />}
          variant="blue"
        />
        <KPICard
          title={t('dueFromCustomers')}
          value={stats.totalDueFromCustomers}
          icon={<Users size={20} />}
          variant="amber"
        />
        <KPICard
          title={t('oweToCustomers')}
          value={stats.weOweCustomers}
          icon={<AlertCircle size={20} />}
          variant="rose"
        />
        <KPICard
          title={t('totalBusinessValue')}
          value={stats.totalBusinessValue}
          icon={<Building2 size={20} />}
          variant="emerald"
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

        {/* Stock Summary */}
        <div className="lg:col-span-1">
          <StockSummaryCard products={topStockItems} />
        </div>
      </div>

      {/* Recent Orders Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <RecentOrdersWidget orders={recentOrders} />
      </div>

    </div>
  );
}
