"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PackagePlus } from "lucide-react";
import { restockProduct } from "@/lib/actions/stock";
import { Product } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

const restockSchema = z.object({
  add_qty: z.number().int().min(1, "Quantity must be > 0"),
  cost_per_piece: z.number().min(0, "Must be >= 0").optional(),
  supplier_id: z.string().optional(),
  paid_amount: z.number().min(0).optional(),
  description: z.string().optional(),
});

export function RestockDialog({
  isOpen,
  onClose,
  product,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    createClient()
      .from("suppliers")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setSuppliers(data);
      });
  }, []);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<{
    add_qty: number;
    cost_per_piece?: number;
    supplier_id?: string;
    paid_amount?: number;
    description?: string;
  }>({
    resolver: zodResolver(restockSchema),
  });

  const watchQty = watch("add_qty") || 0;
  const watchCost = watch("cost_per_piece") || (product?.cost_per_piece || 0);
  const totalCost = watchQty * watchCost;

  const onSubmit = async (data: {
    add_qty: number;
    cost_per_piece?: number;
    supplier_id?: string;
    paid_amount?: number;
    description?: string;
  }) => {
    if (!product) return;
    setError(null);
    try {
      await restockProduct(
        product.id,
        data.add_qty,
        data.supplier_id || undefined,
        data.paid_amount,
        data.description,
        data.cost_per_piece,
      );
      toast.success("Stock restocked successfully");
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus size={20} className="text-emerald-600" />
            রিস্টক (Restock)
          </DialogTitle>
        </DialogHeader>

        {product && (
          <>
            <div className="bg-muted p-4 rounded-xl border">
              <p className="text-sm text-muted-foreground">পণ্য:</p>
              <h3 className="font-bold text-lg">{product.bag_size} - {product.bag_color}</h3>
              <p className="text-sm text-muted-foreground">
                বর্তমান স্টক: <span className="font-bold text-foreground">{product.qty}</span> পিস
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>যুক্ত পরিমাণ (Qty) *</Label>
                  <Input
                    type="number"
                    {...register("add_qty", { valueAsNumber: true })}
                    className="text-lg font-bold"
                    placeholder="5000"
                    autoFocus
                  />
                  {errors.add_qty && <p className="text-destructive text-xs">{errors.add_qty.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>দাম/পিস (Cost/Piece) ৳</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("cost_per_piece", { valueAsNumber: true })}
                    placeholder={String(product.cost_per_piece || 0)}
                  />
                </div>
              </div>

              {totalCost > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    মোট খরচ: ৳{totalCost.toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              {suppliers.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label>সরবরাহকারী (Supplier)</Label>
                    <select
                      {...register("supplier_id")}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-emerald-800/50 dark:bg-[#0a0f0a]"
                    >
                      <option value="">-- No Supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>এখন পেমেন্ট (Paid Now) ৳</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("paid_amount", { valueAsNumber: true })}
                      placeholder="0 = সম্পূর্ণ বাকি"
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = সম্পূর্ণ ক্রেডিটে। বাকি সরবরাহকারীর বকেয়ায় যোগ হবে।
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>বিবরণ (Description)</Label>
                <Input
                  {...register("description")}
                  placeholder="e.g. Batch 12 - Karim Brothers"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "আপডেট হচ্ছে..." : "স্টক আপডেট করুন"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
