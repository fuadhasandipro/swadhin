"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, ArrowRightLeft } from "lucide-react";
import { adjustBalance } from "@/lib/actions/customers";
import { Customer } from "@/types";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-emerald-600 dark:text-emerald-500" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('type')}</Label>
            <select
              {...register("type")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="debit">{t('debit')}</option>
              <option value="credit">{t('credit')}</option>
            </select>
            {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('amount')} (৳)</Label>
            <Input
              type="number"
              {...register("amount", { valueAsNumber: true })}
              className="text-lg font-bold"
              placeholder="5000"
            />
            {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('description')}</Label>
            <Input
              type="text"
              {...register("description")}
              placeholder="e.g. Previous due / Error correction"
            />
            {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Processing..." : t('submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
