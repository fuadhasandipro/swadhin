"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Settings2 } from "lucide-react";
import { updateEmployeeSalary } from "@/lib/actions/salary";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

const updateSchema = z.object({
  amount: z.number().min(0, "Amount must be positive")
});

type FormValues = z.infer<typeof updateSchema>;

export function UpdateSalaryDialog({ 
  isOpen, 
  onClose,
  employee,
  currentAmount,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  employee: { id: string, name: string };
  currentAmount: number;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { amount: currentAmount }
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);

    try {
      await updateEmployeeSalary(employee.id, data.amount);
      toast.success("Base salary updated successfully");
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
            <Settings2 size={20} />
            Update Base Salary
          </DialogTitle>
          <DialogDescription>
            Change the monthly base salary for {employee.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>New Monthly Salary (৳)</Label>
            <Input
              type="number"
              {...register("amount", { valueAsNumber: true })}
              className="text-lg font-bold"
              placeholder="e.g. 15000"
            />
            {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Updating..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
