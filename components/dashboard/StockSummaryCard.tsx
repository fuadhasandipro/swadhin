"use client";

import { Product } from '@/types';
import { AlertTriangle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function StockSummaryCard({ products }: { products: Product[] }) {
  const t = useTranslations('dashboard');
  const totalValue = products.reduce((acc, p) => acc + (p.qty * p.cost_per_piece), 0);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">{t('topStock')}</CardTitle>
          <CardDescription>{t('topStockDesc')}</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{t('totalStockValue')}</p>
          <p className="text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400">৳{totalValue.toLocaleString('en-IN')}</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {products.map(product => {
          const isLowStock = product.qty < 10;
          const value = product.qty * product.cost_per_piece;
          
          return (
            <div key={product.id} className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-colors",
              isLowStock 
                ? "bg-destructive/10 border-destructive/20" 
                : "bg-card hover:bg-muted/50"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isLowStock ? "bg-destructive/10 text-destructive" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                )}>
                  {isLowStock ? <AlertTriangle size={18} /> : <Package size={18} />}
                </div>
                <div>
                  <h4 className="font-medium text-foreground font-sans text-sm">
                    {product.bag_size} {product.bag_color && `- ${product.bag_color}`}
                  </h4>
                  <p className={cn(
                    "text-xs font-sans mt-0.5",
                    isLowStock ? "text-destructive font-medium" : "text-muted-foreground"
                  )}>
                    স্টক: {product.qty} পিস
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium font-sans text-foreground text-sm">৳{value.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-muted-foreground">৳{product.cost_per_piece}/পিস</p>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="text-center text-muted-foreground font-sans py-8">
            {t('noStock')}
          </div>
        )}
        
        <Link href="/stock" className="mt-4 block text-center text-sm text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-medium">
          {t('viewAllStock')} &rarr;
        </Link>
      </CardContent>
    </Card>
  );
}
