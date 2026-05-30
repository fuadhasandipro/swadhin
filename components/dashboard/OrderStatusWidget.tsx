"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoveRight } from "lucide-react";
import Link from "next/link";

interface OrderStatusBreakdown {
  printing: number;
  waitingStock: number;
  designConfirmation: number;
  readyForDelivery: number;
  deliveredThisMonth: number;
}

export function OrderStatusWidget({ breakdown }: { breakdown: OrderStatusBreakdown }) {
  // Max count to scale progress bars relative to the largest category
  const maxVal = Math.max(
    breakdown.printing,
    breakdown.waitingStock,
    breakdown.designConfirmation,
    breakdown.readyForDelivery,
    breakdown.deliveredThisMonth,
    1 // prevent div by zero
  );

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#0a0f0a]">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Order status breakdown
        </CardTitle>
        <Link href="/kanban" className="text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 flex items-center gap-1">
          Kanban <MoveRight size={12} />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Printing */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-400">Printing in progress</span>
            <span className="text-slate-800 dark:text-slate-200">{breakdown.printing}</span>
          </div>
          <div className="h-2 w-full bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${(breakdown.printing / maxVal) * 100}%` }}
            />
          </div>
        </div>

        {/* Waiting Stock */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-red-500 flex items-center gap-1">
              <span className="text-[10px]">⚠️</span> Waiting for stock
            </span>
            <span className="text-red-500">{breakdown.waitingStock}</span>
          </div>
          <div className="h-2 w-full bg-red-100 dark:bg-red-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full" 
              style={{ width: `${(breakdown.waitingStock / maxVal) * 100}%` }}
            />
          </div>
        </div>

        {/* Design confirmation */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-orange-500">Design confirmation</span>
            <span className="text-slate-800 dark:text-slate-200">{breakdown.designConfirmation}</span>
          </div>
          <div className="h-2 w-full bg-orange-100 dark:bg-orange-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-full" 
              style={{ width: `${(breakdown.designConfirmation / maxVal) * 100}%` }}
            />
          </div>
        </div>

        {/* Ready for delivery */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-emerald-600 dark:text-emerald-500">Ready for delivery</span>
            <span className="text-slate-800 dark:text-slate-200">{breakdown.readyForDelivery}</span>
          </div>
          <div className="h-2 w-full bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${(breakdown.readyForDelivery / maxVal) * 100}%` }}
            />
          </div>
        </div>

        {/* Delivered this month */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-emerald-700 dark:text-emerald-600">Delivered this month</span>
            <span className="text-slate-800 dark:text-slate-200">{breakdown.deliveredThisMonth}</span>
          </div>
          <div className="h-2 w-full bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-600 rounded-full" 
              style={{ width: `${(breakdown.deliveredThisMonth / maxVal) * 100}%` }}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
