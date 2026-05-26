"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { OrderStatus } from "@/types";
import { updateOrderStatus } from "@/lib/actions/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useRouter } from "@/routing";
import { Loader2 } from "lucide-react";

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
      <Select value={status} onValueChange={(v: any) => setStatus(v)} disabled={loading}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
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
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Updating..." : t("detail.changeStatus")}
        </Button>
      )}
    </div>
  );
}
