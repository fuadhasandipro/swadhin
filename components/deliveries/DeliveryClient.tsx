"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/lib/actions/orders";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Check, MapPin, Phone, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function DeliveryClient({ initialDeliveries }: { initialDeliveries: any[] }) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const totalScheduled = deliveries.length;
  const onTheWay = deliveries.filter(d => d.status === 'on_the_way').length;

  const handleMarkDelivered = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await updateOrderStatus(orderId, 'delivered');
      toast.success("Order marked as delivered!");
      setDeliveries(prev => prev.filter(d => d.id !== orderId));
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setProcessingId(null);
    }
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
                      onClick={() => handleMarkDelivered(order.id)}
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
    </div>
  );
}
