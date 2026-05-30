"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/lib/actions/orders";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Check, MapPin, Phone, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DeliveryClient({ initialDeliveries }: { initialDeliveries: any[] }) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<any | null>(null);

  const totalScheduled = deliveries.length;
  const onTheWay = deliveries.filter(d => d.status === 'on_the_way').length;

  const requestMarkDelivered = (order: any) => {
    setPendingOrderId(order.id);
    setPendingOrder(order);
    setConfirmOpen(true);
  };

  const handleConfirmDelivered = async () => {
    if (!pendingOrderId) return;
    const id = pendingOrderId;
    setConfirmOpen(false);
    setPendingOrderId(null);
    setPendingOrder(null);

    setProcessingId(id);
    try {
      await updateOrderStatus(id, 'delivered');
      toast.success("✅ অর্ডার ডেলিভারড হিসেবে চিহ্নিত করা হয়েছে!");
      setDeliveries(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Status update failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setPendingOrderId(null);
    setPendingOrder(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 flex items-start sm:items-center gap-3">
        <Truck className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" size={20} />
        <p className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          {totalScheduled} deliveries scheduled for today. {onTheWay} are on the way. Mark orders delivered to trigger customer SMS and reduce stock.
        </p>
      </div>

      {/* Main List */}
      <Card className="border-slate-200 dark:border-emerald-900/50 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-[#0a0f0a]">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-emerald-900/30 flex justify-between items-center bg-slate-50/50 dark:bg-emerald-950/10">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
            Today's schedule — {format(new Date(), "dd MMM yyyy")}
          </h2>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 border-none font-semibold">
            {totalScheduled} scheduled
          </Badge>
        </div>

        <div className="flex flex-col">
          {deliveries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No deliveries scheduled for today.</p>
            </div>
          ) : (
            deliveries.map((order, i) => (
              <div 
                key={order.id} 
                className={`p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-emerald-900/10 ${i !== deliveries.length - 1 ? 'border-b border-slate-100 dark:border-emerald-900/30' : ''}`}
              >
                {/* Left side: Order Info */}
                <div className="flex gap-4">
                  <div className="hidden sm:flex text-slate-400 font-mono text-sm mt-0.5">
                    #{order.id.slice(0, 4)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                      {order.customer?.name || "Unknown Customer"}
                      <span className="sm:hidden text-slate-400 font-mono text-xs ml-2">#{order.id.slice(0, 4)}</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={12}/> {order.customer?.address || order.location || "No address"}</span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span className="flex items-center gap-1"><Phone size={12}/> {order.customer?.phone || "No phone"}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Amount, Status, Action */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 pt-3 sm:pt-0 border-t border-slate-100 dark:border-none">
                  
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">
                      ৳{Number(order.total_amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.qty} pcs · {order.product?.bag_size || order.manual_bag_size || "Unknown"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={
                      order.status === 'on_the_way' 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }>
                      {order.status === 'on_the_way' ? 'On the way' : 'Ready'}
                    </Badge>

                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:border-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 transition-all flex gap-1.5"
                      onClick={() => requestMarkDelivered(order)}
                      disabled={processingId === order.id}
                    >
                      {processingId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {order.status === 'on_the_way' ? 'Confirm delivery' : 'Mark delivered'}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!open) handleCancelConfirm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              ডেলিভারি নিশ্চিত করুন
            </DialogTitle>
            <div className="text-slate-600 dark:text-slate-400 pt-1">
              {pendingOrder && (
                <div className="mt-2 space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{pendingOrder.customer?.name}</span> এর অর্ডারটি কি সফলভাবে ডেলিভার হয়েছে?
                  </div>
                  <div className="bg-slate-50 dark:bg-emerald-950/30 rounded-lg p-3 text-sm space-y-1.5 border border-slate-100 dark:border-emerald-900/40">
                    <div className="flex justify-between">
                      <span className="text-slate-500">অর্ডার #</span>
                      <span className="font-mono font-semibold">{pendingOrder.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">পরিমাণ</span>
                      <span>{pendingOrder.qty} পিস</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">অর্ডার মোট</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">৳{Number(pendingOrder.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">অগ্রিম পরিশোধ</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">৳{Number(pendingOrder.paid_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-emerald-900/40 pt-1.5 mt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">এই অর্ডারের বাকি</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        ৳{(Number(pendingOrder.total_amount) - Number(pendingOrder.paid_amount || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Customer Total Due */}
                  {pendingOrder.customer?.balance != null && (
                    <div className={`rounded-lg p-3 text-sm border flex justify-between items-center ${
                      pendingOrder.customer.balance < 0
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                        : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                    }`}>
                      <span className={`font-semibold ${pendingOrder.customer.balance < 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {pendingOrder.customer.name} এর মোট বকেয়া
                      </span>
                      <span className={`font-bold text-lg ${pendingOrder.customer.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ৳{Math.abs(pendingOrder.customer.balance).toLocaleString('en-IN')}
                        <span className="text-xs font-normal ml-1">{pendingOrder.customer.balance < 0 ? '(পাবো)' : '(দিব)'}</span>
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-md p-2">
                    ⚠️ একবার ডেলিভারড করলে কাস্টমারকে SMS পাঠানো হবে।
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelConfirm}>
              বাতিল
            </Button>
            <Button
              onClick={handleConfirmDelivered}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              হ্যাঁ, ডেলিভারড
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
