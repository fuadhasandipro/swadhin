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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Privileges</TableHead>
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
                    <TableRow key={user.id} className={!user.is_active ? "opacity-50" : ""}>
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
        )}
      </CardContent>
    </Card>
  );
}
