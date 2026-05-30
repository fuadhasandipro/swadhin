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
      className={`relative p-2.5 bg-white/80 dark:bg-emerald-950/40 backdrop-blur-md border border-slate-200/60 dark:border-emerald-800/40 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing mb-2 group ${isDragging ? 'opacity-50 z-50 ring-2 ring-emerald-500' : ''}`}
      onClick={(e) => {
        // Prevent triggering click when dragging
        if (!isDragging && onClick) {
          onClick();
        }
      }}
    >
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-[10px] font-mono text-slate-400 dark:text-emerald-600/70">
          #{order.id.split('-')[0]}
        </span>
        {isLowStock && (
          <span title="Low Stock Warning">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </span>
        )}
      </div>
      
      <div className="font-bold text-slate-800 dark:text-emerald-100 text-[13px] mb-1.5 leading-tight line-clamp-1">
        {order.customer?.name || "Unknown Customer"}
      </div>
      
      <div className="text-[11px] text-slate-600 dark:text-emerald-300/80 space-y-1.5 mb-2">
        <div className="flex justify-between font-medium text-slate-700 dark:text-emerald-200">
          <span>{order.product?.bag_size || order.manual_bag_size || "Custom"} <span className="text-slate-400 font-normal">|</span> {order.gsm}g</span>
          <span>{order.qty?.toLocaleString()} pcs</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal border-slate-200 bg-slate-50 dark:bg-emerald-950/50 dark:border-emerald-800/50 capitalize">
            {order.cutting_type}
          </Badge>
          {order.body_color && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal border-slate-200 bg-slate-50 dark:bg-emerald-950/50 dark:border-emerald-800/50">
              Body: {order.body_color}
            </Badge>
          )}
          {order.print_color_config && (order.print_color_config.color || order.print_color_config.name) && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal border-slate-200 bg-slate-50 dark:bg-emerald-950/50 dark:border-emerald-800/50">
              Print: {order.print_color_config.color || order.print_color_config.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end mt-2 border-t border-slate-100 dark:border-emerald-900/30 pt-1.5">
        <div className="font-mono font-bold text-xs text-slate-700 dark:text-emerald-200">
          ৳{order.total_amount?.toLocaleString('en-IN')}
        </div>
        <div className={`text-[10px] ${dateColor}`}>
          {format(new Date(order.delivery_date), "MMM d")}
        </div>
      </div>
    </Card>
  );
}
