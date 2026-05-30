"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { recordCashCollection } from "@/lib/actions/customers";
import { toast } from "react-hot-toast";

const incomeSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  date: z.string().optional(),
  customer_id: z.string().min(1, "Customer is required")
});

type FormValues = z.infer<typeof incomeSchema>;

export function CustomerCollectionForm({ 
  customers
}: { 
  customers: { id: string; name: string; phone: string; balance: number }[];
}) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { 
      amount: undefined, 
      description: "Cash Collection", 
      date: new Date().toISOString().split('T')[0], 
      customer_id: "" 
    }
  });

  const customer_id = watch("customer_id");
  const selectedCustomer = customers?.find(c => c.id === customer_id);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      await recordCashCollection(data.customer_id, data.amount, data.description || "Cash Collection");
      toast.success("Customer Collection recorded successfully");
      reset();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto mt-8 bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm">
      <CardHeader className="border-b border-slate-200 dark:border-emerald-900/50 bg-slate-50/50 dark:bg-[#0f1a0f]/50 p-6">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-500">
            <PlusCircle size={24} />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-emerald-100">Customer Collection</CardTitle>
            <CardDescription className="text-slate-500 dark:text-emerald-600/70">Record incoming payments from customers</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 text-sm rounded-xl font-medium border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold">Amount (৳)</Label>
            <Input
              type="number"
              {...register("amount", { valueAsNumber: true })}
              className="text-2xl font-bold h-14 bg-slate-50 dark:bg-[#0f1a0f]/50"
              placeholder="e.g. 5000"
            />
            {errors.amount && <p className="text-red-500 text-xs font-medium">{errors.amount.message}</p>}
          </div>

          <div className="space-y-3">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold">Customer</Label>
            <select
              className="flex h-12 w-full rounded-lg border border-input bg-slate-50 dark:bg-[#0f1a0f]/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              {...register("customer_id")}
            >
              <option value="">Select Customer</option>
              {customers?.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>
            {errors.customer_id && <p className="text-red-500 text-xs font-medium">{errors.customer_id.message}</p>}
            
            {selectedCustomer && (
              <div className={`text-sm p-3 mt-2 rounded-lg border font-medium ${selectedCustomer.balance < 0 ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'}`}>
                Current Balance: {selectedCustomer.balance < 0 ? `They owe us ৳${Math.abs(selectedCustomer.balance).toLocaleString()}` : `We owe them ৳${selectedCustomer.balance.toLocaleString()}`}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold">Description</Label>
            <Input
              type="text"
              {...register("description")}
              className="h-12 bg-slate-50 dark:bg-[#0f1a0f]/50"
              placeholder="e.g. Payment for order #123"
            />
            {errors.description && <p className="text-red-500 text-xs font-medium">{errors.description.message}</p>}
          </div>

          <div className="space-y-3">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold">Date</Label>
            <Input
              type="date"
              {...register("date")}
              className="h-12 bg-slate-50 dark:bg-[#0f1a0f]/50"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 rounded-xl transition-all">
            {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isSubmitting ? "Recording..." : "Record Collection"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
