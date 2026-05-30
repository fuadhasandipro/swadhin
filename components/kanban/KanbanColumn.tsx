"use client";

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./KanbanCard";
import { OrderStatus } from "@/types";

interface KanbanColumnProps {
  status: OrderStatus;
  title: string;
  orders: any[];
  onCardClick: (orderId: string) => void;
}

export function KanbanColumn({ status, title, orders, onCardClick }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  // Dynamic header styles
  let headerColor = "bg-slate-100/80 dark:bg-emerald-900/20 text-slate-700 dark:text-emerald-100 border-slate-200 dark:border-emerald-800/40";
  if (status === 'waiting_stock') {
    headerColor = "bg-amber-100/80 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/40";
  } else if (status === 'canceled') {
    headerColor = "bg-red-100/80 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/40";
  } else if (status === 'delivered') {
    headerColor = "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/40";
  }

  return (
    <div className="flex flex-col shrink-0 w-[210px] bg-slate-50/50 dark:bg-[#0a0f0a]/50 rounded-xl border border-slate-200/50 dark:border-emerald-900/30 h-full max-h-full overflow-hidden transition-colors">
      
      {/* Column Header */}
      <div className={`px-3 py-2 border-b backdrop-blur-sm flex justify-between items-center shrink-0 ${headerColor}`}>
        <h3 className="font-bold text-xs">{title}</h3>
        <span className="text-[10px] font-mono font-semibold bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-full">
          {orders.length}
        </span>
      </div>

      {/* Scrollable Card Area */}
      <div 
        ref={setNodeRef} 
        className={`flex-1 overflow-y-auto p-2 transition-colors duration-200 ${isOver ? 'bg-slate-100/50 dark:bg-emerald-900/10' : ''}`}
      >
        {orders.map(order => (
          <KanbanCard 
            key={order.id} 
            order={order} 
            onClick={() => onCardClick(order.id)} 
          />
        ))}
        {orders.length === 0 && (
          <div className="h-20 flex items-center justify-center text-slate-400 dark:text-emerald-700/50 border-2 border-dashed border-slate-200 dark:border-emerald-900/30 rounded-lg text-xs font-medium">
            Empty
          </div>
        )}
      </div>

    </div>
  );
}
