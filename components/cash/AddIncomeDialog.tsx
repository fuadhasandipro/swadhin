"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PlusCircle } from "lucide-react";
import { addCashTransaction } from "@/lib/actions/cash";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

const incomeSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().optional()
});

type FormValues = z.infer<typeof incomeSchema>;

export function AddIncomeDialog({ 
  isOpen, 
  onClose,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { amount: undefined, category: "other", description: "", date: new Date().toISOString().split('T')[0] }
  });

  const category = watch("category");

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      await addCashTransaction({
        type: 'in',
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: data.date
      });
      toast.success("Income recorded successfully");
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
            <PlusCircle size={20} />
            Add Income Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

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
            <Label>Category</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("category")}
            >
              <option value="other">Other Income</option>
            </select>
            {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              type="text"
              {...register("description")}
              placeholder="e.g. Advance for order #123"
            />
            {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              {...register("date")}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Record Income"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
