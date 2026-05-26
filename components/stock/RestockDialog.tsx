"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, PackagePlus } from "lucide-react";
import { restockProduct } from "@/lib/actions/stock";
import { Product } from "@/types";

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
    <AnimatePresence>
      {isOpen && product && (
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
            className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-3xl w-full max-w-sm overflow-hidden relative z-50 shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <PackagePlus size={20} />
                <h2 className="text-xl font-heading font-bold text-slate-800 dark:text-emerald-100">রিস্টক (Restock)</h2>
              </div>
              <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-emerald-300 bg-slate-100 dark:bg-emerald-900/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-[#0d1a0e] border-b border-emerald-100 dark:border-emerald-900/30">
              <p className="text-sm text-slate-500 dark:text-emerald-500/70">পণ্য:</p>
              <h3 className="font-bold text-lg text-slate-800 dark:text-emerald-100">{product.bag_size} - {product.bag_color}</h3>
              <div className="flex justify-between mt-2">
                <p className="text-sm text-slate-600 dark:text-emerald-300">বর্তমান স্টক: <span className="font-bold">{product.qty}</span> পিস</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">নতুন যুক্ত পরিমাণ (Qty)</label>
                <input
                  type="number"
                  {...register("add_qty", { valueAsNumber: true })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0a0f0a] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-lg font-bold"
                  placeholder="উদা: 5000"
                  autoFocus
                />
                {errors.add_qty && <p className="text-red-500 text-xs mt-1">{errors.add_qty.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "স্টক আপডেট করুন"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
