"use client";

import { useEffect, useState } from "react";
import { getManagers, toggleUserStatus, updateUserPrivileges } from "@/lib/actions/users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateManagerDialog } from "./CreateManagerDialog";
import { EditManagerDialog } from "./EditManagerDialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function UsersTab() {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const data = await getManagers();
      setManagers(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus(id, !currentStatus);
      toast.success(currentStatus ? "User deactivated" : "User activated");
      fetchManagers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="border-emerald-900/10 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage manager accounts, privileges, and active status.</CardDescription>
        </div>
        <CreateManagerDialog onSuccess={fetchManagers} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
        ) : (
          <div className="rounded-md border border-emerald-900/10 bg-white overflow-hidden shadow-sm">
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-emerald-900/10">
              {managers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No managers found.</div>
              ) : (
                managers.map(user => (
                  <div key={user.id} className={cn("p-4 flex flex-col gap-3", !user.is_active && "opacity-60")}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {user.full_name}
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5">{user.phone}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                        <EditManagerDialog user={user} onSuccess={fetchManagers} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                      <span className="font-medium">৳{Number(user.salary_amount).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 mr-2">Toggle Status:</span>
                        <Switch 
                          checked={user.is_active} 
                          onCheckedChange={() => handleToggleStatus(user.id, user.is_active)} 
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.privileges?.order_manager && <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] h-5 px-1.5">Orders</Badge>}
                      {user.privileges?.delivery_manager && <Badge variant="outline" className="bg-orange-50 text-orange-700 text-[10px] h-5 px-1.5">Delivery</Badge>}
                      {(!user.privileges?.order_manager && !user.privileges?.delivery_manager) && <span className="text-slate-400 text-xs">No Privileges</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Privileges</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead className="text-right">Active toggle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No managers found.</TableCell>
                    </TableRow>
                  ) : (
                    managers.map(user => (
                      <TableRow key={`desktop-${user.id}`} className={!user.is_active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>৳{Number(user.salary_amount).toLocaleString()}</TableCell>
                        <TableCell className="space-x-1">
                          {user.privileges?.order_manager && <Badge variant="outline" className="bg-blue-50 text-blue-700">Orders</Badge>}
                          {user.privileges?.delivery_manager && <Badge variant="outline" className="bg-orange-50 text-orange-700">Delivery</Badge>}
                          {(!user.privileges?.order_manager && !user.privileges?.delivery_manager) && <span className="text-slate-400 text-sm">None</span>}
                        </TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <EditManagerDialog user={user} onSuccess={fetchManagers} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch 
                            checked={user.is_active} 
                            onCheckedChange={() => handleToggleStatus(user.id, user.is_active)} 
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
