"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Truck } from "lucide-react";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { Supplier } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

const supplierSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  balance: z.number().optional(),
});

type FormValues = z.infer<typeof supplierSchema>;

export function SupplierFormDialog({
  isOpen,
  onClose,
  supplier = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || "",
      phone: supplier?.phone || "",
      address: supplier?.address || "",
      notes: supplier?.notes || "",
      balance: supplier?.balance || 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const payload = { ...data, balance: data.balance || 0 };
      if (supplier) {
        await updateSupplier(supplier.id, payload);
        toast.success("Supplier updated successfully");
      } else {
        await createSupplier(payload);
        toast.success("Supplier added successfully");
      }
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck size={20} className="text-emerald-600" />
            {supplier ? "সরবরাহকারী আপডেট করুন" : "নতুন সরবরাহকারী"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>নাম (Name) *</Label>
            <Input {...register("name")} placeholder="e.g. Karim Brothers" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>ফোন (Phone)</Label>
            <Input {...register("phone")} placeholder="01XXXXXXXXX" />
          </div>

          <div className="space-y-2">
            <Label>ঠিকানা (Address)</Label>
            <textarea
              {...register("address")}
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              placeholder="Dhaka, Bangladesh"
            />
          </div>

          <div className="space-y-2">
            <Label>নোট (Notes)</Label>
            <Input {...register("notes")} placeholder="Any additional info..." />
          </div>

          {!supplier && (
            <div className="space-y-2">
              <Label>Opening Balance (৳)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("balance", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Positive = we already owe them. Negative = they owe us.
              </p>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {supplier ? "আপডেট করুন" : "সরবরাহকারী যুক্ত করুন"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
