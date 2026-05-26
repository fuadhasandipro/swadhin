"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2 } from "lucide-react";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import { Customer } from "@/types";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
  address: z.string().min(5, "Address is required"),
  balance: z.number(),
});

type FormValues = z.infer<typeof customerSchema>;

export function CustomerFormDialog({ 
  isOpen, 
  onClose, 
  customer = null 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  customer?: Customer | null 
}) {
  const t = useTranslations("customers");
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { 
      name: customer?.name || "", 
      phone: customer?.phone || "", 
      address: customer?.address || "", 
      balance: customer?.balance || 0 
    }
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      if (customer) {
        await updateCustomer(customer.id, data);
      } else {
        await createCustomer(data);
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
          <DialogTitle>
            {customer ? t('editCustomerTitle') : t('addCustomerTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('form.name')}</Label>
            <Input
              {...register("name")}
              placeholder="e.g. Rahim Uddin"
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message as string}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('form.phone')}</Label>
            <Input
              {...register("phone")}
              placeholder="01XXXXXXXXX"
            />
            {errors.phone && <p className="text-destructive text-xs">{errors.phone.message as string}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('form.address')}</Label>
            <textarea
              {...register("address")}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="Dhaka, Bangladesh"
            />
            {errors.address && <p className="text-destructive text-xs">{errors.address.message as string}</p>}
          </div>

          {!customer && (
            <div className="space-y-2">
              <Label>{t('form.openingBalance')}</Label>
              <Input
                type="number"
                {...register("balance", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">{t('form.openingBalanceDesc')}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {customer ? t('form.update') : t('form.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
