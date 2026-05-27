"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Truck } from "lucide-react";
import { recordSupplierPurchase } from "@/lib/actions/suppliers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  supplier_id: z.string().min(1, "Select a supplier"),
  amount: z.number().min(0.01, "Amount must be > 0"),
  paid_amount: z.number().min(0, "Must be >= 0"),
  description: z.string().min(2, "Description is required"),
  date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SupplierPurchaseDialog({
  isOpen,
  onClose,
  onSuccess,
  initialSuppliers = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSuppliers?: { id: string; name: string }[];
}) {
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>(initialSuppliers);

  useEffect(() => {
    if (initialSuppliers.length === 0) {
      createClient().from("suppliers").select("id, name").order("name").then(({ data }) => {
        if (data) setSuppliers(data);
      });
    }
  }, [initialSuppliers]);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { supplier_id: "", amount: undefined as any, paid_amount: 0, description: "", date: "" },
  });

  const amount = watch("amount") || 0;
  const paid = watch("paid_amount") || 0;
  const due = Math.max(0, amount - paid);

  const onSubmit = async (data: FormValues) => {
    try {
      await recordSupplierPurchase({
        supplier_id: data.supplier_id,
        amount: data.amount,
        paid_amount: data.paid_amount,
        description: data.description,
        date: data.date || undefined,
      });
      toast.success("Purchase recorded!");
      reset();
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck size={20} className="text-orange-500" />
            Supplier Purchase
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Supplier *</Label>
            <select
              {...register("supplier_id")}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-emerald-800/50 dark:bg-[#0a0f0a]"
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.supplier_id && <p className="text-destructive text-xs">{errors.supplier_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Input {...register("description")} placeholder="e.g. 500kg non-woven fabric" />
            {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Amount (৳) *</Label>
              <Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} placeholder="0.00" />
              {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Paid Now (৳)</Label>
              <Input type="number" step="0.01" {...register("paid_amount", { valueAsNumber: true })} placeholder="0 = full credit" />
            </div>
          </div>

          {amount > 0 && (
            <div className={`p-3 rounded-xl border text-sm font-medium ${due > 0 ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-300" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300"}`}>
              {due > 0
                ? `বকেয়া: ৳${due.toLocaleString()} — সরবরাহকারীর হিসেবে যোগ হবে`
                : "✓ সম্পূর্ণ পরিশোধ"}
            </div>
          )}

          <div className="space-y-2">
            <Label>Date (optional)</Label>
            <Input type="date" {...register("date")} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin mr-2" />}
            Record Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
