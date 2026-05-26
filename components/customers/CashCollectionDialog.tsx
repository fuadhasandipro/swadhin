"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, HandCoins } from "lucide-react";
import { recordCashCollection } from "@/lib/actions/customers";
import { Customer } from "@/types";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins size={20} className="text-emerald-600 dark:text-emerald-500" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-xl border mt-2 flex justify-between items-center">
          <p className="text-sm font-medium text-muted-foreground">Total Due:</p>
          <p className="text-lg font-bold text-destructive">৳{maxCollection.toLocaleString('en-IN')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

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
            <Label>{t('description')} (Optional)</Label>
            <Input
              type="text"
              {...register("description")}
              placeholder="e.g. Bkash / Cash / Bank"
            />
            {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || maxCollection === 0}
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
