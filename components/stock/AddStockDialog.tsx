"use client";

import { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

const addStockSchema = z.object({
  bag_size: z.string().regex(/^\d{1,2}x\d{1,2}$/i, "Format must be like 13x15"),
  bag_color: z.string().min(2, "Required"),
  gsm: z.number().min(30).max(200),
  cost_per_piece: z.number().min(0.01, "Cost must be > 0"),
  qty: z.number().int().min(1, "Quantity must be > 0"),
  cutting_type: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  supplier_id: z.string().optional(),
});

type FormValues = z.infer<typeof addStockSchema>;

const SIZES = ["10x14", "13x15", "14x16", "16x20"];
const COLORS = ["White", "Red", "Paste", "Yellow", "Golden", "Blue", "Black"];
const GSMS = [45, 50, 60, 70, 80, 90];

export function AddStockDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(addStockSchema),
    defaultValues: { bag_size: "", bag_color: "White", gsm: 70, cost_per_piece: undefined, qty: undefined as any, cutting_type: "handle", category: "raw_material", supplier_id: "" }
  });

  const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([]);
  useEffect(() => {
    createClient().from('suppliers').select('id, name').order('name').then(({ data }) => {
      if (data) setSuppliers(data);
    });
  }, []);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      await createProduct({ ...data, bag_size: data.bag_size.toLowerCase() });
      toast.success("Stock added successfully");
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

            {/* Cutting Type */}
            <div className="space-y-2">
              <Label>Cutting Type</Label>
              <select
                {...register("cutting_type")}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-800/50 dark:bg-[#0a0f0a]"
              >
                <option value="handle">Handle Cut</option>
                <option value="d-cut">D-Cut</option>
              </select>
              {errors.cutting_type && <p className="text-destructive text-xs">{errors.cutting_type.message}</p>}
            </div>

            {/* Supplier */}
            {suppliers.length > 0 && (
              <div className="space-y-2">
                <Label>সরবরাহকারী (Supplier) - Optional</Label>
                <select
                  {...register("supplier_id")}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-800/50 dark:bg-[#0a0f0a]"
                >
                  <option value="">-- None --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

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
