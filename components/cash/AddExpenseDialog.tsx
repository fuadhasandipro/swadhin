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
import { recordSupplierPayment, recordSupplierPurchase } from "@/lib/actions/suppliers";
import { toast } from "react-hot-toast";



const expenseSchema = z.object({
  amount: z.number().min(0, "Amount must be >= 0"),
  total_amount: z.number().optional(),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().optional(),
  employee_id: z.string().optional(),
  salary_month: z.string().optional(),
  supplier_id: z.string().optional()
});

type FormValues = z.infer<typeof expenseSchema>;

export function AddExpenseDialog({ 
  isOpen, 
  onClose,
  cashInHand,
  expenseCategories,
  employees,
  suppliers,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  cashInHand: number;
  expenseCategories: { id: string, name: string }[];
  employees: any[];
  suppliers?: { id: string; name: string; balance: number }[];
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { 
      amount: undefined,
      total_amount: undefined,
      category: "", 
      description: "", 
      date: new Date().toISOString().split('T')[0],
      employee_id: "",
      salary_month: new Date().toISOString().slice(0, 7), // YYYY-MM
      supplier_id: ""
    }
  });

  const category = watch("category");
  const amount = watch("amount") || 0;
  const employee_id = watch("employee_id");
  const supplier_id = watch("supplier_id");

  const selectedSupplier = suppliers?.find(s => s.id === supplier_id);

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
      } else if (data.category === 'supplier_purchase') {
        if (!data.supplier_id) throw new Error("Supplier is required.");
        if (!data.total_amount || data.total_amount <= 0) throw new Error("Total amount must be greater than 0.");
        await recordSupplierPurchase({
          supplier_id: data.supplier_id,
          amount: data.total_amount,
          paid_amount: data.amount,
          description: data.description || "Supplier purchase",
          date: data.date
        });
      } else if (data.category.toLowerCase().includes('supplier')) {
        if (!data.supplier_id) throw new Error("Supplier is required for supplier payments.");
        if (data.amount <= 0) throw new Error("Payment amount must be greater than 0.");
        await recordSupplierPayment({
          supplier_id: data.supplier_id,
          amount: data.amount,
          description: data.description || "Payment to supplier",
          date: data.date
        });
      } else {
        if (!data.description) throw new Error("Description is required.");
        if (data.amount <= 0) throw new Error("Expense amount must be greater than 0.");
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
      
      toast.success(data.category === 'salary' ? "Salary paid successfully" : data.category.toLowerCase().includes('supplier') ? "Supplier payment recorded" : "Expense recorded successfully");
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

          {category === 'supplier_purchase' && (
            <div className="space-y-2">
              <Label>Total Bill Amount (৳)</Label>
              <Input
                type="number"
                {...register("total_amount", { valueAsNumber: true })}
                className="text-lg font-bold"
                placeholder="e.g. 50000"
              />
              {errors.total_amount && <p className="text-red-500 text-xs">{errors.total_amount.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>{category === 'supplier_purchase' ? "Paid Now (৳) - Cash Out" : "Amount (৳)"}</Label>
            <Input
              type="number"
              {...register("amount", { valueAsNumber: true })}
              className="text-lg font-bold"
              placeholder={category === 'supplier_purchase' ? "e.g. 10000 or 0" : "e.g. 1500"}
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
              <option value="supplier_purchase">Supplier Purchase</option>
              <option value="supplier_payment">Supplier Payment</option>
              <option value="salary">Salary</option>
              {expenseCategories.filter(c => c.name.toLowerCase() !== 'salary' && !c.name.toLowerCase().includes('purchase') && !c.name.toLowerCase().includes('supplier payment') && c.name !== 'supplier_payment').map(c => (
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

          {(category === 'supplier_purchase' || category.toLowerCase().includes('supplier')) && (
            <div className="space-y-2">
              <Label>Supplier</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("supplier_id")}
              >
                <option value="">Select Supplier</option>
                {suppliers?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.supplier_id && <p className="text-red-500 text-xs">{errors.supplier_id.message}</p>}
              
              {selectedSupplier && (
                <div className={`text-xs p-2 mt-1 rounded border ${selectedSupplier.balance > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  Current Balance: {selectedSupplier.balance > 0 ? `We owe them ৳${selectedSupplier.balance.toLocaleString()}` : selectedSupplier.balance < 0 ? `They owe us ৳${Math.abs(selectedSupplier.balance).toLocaleString()}` : `Fully Settled (৳0)`}
                </div>
              )}
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
