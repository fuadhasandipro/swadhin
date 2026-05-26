"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ArrowRightLeft } from "lucide-react";
import { adjustBalance } from "@/lib/actions/customers";
import { Customer } from "@/types";
import { useTranslations } from "next-intl";

const adjustSchema = z.object({
  type: z.enum(["debit", "credit"]),
  amount: z.number().min(1, "Amount must be greater than 0"),
  description: z.string().min(2, "Description is required"),
});

type FormValues = z.infer<typeof adjustSchema>;

export function BalanceAdjustDialog({ 
  isOpen, 
  onClose, 
  customer 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  customer: Customer | null 
}) {
  const t = useTranslations("customers.adjust");
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: "debit", amount: undefined, description: "" }
  });

  const onSubmit = async (data: FormValues) => {
    if (!customer) return;
    setError(null);
    try {
      await adjustBalance(customer.id, data.type, data.amount, data.description);
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
              <ArrowRightLeft size={20} className="text-emerald-600 dark:text-emerald-500" />
              <h2 className="text-xl font-heading font-bold">{t('title')}</h2>
            </div>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-emerald-300 bg-slate-100 dark:bg-emerald-900/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">{t('type')}</label>
              <select
                {...register("type")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="debit">{t('debit')}</option>
                <option value="credit">{t('credit')}</option>
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">{t('amount')} (৳)</label>
              <input
                type="number"
                {...register("amount", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-lg font-bold"
                placeholder="5000"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">{t('description')}</label>
              <input
                type="text"
                {...register("description")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. Previous due / Error correction"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
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
