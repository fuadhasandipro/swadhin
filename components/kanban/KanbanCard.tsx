"use client";

import { useDraggable } from "@dnd-kit/core";
import { format, isPast, isToday, startOfDay } from "date-fns";
import { AlertCircle } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function KanbanCard({ order, onClick }: { order: any; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const deliveryDate = startOfDay(new Date(order.delivery_date));
  const isOverdue = isPast(deliveryDate) && !isToday(deliveryDate) && order.status !== 'delivered' && order.status !== 'canceled';
  const isDueToday = isToday(deliveryDate) && order.status !== 'delivered' && order.status !== 'canceled';

  const dateColor = isOverdue 
    ? "text-red-500 font-bold" 
    : isDueToday 
      ? "text-amber-500 font-bold" 
      : "text-emerald-500";

  // Check low stock
  // If order has a product_id, and the product qty < order qty, it's low stock
  const isLowStock = order.product_id && order.product && order.product.qty < order.qty;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative p-3 bg-white/80 dark:bg-emerald-950/40 backdrop-blur-md border border-slate-200/60 dark:border-emerald-800/40 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing mb-3 group ${isDragging ? 'opacity-50 z-50 ring-2 ring-emerald-500' : ''}`}
      onClick={(e) => {
        // Prevent triggering click when dragging
        if (!isDragging && onClick) {
          onClick();
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-mono text-slate-400 dark:text-emerald-600/70">
          #{order.id.split('-')[0]}
        </span>
        {isLowStock && (
          <span title="Low Stock Warning">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </span>
        )}
      </div>
      
      <div className="font-bold text-slate-800 dark:text-emerald-100 text-sm mb-1 leading-tight line-clamp-1">
        {order.customer?.name || "Unknown Customer"}
      </div>
      
      <div className="text-xs text-slate-600 dark:text-emerald-300/80 mb-2">
        {order.product?.bag_size || order.manual_bag_size || "Custom"} × {order.qty} pcs
      </div>

      <div className="flex justify-between items-end mt-3 border-t border-slate-100 dark:border-emerald-900/30 pt-2">
        <div className="font-mono font-bold text-sm text-slate-700 dark:text-emerald-200">
          ৳{order.total_amount?.toLocaleString('en-IN')}
        </div>
        <div className={`text-[10px] ${dateColor}`}>
          {format(new Date(order.delivery_date), "MMM d")}
        </div>
      </div>
    </Card>
  );
}
