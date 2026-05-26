"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2 } from "lucide-react";
import { createProduct } from "@/lib/actions/stock";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const addStockSchema = z.object({
  bag_size: z.string().regex(/^\d{1,2}x\d{1,2}$/i, "Format must be like 13x15"),
  bag_color: z.string().min(2, "Required"),
  gsm: z.number().min(30).max(200),
  cost_per_piece: z.number().min(0.01, "Cost must be > 0"),
  qty: z.number().int().min(1, "Quantity must be > 0")
});

type FormValues = z.infer<typeof addStockSchema>;

const SIZES = ["10x14", "13x15", "14x16", "16x20"];
const COLORS = ["White", "Green", "Blue", "Red", "Yellow"];
const GSMS = [70, 80, 90, 100];

export function AddStockDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(addStockSchema),
    defaultValues: { bag_size: "", bag_color: "White", gsm: 70, cost_per_piece: undefined, qty: undefined as any }
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      await createProduct({ ...data, bag_size: data.bag_size.toLowerCase() });
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

  const currentSize = watch("bag_size");
  const currentColor = watch("bag_color");
  const currentGsm = watch("gsm");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>নতুন স্টক যুক্ত করুন</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Bag Size */}
            <div className="space-y-2">
              <Label>ব্যাগ সাইজ (e.g. 13x15)</Label>
              <Input
                {...register("bag_size")}
                placeholder="13x15"
              />
              {errors.bag_size && <p className="text-destructive text-xs">{errors.bag_size.message}</p>}
              <div className="flex gap-2 flex-wrap">
                {SIZES.map(s => (
                  <Button type="button" variant={currentSize === s ? "default" : "outline"} size="sm" key={s} onClick={() => setValue("bag_size", s)} className="rounded-full">
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>রঙ</Label>
              <Input
                {...register("bag_color")}
                placeholder="রঙ"
              />
              {errors.bag_color && <p className="text-destructive text-xs">{errors.bag_color.message}</p>}
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <Button type="button" variant={currentColor === c ? "default" : "outline"} size="sm" key={c} onClick={() => setValue("bag_color", c)} className="rounded-full">
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            {/* GSM & Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GSM</Label>
                <Input
                  type="number"
                  {...register("gsm", { valueAsNumber: true })}
                />
                {errors.gsm && <p className="text-destructive text-xs">{errors.gsm.message}</p>}
                <div className="flex gap-1.5 flex-wrap">
                  {GSMS.map(g => (
                    <Button type="button" variant={currentGsm === g ? "default" : "outline"} size="sm" key={g} onClick={() => setValue("gsm", g)} className="h-6 text-[10px] px-2 rounded-full">
                      {g}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>ক্রয় মূল্য/পিস (৳)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("cost_per_piece", { valueAsNumber: true })}
                />
                {errors.cost_per_piece && <p className="text-destructive text-xs">{errors.cost_per_piece.message}</p>}
              </div>
            </div>

            {/* Initial Qty */}
            <div className="space-y-2">
              <Label>প্রাথমিক পরিমাণ (Qty)</Label>
              <Input
                type="number"
                {...register("qty", { valueAsNumber: true })}
              />
              {errors.qty && <p className="text-destructive text-xs">{errors.qty.message}</p>}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "যুক্ত হচ্ছে..." : "স্টক যুক্ত করুন"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
