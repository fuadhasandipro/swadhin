"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, HandCoins } from "lucide-react";
import { recordCashCollection, getCustomers } from "@/lib/actions/customers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";

const collectionSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  description: z.string().optional()
});

type FormValues = z.infer<typeof collectionSchema>;

export function CustomerCollectionQuickEntry({ 
  isOpen, 
  onClose,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: { amount: undefined, customerId: "", description: "" }
  });

  const selectedCustomerId = watch("customerId");
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  
  const maxCollection = selectedCustomer ? Math.abs(Number(selectedCustomer.balance)) : 0;

  useEffect(() => {
    if (isOpen) {
      setLoadingCustomers(true);
      getCustomers()
        .then(data => {
          // Sort so those with negative balances (owe us) appear first
          const sorted = data.sort((a, b) => Number(a.balance) - Number(b.balance));
          setCustomers(sorted);
        })
        .finally(() => setLoadingCustomers(false));
    }
  }, [isOpen]);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    if (data.amount > maxCollection) {
      setError(`Amount cannot exceed the total due (৳${maxCollection})`);
      return;
    }

    try {
      await recordCashCollection(data.customerId, data.amount, data.description || "Quick Collection");
      toast.success("Collection recorded successfully");
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
          <DialogTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-500">
            <HandCoins size={20} />
            Customer Collection
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Select Customer (With Dues)</Label>
            <Select 
              value={selectedCustomerId} 
              onValueChange={(v: any) => setValue("customerId", v, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingCustomers ? "Loading..." : "Select Customer"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] w-full min-w-[var(--radix-select-trigger-width)]">
                {customers.map(c => {
                  const bal = Number(c.balance);
                  const isOwed = bal < 0;
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-medium truncate mr-4">{c.name}</span>
                        <span className={`text-xs whitespace-nowrap ${isOwed ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                          {isOwed ? `Due: ৳${Math.abs(bal).toLocaleString()}` : `Bal: ৳${bal.toLocaleString()}`}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-red-500 text-xs">{errors.customerId.message}</p>}
          </div>

          {selectedCustomer && (
            <div className="bg-muted p-3 rounded-lg border flex justify-between items-center">
              <p className="text-sm font-medium text-muted-foreground">Total Due:</p>
              <p className="text-lg font-bold text-destructive">৳{maxCollection.toLocaleString('en-IN')}</p>
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
            <Label>Description</Label>
            <Input
              type="text"
              {...register("description")}
              placeholder="e.g. Bkash / Bank Transfer"
            />
          </div>

          <Button type="submit" disabled={isSubmitting || !selectedCustomerId} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Processing..." : "Record Collection"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
