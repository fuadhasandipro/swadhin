"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { useRealtimeOrders } from "@/lib/hooks/useRealtimeOrders";
import { updateOrderStatus } from "@/lib/actions/orders";
import { OrderStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/routing";

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: 'order_placed', title: 'Order Placed' },
  { status: 'designing', title: 'Designing' },
  { status: 'design_waiting_confirmation', title: 'Design Wait Confirm' },
  { status: 'design_confirmed', title: 'Design Confirmed' },
  { status: 'waiting_for_plate', title: 'Wait Plate' },
  { status: 'plate_done', title: 'Plate Done' },
  { status: 'waiting_stock', title: 'Wait Stock' },
  { status: 'waiting_print', title: 'Wait Print' },
  { status: 'one_color_done', title: '1st Color Done' },
  { status: 'drying', title: 'Drying' },
  { status: 'two_color_done', title: '2nd Color Done' },
  { status: 'waiting_handle', title: 'Wait Handle' },
  { status: 'handle_done', title: 'Handle Done' },
  { status: 'ready_delivery', title: 'Ready Delivery' },
  { status: 'on_the_way', title: 'On The Way' },
  { status: 'delivered', title: 'Delivered' },
  { status: 'canceled', title: 'Canceled' }
];

export function KanbanBoard() {
  const { 
    orders, 
    loading, 
    error,
    search, setSearch,
    showOverdue, setShowOverdue,
    dateRange, setDateRange,
    updateOrderOptimistically
  } = useRealtimeOrders();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as string;
    const newStatus = over.id as OrderStatus;
    const order = orders.find(o => o.id === orderId);

    if (order && order.status !== newStatus) {
      const oldStatus = order.status;
      
      // Basic client-side validation (backend also validates)
      if (newStatus !== 'canceled') {
        const oldIdx = COLUMNS.findIndex(c => c.status === oldStatus);
        const newIdx = COLUMNS.findIndex(c => c.status === newStatus);
        if (newIdx <= oldIdx) {
          toast.error("Status can only move forward");
          return;
        }
      }

      // Optimistic update
      updateOrderOptimistically(orderId, { status: newStatus });
      
      try {
        await updateOrderStatus(orderId, newStatus);
        toast.success("Order status updated");
      } catch (err: any) {
        // Revert on failure
        updateOrderOptimistically(orderId, { status: oldStatus });
        toast.error(err.message || "Failed to update status");
      }
    }
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value ? new Date(value) : undefined
    }));
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl">{error}</div>;
  }

  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between mb-4 bg-white/80 dark:bg-emerald-950/20 p-4 rounded-xl border border-slate-200 dark:border-emerald-800/30">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search customer or ID..." 
              className="pl-9 h-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto border-l sm:pl-4 border-slate-200 dark:border-emerald-800/40">
            <Checkbox id="overdue" checked={showOverdue} onCheckedChange={(c: boolean) => setShowOverdue(c)} />
            <Label htmlFor="overdue" className="text-sm cursor-pointer whitespace-nowrap">মেয়াদ উত্তীর্ণ (Overdue)</Label>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input 
            type="date" 
            className="h-10 w-full sm:w-[140px]" 
            onChange={(e) => handleDateChange('from', e.target.value)} 
          />
          <span className="text-slate-400">-</span>
          <Input 
            type="date" 
            className="h-10 w-full sm:w-[140px]" 
            onChange={(e) => handleDateChange('to', e.target.value)} 
          />
        </div>
      </div>

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-y-auto md:overflow-y-hidden md:overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-4 md:h-full md:w-max px-1">
            {COLUMNS.map(col => (
              <KanbanColumn 
                key={col.status}
                status={col.status}
                title={col.title}
                orders={orders.filter(o => o.status === col.status)}
                onCardClick={(id) => setSelectedOrderId(id)}
              />
            ))}
          </div>
        </div>
      </DndContext>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <SheetContent className="bg-white/95 dark:bg-[#0a0f0a]/95 backdrop-blur-xl border-l border-slate-200 dark:border-emerald-800/50 w-full sm:max-w-md">
          {selectedOrder && (
            <div className="flex flex-col h-full">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl">Order #{selectedOrder.id.split('-')[0]}</SheetTitle>
                <SheetDescription>
                  Customer: {selectedOrder.customer?.name} ({selectedOrder.customer?.phone})
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-emerald-100 pr-4">
                <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 dark:border-emerald-900/30 pb-4">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold">{selectedOrder.status}</span>
                  
                  <span className="text-slate-500">Delivery Date:</span>
                  <span>{new Date(selectedOrder.delivery_date).toLocaleDateString()}</span>
                  
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">৳{selectedOrder.total_amount?.toLocaleString()}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 pb-4">
                  <span className="text-slate-500">Bag Size:</span>
                  <span>{selectedOrder.product?.bag_size || selectedOrder.manual_bag_size || "Custom"}</span>
                  
                  <span className="text-slate-500">Quantity:</span>
                  <span>{selectedOrder.qty} pcs</span>
                  
                  <span className="text-slate-500">GSM:</span>
                  <span>{selectedOrder.gsm}</span>
                  
                  <span className="text-slate-500">Body Color:</span>
                  <span>{selectedOrder.body_color}</span>
                </div>
              </div>
              
              <div className="mt-auto pt-6 pb-4">
                <Button 
                  className="w-full h-12"
                  onClick={() => router.push(`/orders/${selectedOrder.id}`)}
                >
                  View Full Details <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
