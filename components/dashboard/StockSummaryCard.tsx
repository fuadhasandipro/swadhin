"use client";

import { Product } from '@/types';
import { AlertTriangle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/routing';
import { useTranslations } from 'next-intl';

export function StockSummaryCard({ products }: { products: Product[] }) {
  const t = useTranslations('dashboard');
  const totalValue = products.reduce((acc, p) => acc + (p.qty * p.cost_per_piece), 0);

  return (
    <div className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-6 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.05)] h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-heading font-bold text-slate-800 dark:text-emerald-100">{t('topStock')}</h2>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70">{t('topStockDesc')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-emerald-500/70 uppercase font-semibold tracking-wider">{t('totalStockValue')}</p>
          <p className="text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400">৳{totalValue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {products.map(product => {
          const isLowStock = product.qty < 10;
          const value = product.qty * product.cost_per_piece;
          
          return (
            <div key={product.id} className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-colors",
              isLowStock 
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50" 
                : "bg-slate-50 dark:bg-[#0d1a0e] border-slate-200 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isLowStock ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                )}>
                  {isLowStock ? <AlertTriangle size={18} /> : <Package size={18} />}
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-emerald-100 font-sans text-sm">
                    {product.bag_size} {product.bag_color && `- ${product.bag_color}`}
                  </h4>
                  <p className={cn(
                    "text-xs font-sans mt-0.5",
                    isLowStock ? "text-red-600 dark:text-red-400 font-medium" : "text-slate-500 dark:text-emerald-500/70"
                  )}>
                    স্টক: {product.qty} পিস
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium font-sans text-slate-800 dark:text-emerald-300 text-sm">৳{value.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-500 dark:text-emerald-500/50">৳{product.cost_per_piece}/পিস</p>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="text-center text-slate-500 dark:text-emerald-600 font-sans py-8">
            {t('noStock')}
          </div>
        )}
      </div>
      
      <Link href="/stock" className="mt-4 block text-center text-sm text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-medium">
        {t('viewAllStock')} &rarr;
      </Link>
    </div>
  );
}
