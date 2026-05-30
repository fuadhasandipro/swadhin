"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, AlertTriangle, Layers, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StockInfoWidgetProps {
  totalQty: number;
  totalValue: number;
  lowStockItems: any[];
}

export function StockInfoWidget({ totalQty, totalValue, lowStockItems }: StockInfoWidgetProps) {
  // Format qty in 'K' (thousands) if large enough
  const formattedQty = totalQty >= 1000 ? `${(totalQty / 1000).toFixed(1)}K` : totalQty;

  return (
    <Card className="shadow-sm border-slate-200 dark:border-emerald-900/30">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="text-emerald-500" size={18} /> 
            Stock Overview
          </CardTitle>
          <Link href="/stock" className="text-xs text-emerald-600 hover:underline">View All</Link>
        </div>
        <CardDescription>Current raw materials status</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col gap-4">
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Layers size={14} /> Total Pieces
            </div>
            <div className="font-bold text-lg text-slate-800 dark:text-slate-200">{formattedQty} pcs</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
              <Wallet size={14} /> Stock Value
            </div>
            <div className="font-bold text-lg text-emerald-700 dark:text-emerald-300">৳{totalValue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="flex-1 mt-2">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            Low Stock Alerts ({lowStockItems.length})
          </div>
          
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {item.bag_size} <span className="text-muted-foreground font-normal">({item.bag_color})</span>
                    </p>
                  </div>
                  <div className="text-xs font-bold text-red-600 dark:text-red-400">
                    {item.qty} left
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-dashed">
                All items are sufficiently stocked!
              </div>
            )}
            {lowStockItems.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-1">+ {lowStockItems.length - 5} more items</p>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
