"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, PackagePlus } from "lucide-react";
import { restockProduct } from "@/lib/actions/stock";
import { Product } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const restockSchema = z.object({
  add_qty: z.number().int().min(1, "Quantity must be > 0")
});

export function RestockDialog({ isOpen, onClose, product }: { isOpen: boolean; onClose: () => void; product: Product | null }) {
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<{add_qty: number}>({
    resolver: zodResolver(restockSchema),
  });

  const onSubmit = async (data: { add_qty: number }) => {
    if (!product) return;
    setError(null);
    try {
      await restockProduct(product.id, data.add_qty);
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
      <DialogContent className="sm:max-w-[400px]">
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
              <div className="flex justify-between mt-2">
                <p className="text-sm text-muted-foreground">বর্তমান স্টক: <span className="font-bold text-foreground">{product.qty}</span> পিস</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label>নতুন যুক্ত পরিমাণ (Qty)</Label>
                <Input
                  type="number"
                  {...register("add_qty", { valueAsNumber: true })}
                  className="text-lg font-bold"
                  placeholder="উদা: 5000"
                  autoFocus
                />
                {errors.add_qty && <p className="text-destructive text-xs">{errors.add_qty.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
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
