"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateUserPrivileges, updateUserSalary } from "@/lib/actions/users";
import toast from "react-hot-toast";
import { Loader2, Edit2 } from "lucide-react";

export function EditManagerDialog({ user, onSuccess }: { user: any, onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    salary: user.salary_amount?.toString() || "0",
    privileges: {
      order_manager: !!user.privileges?.order_manager,
      delivery_manager: !!user.privileges?.delivery_manager,
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserSalary(user.id, Number(formData.salary) || 0);
      await updateUserPrivileges(user.id, formData.privileges);
      
      toast.success("Manager updated successfully!");
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update manager");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 transition-colors">
        <Edit2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Manager ({user.full_name})</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Monthly Salary (৳)</Label>
            <Input 
              type="number"
              required 
              value={formData.salary} 
              onChange={e => setFormData({ ...formData, salary: e.target.value })} 
              placeholder="15000"
            />
          </div>

          <div className="space-y-3 pt-2">
            <Label>Privileges</Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`edit_order_manager_${user.id}`} 
                checked={formData.privileges.order_manager}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, privileges: { ...formData.privileges, order_manager: !!checked } })
                }
              />
              <Label htmlFor={`edit_order_manager_${user.id}`} className="font-normal cursor-pointer">Order Manager</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`edit_delivery_manager_${user.id}`} 
                checked={formData.privileges.delivery_manager}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, privileges: { ...formData.privileges, delivery_manager: !!checked } })
                }
              />
              <Label htmlFor={`edit_delivery_manager_${user.id}`} className="font-normal cursor-pointer">Delivery Manager</Label>
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
