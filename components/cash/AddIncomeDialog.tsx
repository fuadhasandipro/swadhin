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
import { recordCashCollection } from "@/lib/actions/customers";
import { recordSupplierRefund } from "@/lib/actions/suppliers";
import { toast } from "react-hot-toast";

const incomeSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().optional(),
  customer_id: z.string().optional(),
  supplier_id: z.string().optional()
});

type FormValues = z.infer<typeof incomeSchema>;

export function AddIncomeDialog({ 
  isOpen, 
  onClose,
  customers,
  suppliers,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  customers?: { id: string; name: string; phone: string; balance: number }[];
  suppliers?: { id: string; name: string; balance: number }[];
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { amount: undefined, category: "other", description: "", date: new Date().toISOString().split('T')[0], customer_id: "", supplier_id: "" }
  });

  const category = watch("category");
  const customer_id = watch("customer_id");
  const supplier_id = watch("supplier_id");

  const selectedCustomer = customers?.find(c => c.id === customer_id);
  const selectedSupplier = suppliers?.find(s => s.id === supplier_id);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      if (data.category === 'customer_collection') {
        if (!data.customer_id) throw new Error("Customer is required for collections.");
        await recordCashCollection(data.customer_id, data.amount, data.description || "Cash Collection");
      } else if (data.category === 'supplier_refund') {
        if (!data.supplier_id) throw new Error("Supplier is required for refunds.");
        await recordSupplierRefund({
          supplier_id: data.supplier_id,
          amount: data.amount,
          description: data.description || "Refund from supplier",
          date: data.date
        });
      } else {
        await addCashTransaction({
          type: 'in',
          category: data.category,
          amount: data.amount,
          description: data.description,
          date: data.date
        });
      }
      toast.success(
        data.category === 'customer_collection' ? "Collection recorded" :
        data.category === 'supplier_refund' ? "Refund recorded" : "Income recorded"
      );
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
              <option value="customer_collection">Customer Collection</option>
              <option value="supplier_refund">Supplier Refund</option>
            </select>
            {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
          </div>

          {category === 'customer_collection' && (
            <div className="space-y-2">
              <Label>Customer</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("customer_id")}
              >
                <option value="">Select Customer</option>
                {customers?.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
              </select>
              {errors.customer_id && <p className="text-red-500 text-xs">{errors.customer_id.message}</p>}
              
              {selectedCustomer && (
                <div className={`text-xs p-2 mt-1 rounded border ${selectedCustomer.balance < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  Current Balance: {selectedCustomer.balance < 0 ? `They owe us ৳${Math.abs(selectedCustomer.balance).toLocaleString()}` : `We owe them ৳${selectedCustomer.balance.toLocaleString()}`}
                </div>
              )}
            </div>
          )}

          {category === 'supplier_refund' && (
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
