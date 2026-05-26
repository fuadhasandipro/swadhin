"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, MinusCircle, AlertTriangle } from "lucide-react";
import { addCashTransaction } from "@/lib/actions/cash";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";



const expenseSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().optional()
});

type FormValues = z.infer<typeof expenseSchema>;

export function AddExpenseDialog({ 
  isOpen, 
  onClose,
  cashInHand,
  expenseCategories,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  cashInHand: number;
  expenseCategories: { id: string, name: string }[];
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amount: undefined, category: "", description: "", date: new Date().toISOString().split('T')[0] }
  });

  const category = watch("category");
  const amount = watch("amount") || 0;

  const showWarning = amount > cashInHand;

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      await addCashTransaction({
        type: 'out',
        category: data.category === 'salary' ? 'salary' : 'expense', // Map specific types if needed, but DB allows 'expense' for most
        amount: data.amount,
        description: data.category !== 'expense' && data.category !== 'other' && data.category !== 'salary' 
          ? `[${data.category}] ${data.description}` // Embed sub-category in description since DB category is just 'expense'
          : data.description,
        date: data.date
      });
      toast.success("Expense recorded successfully");
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
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
            <MinusCircle size={20} />
            Add Expense Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          {showWarning && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 text-sm rounded-xl flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Warning: This expense exceeds your current Cash in Hand (৳{cashInHand.toLocaleString()}).</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Amount (৳)</Label>
            <Input
              type="number"
              {...register("amount", { valueAsNumber: true })}
              className="text-lg font-bold"
              placeholder="e.g. 1500"
            />
            {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={category} 
              onValueChange={(v: any) => setValue("category", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              type="text"
              {...register("description")}
              placeholder="e.g. Paid for XYZ"
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

          <Button type="submit" disabled={isSubmitting} variant="destructive" className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Record Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
