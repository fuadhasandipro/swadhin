"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { createProduct } from "@/lib/actions/stock";
import { cn } from "@/lib/utils";

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-3xl w-full max-w-lg overflow-hidden relative z-50 shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-emerald-100 dark:border-emerald-900/30">
              <h2 className="text-xl font-heading font-bold text-slate-800 dark:text-emerald-100">নতুন স্টক যুক্ত করুন</h2>
              <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-emerald-300 bg-slate-100 dark:bg-emerald-900/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Bag Size */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">ব্যাগ সাইজ (e.g. 13x15)</label>
                  <input
                    {...register("bag_size")}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="13x15"
                  />
                  {errors.bag_size && <p className="text-red-500 text-xs mt-1">{errors.bag_size.message}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {SIZES.map(s => (
                      <button type="button" key={s} onClick={() => setValue("bag_size", s)} className={cn("px-3 py-1 rounded-full text-xs border transition-colors", currentSize === s ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-100 dark:bg-emerald-900/20 text-slate-600 dark:text-emerald-400 border-slate-200 dark:border-emerald-900/50 hover:bg-slate-200 dark:hover:bg-emerald-900/40")}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">রঙ</label>
                  <input
                    {...register("bag_color")}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="রঙ"
                  />
                  {errors.bag_color && <p className="text-red-500 text-xs mt-1">{errors.bag_color.message}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {COLORS.map(c => (
                      <button type="button" key={c} onClick={() => setValue("bag_color", c)} className={cn("px-3 py-1 rounded-full text-xs border transition-colors", currentColor === c ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-100 dark:bg-emerald-900/20 text-slate-600 dark:text-emerald-400 border-slate-200 dark:border-emerald-900/50 hover:bg-slate-200 dark:hover:bg-emerald-900/40")}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GSM & Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">GSM</label>
                    <input
                      type="number"
                      {...register("gsm", { valueAsNumber: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {errors.gsm && <p className="text-red-500 text-xs mt-1">{errors.gsm.message}</p>}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {GSMS.map(g => (
                        <button type="button" key={g} onClick={() => setValue("gsm", g)} className={cn("px-2 py-1 rounded-full text-[10px] border transition-colors", currentGsm === g ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-100 dark:bg-emerald-900/20 text-slate-600 dark:text-emerald-400 border-slate-200 dark:border-emerald-900/50 hover:bg-slate-200 dark:hover:bg-emerald-900/40")}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">ক্রয় মূল্য/পিস (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("cost_per_piece", { valueAsNumber: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {errors.cost_per_piece && <p className="text-red-500 text-xs mt-1">{errors.cost_per_piece.message}</p>}
                  </div>
                </div>

                {/* Initial Qty */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">প্রাথমিক পরিমাণ (Qty)</label>
                  <input
                    type="number"
                    {...register("qty", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  {errors.qty && <p className="text-red-500 text-xs mt-1">{errors.qty.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "স্টক যুক্ত করুন"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
