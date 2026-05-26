"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { OrderStatus } from "@/types";
import { updateOrderStatus } from "@/lib/actions/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useRouter } from "@/routing";

const ORDER_STATUS_FLOW: OrderStatus[] = [
  'order_placed', 'designing', 'design_waiting_confirmation', 'design_confirmed', 
  'waiting_for_plate', 'plate_done', 'waiting_stock', 'waiting_print', 
  'one_color_done', 'drying', 'two_color_done', 'waiting_handle', 
  'handle_done', 'ready_delivery', 'on_the_way', 'delivered', 'canceled'
];

export function OrderStatusUpdate({ 
  orderId, 
  currentStatus 
}: { 
  orderId: string; 
  currentStatus: OrderStatus;
}) {
  const t = useTranslations("orders");
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (status === currentStatus) return;
    
    setLoading(true);
    try {
      await updateOrderStatus(orderId, status);
      toast.success(t("detail.updateSuccess"));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || t("detail.updateError"));
      // reset status on failure
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-3">
      <Select value={status} onValueChange={(v: OrderStatus) => setStatus(v)} disabled={loading}>
        <SelectTrigger className="w-[220px] bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
          {ORDER_STATUS_FLOW.map((s, idx) => {
            // Can only move forward or cancel
            const isDisabled = s !== 'canceled' && idx < currentIndex;
            return (
              <SelectItem key={s} value={s} disabled={isDisabled}>
                {t(`status.${s}`)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {status !== currentStatus && (
        <Button 
          onClick={handleUpdate} 
          disabled={loading}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {loading ? "..." : t("detail.changeStatus")}
        </Button>
      )}
    </div>
  );
}
