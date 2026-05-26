"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, MinusCircle, AlertTriangle } from "lucide-react";
import { addCashTransaction } from "@/lib/actions/cash";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { paySalary } from "@/lib/actions/salary";
import { toast } from "react-hot-toast";



const expenseSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().optional(),
  employee_id: z.string().optional(),
  salary_month: z.string().optional()
});

type FormValues = z.infer<typeof expenseSchema>;

export function AddExpenseDialog({ 
  isOpen, 
  onClose,
  cashInHand,
  expenseCategories,
  employees,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  cashInHand: number;
  expenseCategories: { id: string, name: string }[];
  employees: any[];
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { 
      amount: undefined, 
      category: "", 
      description: "", 
      date: new Date().toISOString().split('T')[0],
      employee_id: "",
      salary_month: new Date().toISOString().slice(0, 7) // YYYY-MM
    }
  });

  const category = watch("category");
  const amount = watch("amount") || 0;
  const employee_id = watch("employee_id");

  useEffect(() => {
    if (category === 'salary' && employee_id) {
      const selectedEmployee = employees?.find(e => e.id === employee_id);
      if (selectedEmployee && selectedEmployee.salary_amount) {
        setValue("amount", selectedEmployee.salary_amount, { shouldValidate: true });
      } else {
        setValue("amount", undefined as any);
      }
    }
  }, [employee_id, category, employees, setValue]);

  const showWarning = amount > cashInHand;

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      if (data.category === 'salary') {
        if (!data.employee_id) throw new Error("Employee is required for salary payment.");
        if (!data.salary_month) throw new Error("Salary month is required.");
        
        await paySalary(data.employee_id, data.salary_month, data.amount, data.description || "");
      } else {
        if (!data.description) throw new Error("Description is required.");
        await addCashTransaction({
          type: 'out',
          category: 'expense',
          amount: data.amount,
          description: data.category !== 'expense' && data.category !== 'other'
            ? `[${data.category}] ${data.description}`
            : data.description,
          date: data.date
        });
      }
      
      toast.success(data.category === 'salary' ? "Salary paid successfully" : "Expense recorded successfully");
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
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("category")}
            >
              <option value="">Select Category</option>
              <option value="salary">Salary</option>
              {expenseCategories.filter(c => c.name.toLowerCase() !== 'salary').map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
          </div>

          {category === 'salary' && (
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label>Employee</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register("employee_id")}
                >
                  <option value="">Select Employee</option>
                  {employees?.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
                {errors.employee_id && <p className="text-red-500 text-xs">{errors.employee_id.message}</p>}
              </div>
              <div className="space-y-2 flex-1">
                <Label>Month</Label>
                <Input
                  type="month"
                  {...register("salary_month")}
                />
                {errors.salary_month && <p className="text-red-500 text-xs">{errors.salary_month.message}</p>}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Description / Notes</Label>
            <Input
              type="text"
              {...register("description")}
              placeholder={category === 'salary' ? "e.g. Bkash / Bonus" : "e.g. Paid for XYZ"}
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
