"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, HandCoins } from "lucide-react";
import { recordCashCollection } from "@/lib/actions/customers";
import { Customer } from "@/types";
import { useTranslations } from "next-intl";

export function CashCollectionDialog({ 
  isOpen, 
  onClose, 
  customer 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  customer: Customer | null 
}) {
  const t = useTranslations("customers.collection");
  const [error, setError] = useState<string | null>(null);

  // If customer.balance is negative, it means they owe us money.
  // The max amount we can collect is Math.abs(balance).
  const maxCollection = customer && customer.balance < 0 ? Math.abs(customer.balance) : 0;
  
  const collectionSchema = z.object({
    amount: z.number()
      .min(1, "Amount must be greater than 0")
      .max(maxCollection > 0 ? maxCollection : 99999999, "Cannot collect more than what is owed"),
    description: z.string().optional()
  });

  type FormValues = z.infer<typeof collectionSchema>;
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: { amount: undefined, description: "" }
  });

  const onSubmit = async (data: FormValues) => {
    if (!customer) return;
    setError(null);
    try {
      await recordCashCollection(customer.id, data.amount, data.description || "");
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

  if (!isOpen || !customer) return null;

  return (
    <AnimatePresence>
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
          className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-3xl w-full max-w-md overflow-hidden relative z-50 shadow-2xl"
        >
          <div className="flex justify-between items-center p-6 border-b border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 text-slate-800 dark:text-emerald-100">
              <HandCoins size={20} className="text-emerald-600 dark:text-emerald-500" />
              <h2 className="text-xl font-heading font-bold">{t('title')}</h2>
            </div>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-emerald-300 bg-slate-100 dark:bg-emerald-900/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-[#0d1a0e] border-b border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
            <p className="text-sm font-medium text-slate-600 dark:text-emerald-400">Total Due:</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">৳{maxCollection.toLocaleString('en-IN')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">{t('amount')} (৳)</label>
              <input
                type="number"
                {...register("amount", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0a0f0a] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-lg font-bold"
                placeholder="5000"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">{t('description')} (Optional)</label>
              <input
                type="text"
                {...register("description")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0a0f0a] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. Bkash / Cash / Bank"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || maxCollection === 0}
              className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : t('submit')}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
