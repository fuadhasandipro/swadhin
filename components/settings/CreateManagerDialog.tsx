"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createManagerAccount } from "@/lib/actions/users";
import toast from "react-hot-toast";
import { Loader2, UserPlus } from "lucide-react";

export function CreateManagerDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    password: "",
    salary: "",
    privileges: {
      order_manager: false,
      delivery_manager: false,
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await createManagerAccount({
        full_name: formData.full_name,
        phone: formData.phone,
        password: formData.password,
        salary: Number(formData.salary) || 0,
        privileges: formData.privileges
      });
      toast.success("Manager account created successfully!");
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      const msg = err.message || "Failed to create manager account";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white">
        <UserPlus className="w-4 h-4 mr-2" />
        নতুন ম্যানেজার
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Manager</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input 
              required 
              value={formData.full_name} 
              onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
              placeholder="e.g. Rahul Hasan"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input 
              required 
              value={formData.phone} 
              onChange={e => setFormData({ ...formData, phone: e.target.value })} 
              placeholder="017XXXXXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input 
              required 
              type="password"
              minLength={8}
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
              placeholder="Minimum 8 characters"
            />
          </div>

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
                id="order_manager" 
                checked={formData.privileges.order_manager}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, privileges: { ...formData.privileges, order_manager: !!checked } })
                }
              />
              <Label htmlFor="order_manager" className="font-normal cursor-pointer">Order Manager (Can create/edit orders)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="delivery_manager" 
                checked={formData.privileges.delivery_manager}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, privileges: { ...formData.privileges, delivery_manager: !!checked } })
                }
              />
              <Label htmlFor="delivery_manager" className="font-normal cursor-pointer">Delivery Manager (Can manage deliveries & stock)</Label>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md">
              {errorMsg}
            </div>
          )}

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
