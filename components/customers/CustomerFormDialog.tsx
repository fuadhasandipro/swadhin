"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import { Customer } from "@/types";
import { useTranslations } from "next-intl";

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
  address: z.string().min(5, "Address is required"),
  balance: z.number(),
});

type FormValues = z.infer<typeof customerSchema>;

export function CustomerFormDialog({ 
  isOpen, 
  onClose, 
  customer = null 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  customer?: Customer | null 
}) {
  const t = useTranslations("customers");
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { 
      name: customer?.name || "", 
      phone: customer?.phone || "", 
      address: customer?.address || "", 
      balance: customer?.balance || 0 
    }
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      if (customer) {
        await updateCustomer(customer.id, data);
      } else {
        await createCustomer(data);
      }
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
              <h2 className="text-xl font-heading font-bold text-slate-800 dark:text-emerald-100">
                {customer ? t('editCustomerTitle') : t('addCustomerTitle')}
              </h2>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">{t('form.name')}</label>
                <input
                  {...register("name")}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="e.g. Rahim Uddin"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">{t('form.phone')}</label>
                <input
                  {...register("phone")}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="01XXXXXXXXX"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">{t('form.address')}</label>
                <textarea
                  {...register("address")}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  placeholder="Dhaka, Bangladesh"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message as string}</p>}
              </div>

              {!customer && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-emerald-300 mb-1">{t('form.openingBalance')}</label>
                  <input
                    type="number"
                    {...register("balance", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-[#0d1a0e] text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <p className="text-xs text-slate-500 dark:text-emerald-500/70 mt-1">{t('form.openingBalanceDesc')}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : customer ? t('form.update') : t('form.submit')}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
