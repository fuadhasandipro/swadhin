"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, HandCoins } from "lucide-react";
import { paySalary } from "@/lib/actions/salary";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

const paySchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof paySchema>;

export function PaySalaryDialog({ 
  isOpen, 
  onClose,
  employee,
  month,
  dueAmount,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  employee: { id: string, name: string };
  month: string; // e.g. "2026-05"
  dueAmount: number;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(paySchema),
    defaultValues: { amount: dueAmount, notes: "" }
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    if (data.amount > dueAmount) {
      setError(`Amount cannot exceed the total due (৳${dueAmount})`);
      return;
    }

    try {
      await paySalary(employee.id, month, data.amount, data.notes);
      toast.success("Salary paid successfully");
      reset();
      if (onSuccess) onSuccess();
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
            <HandCoins size={20} />
            Pay Salary
          </DialogTitle>
          <DialogDescription>
            Record salary payment for {employee.name} for {month}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-slate-100 dark:border-emerald-900/30 flex justify-between items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-emerald-500/70">Total Due:</p>
            <p className="text-lg font-bold text-red-500">৳{dueAmount.toLocaleString('en-IN')}</p>
          </div>

          <div className="space-y-2">
            <Label>Amount (৳)</Label>
            <Input
              type="number"
              {...register("amount", { valueAsNumber: true })}
              className="text-lg font-bold"
              placeholder="e.g. 5000"
            />
            {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              type="text"
              {...register("notes")}
              placeholder="e.g. Bkash / Bonus included"
            />
          </div>

          <Button type="submit" disabled={isSubmitting || dueAmount <= 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Processing..." : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
