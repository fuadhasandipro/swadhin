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
          <h2 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">{t('overview')}</h2>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70">{t('overviewDesc')}</p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-[#0d1a0e] p-1 rounded-xl border border-slate-200 dark:border-emerald-900/50 w-fit shadow-sm">
          <Link
            href="?period=today"
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              period === 'today'
                ? "bg-white dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 shadow-sm"
                : "text-slate-500 dark:text-emerald-600 hover:text-slate-700 dark:hover:text-emerald-400"
            )}
          >
            {t('today')}
          </Link>
          <Link
            href="?period=month"
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              period === 'month'
                ? "bg-white dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 shadow-sm"
                : "text-slate-500 dark:text-emerald-600 hover:text-slate-700 dark:hover:text-emerald-400"
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
        <div className="lg:col-span-2 bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-6 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.05)]">
          <div className="mb-4">
            <h2 className="text-lg font-heading font-bold text-slate-800 dark:text-emerald-100">{t('monthlyCashFlow')}</h2>
            <p className="text-sm text-slate-500 dark:text-emerald-500/70">{t('monthlyCashFlowDesc')}</p>
          </div>
          <MonthlyCashChart data={chartData} />
        </div>

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
