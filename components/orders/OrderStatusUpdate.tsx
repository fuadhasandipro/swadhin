"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { OrderStatus } from "@/types";
import { updateOrderStatus } from "@/lib/actions/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useRouter } from "@/routing";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const ORDER_STATUS_FLOW: OrderStatus[] = [
  'order_placed', 'designing', 'design_waiting_confirmation', 'design_confirmed', 
  'waiting_for_plate', 'plate_done', 'waiting_stock', 'waiting_print', 
  'one_color_done', 'drying', 'two_color_done', 'waiting_handle', 
  'handle_done', 'ready_delivery', 'on_the_way', 'delivered', 'canceled'
];

export function OrderStatusUpdate({ 
  orderId, 
  currentStatus,
  compact = false
}: { 
  orderId: string; 
  currentStatus: OrderStatus;
  compact?: boolean;
}) {
  const t = useTranslations("orders");
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  const doUpdate = async (targetStatus: OrderStatus) => {
    setLoading(true);
    try {
      await updateOrderStatus(orderId, targetStatus);
      setStatus(targetStatus);
      toast.success(t("detail.updateSuccess"));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || t("detail.updateError"));
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    if (status === currentStatus) return;
    setPendingStatus(status);
    setConfirmOpen(true);
  };

  const handleStatusChange = (v: OrderStatus | null) => {
    if (!v) return;
    if (compact) {
      if (v === currentStatus) return;
      setPendingStatus(v);
      setConfirmOpen(true);
    } else {
      setStatus(v);
    }
  };

  const handleConfirm = async () => {
    const target = pendingStatus;
    setConfirmOpen(false);
    setPendingStatus(null);
    if (target) await doUpdate(target);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
    setPendingStatus(null);
    if (!compact) setStatus(currentStatus);
  };

  const getStatusColorClasses = (s: string) => {
    switch (s) {
      case "order_placed":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50";
      case "designing":
      case "design_waiting_confirmation":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/50";
      case "design_confirmed":
      case "waiting_for_plate":
      case "plate_done":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/50";
      case "waiting_stock":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-900/50";
      case "waiting_print":
      case "one_color_done":
      case "drying":
      case "two_color_done":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200/50 dark:border-orange-900/50";
      case "waiting_handle":
      case "handle_done":
        return "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200/50 dark:border-pink-900/50";
      case "ready_delivery":
      case "on_the_way":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50";
      case "delivered":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50";
      case "canceled":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-900/50";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  const pendingLabel = pendingStatus ? t(`status.${pendingStatus}`) : "";
  const currentLabel = t(`status.${currentStatus}`);

  return (
    <>
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${compact ? 'w-full' : 'w-full sm:w-auto'}`}>
        <Select value={status} onValueChange={handleStatusChange} disabled={loading}>
          <SelectTrigger className={`border font-medium ${getStatusColorClasses(status)} ${compact ? 'h-8 text-xs w-[150px]' : 'w-full sm:w-[220px] h-11 sm:h-10'}`}>
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Select Status">
                {status ? t(`status.${status}`) : "Select Status"}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_FLOW.map((s) => (
                <SelectItem key={s} value={s} className={`${compact ? 'text-xs' : ''}`}>
                  <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColorClasses(s)}`}>
                    {t(`status.${s}`)}
                  </div>
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {!compact && status !== currentStatus && (
          <Button 
            onClick={handleUpdate} 
            disabled={loading}
            size="default"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md sm:shadow-none h-11 sm:h-10"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Updating..." : t("detail.changeStatus")}
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              স্ট্যাটাস পরিবর্তন নিশ্চিত করুন
            </DialogTitle>
            <div className="text-slate-600 dark:text-slate-400 pt-2">
              আপনি কি স্ট্যাটাস পরিবর্তন করতে চান?
              <div className="mt-3 flex items-center gap-3 justify-center">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColorClasses(currentStatus)}`}>
                  {currentLabel}
                </span>
                <span className="text-slate-400">→</span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColorClasses(pendingStatus || '')}`}>
                  {pendingLabel}
                </span>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              বাতিল
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading ? "আপডেট হচ্ছে..." : "হ্যাঁ, পরিবর্তন করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
