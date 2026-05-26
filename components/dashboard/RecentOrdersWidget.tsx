"use client";

import { Order, OrderStatus } from '@/types';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/routing';
import { useTranslations } from 'next-intl';

// Helper to get status color and label
const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'order_placed': return { label: 'অর্ডার প্লেসড', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
    case 'ready_delivery': return { label: 'ডেলিভারির জন্য প্রস্তুত', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
    case 'delivered': return { label: 'ডেলিভারড', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
    case 'canceled': return { label: 'বাতিল', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' };
    default: return { label: 'প্রক্রিয়াধীন', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
  }
};

type OrderWithCustomer = Order & { customers: { name: string } };

export function RecentOrdersWidget({ orders }: { orders: OrderWithCustomer[] }) {
  const t = useTranslations('dashboard');
  
  const getTranslatedStatusLabel = (status: OrderStatus) => {
    return t(`orderStatus.${status}`);
  };

  return (
    <div className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-6 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.05)] h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-heading font-bold text-slate-800 dark:text-emerald-100">{t('recentOrders')}</h2>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70">{t('recentOrdersDesc')}</p>
        </div>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <ShoppingBag size={20} />
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {orders.map(order => {
          const statusConfig = getStatusConfig(order.status);
          
          return (
            <Link 
              key={order.id} 
              href={`/orders/${order.id}`}
              className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-[#0d1a0e] border-slate-200 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div>
                <h4 className="font-medium text-slate-800 dark:text-emerald-100 font-sans text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {order.customers?.name || t('unknownCustomer')}
                </h4>
                <div className={cn("text-[10px] font-sans mt-1.5 px-2 py-0.5 rounded-full inline-block border", statusConfig.color)}>
                  {getTranslatedStatusLabel(order.status)}
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end">
                <p className="font-bold font-sans text-slate-800 dark:text-emerald-300 text-sm">৳{order.total_amount.toLocaleString('en-IN')}</p>
                <div className="flex items-center text-[10px] text-slate-500 dark:text-emerald-500/70 mt-1 font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t('details')} <ArrowRight size={12} className="ml-1" />
                </div>
              </div>
            </Link>
          );
        })}
        
        {orders.length === 0 && (
          <div className="text-center text-slate-500 dark:text-emerald-600 font-sans py-8">
            {t('noOrders')}
          </div>
        )}
      </div>
      
      <Link href="/orders" className="mt-4 block text-center text-sm text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-medium">
        {t('viewAllOrders')} &rarr;
      </Link>
    </div>
  );
}
