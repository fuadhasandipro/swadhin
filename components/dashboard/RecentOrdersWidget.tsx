"use client";

import { Order, OrderStatus } from '@/types';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

// Helper to get status color and label  
const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'order_placed': return { label: 'Placed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    case 'waiting_print': case 'one_color_done': case 'drying': case 'two_color_done': 
      return { label: 'Printing', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
    case 'waiting_stock': return { label: 'Wait stock', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    case 'designing': case 'design_waiting_confirmation': case 'design_confirmed': 
      return { label: 'Design conf.', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
    case 'ready_delivery': return { label: 'Ready', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
    case 'on_the_way': return { label: 'On the way', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    case 'delivered': return { label: 'Delivered', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
    case 'canceled': return { label: 'Canceled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    default: return { label: 'Processing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  }
};

type OrderWithCustomer = Order & { customers: { name: string } };

export function RecentOrdersWidget({ orders }: { orders: OrderWithCustomer[] }) {
  const t = useTranslations('dashboard');

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#0a0f0a]">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-5">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-slate-500" />
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Recent orders
          </CardTitle>
        </div>
        <Link href="/orders" className="text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1.2fr_0.8fr_0.5fr_0.5fr_0.6fr_0.7fr_0.7fr] px-5 pb-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <span>Order ID</span>
          <span>Customer</span>
          <span>Bag Size</span>
          <span>Cut</span>
          <span className="text-center">GSM</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Status</span>
          <span className="text-right">Delivery</span>
        </div>

        {/* Table Rows */}
        {orders.map((order, i) => {
          const statusConfig = getStatusConfig(order.status);
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className={cn(
                "grid grid-cols-[1fr_1.2fr_0.8fr_0.5fr_0.5fr_0.6fr_0.7fr_0.7fr] px-5 py-3 items-center hover:bg-slate-50 dark:hover:bg-emerald-950/10 transition-colors text-sm",
                i !== orders.length - 1 && "border-b border-slate-50 dark:border-slate-800/50"
              )}
            >
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-500">
                #{order.id.slice(0, 8)}
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate text-xs">
                {order.customers?.name || 'Unknown'}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {(order as any).manual_bag_size || (order as any).product?.bag_size || '-'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {(order as any).cut_type || '-'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500 text-center">
                {(order as any).gsm || '-'}
              </span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-right">
                {Number(order.qty).toLocaleString('en-IN')}
              </span>
              <span className="text-right">
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium inline-block", statusConfig.color)}>
                  {statusConfig.label}
                </span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500 text-right">
                {order.delivery_date ? format(new Date(order.delivery_date), 'dd MMM') : '-'}
              </span>
            </Link>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center text-muted-foreground font-sans py-8">
            No recent orders
          </div>
        )}
      </CardContent>
    </Card>
  );
}
