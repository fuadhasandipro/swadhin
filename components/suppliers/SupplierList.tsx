"use client";

import { useState } from "react";
import { Supplier } from "@/types";
import { deleteSupplier } from "@/lib/actions/suppliers";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { Link } from "@/routing";
import { Plus, Search, Truck, Phone, MapPin, Trash2, Loader2, Edit2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SupplierList({
  suppliers,
  isAdmin,
}: {
  suppliers: Supplier[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) params.set("search", e.target.value);
    else params.delete("search");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete supplier "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteSupplier(id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const totalDue = suppliers.reduce((acc, s) => acc + Math.max(0, Number(s.balance)), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-500" />
            সরবরাহকারী
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your raw material & goods suppliers</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Search suppliers..."
              defaultValue={searchParams.get("search") || ""}
              onChange={handleSearch}
              className="pl-10 rounded-xl"
            />
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 whitespace-nowrap">
            <Plus size={18} /> নতুন সরবরাহকারী
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-orange-100/80 font-medium text-sm mb-1 uppercase tracking-wider">মোট বকেয়া (Total We Owe Suppliers)</p>
          <h1 className="text-4xl font-bold font-mono">৳ {totalDue.toLocaleString("en-IN")}</h1>
        </div>
        <Truck className="absolute -right-6 -bottom-6 w-40 h-40 text-orange-500/30 opacity-50 rotate-12" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {suppliers.map((supplier) => {
          const isDue = Number(supplier.balance) > 0;
          const isTheyOwe = Number(supplier.balance) < 0;
          const balanceColor = isDue 
            ? "bg-red-50 border-red-100 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400" 
            : isTheyOwe 
              ? "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400"
              : "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400";
          const balanceLabelColor = isDue ? "text-red-600/70" : isTheyOwe ? "text-blue-600/70" : "text-emerald-600/70";
          const badgeClass = isDue 
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none font-semibold"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-semibold";
          const initials = supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          return (
            <Link key={supplier.id} href={`/suppliers/${supplier.id}`} className="block transition-transform hover:-translate-y-1 duration-200">
              <Card className="h-full flex flex-col border-slate-200 dark:border-emerald-900/50 shadow-sm hover:shadow-md transition-shadow rounded-xl">
                <CardContent className="p-4 flex flex-col h-full gap-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 text-sm tracking-widest">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-base leading-tight text-slate-800 dark:text-slate-200 line-clamp-1">
                          {supplier.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">Since {new Date(supplier.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <Badge className={badgeClass} variant="secondary">
                      {isDue ? 'Due' : 'Active'}
                    </Badge>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="shrink-0" />
                      <span>{supplier.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{supplier.address || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2 text-center border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-center">
                      <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider font-semibold mb-0.5">Total Txns</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{supplier.supplier_transactions?.[0]?.count || 0}</p>
                    </div>
                    <div className={`rounded-lg p-2 text-center border flex flex-col justify-center ${balanceColor}`}>
                      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${balanceLabelColor}`}>
                        {isTheyOwe ? 'Receivable' : 'Due amount'}
                      </p>
                      <p className="text-lg font-bold">
                        ৳{Math.abs(Number(supplier.balance)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {suppliers.length === 0 && (
          <div className="col-span-full bg-card border rounded-2xl p-8 text-center text-muted-foreground text-sm">
            কোনো সরবরাহকারী পাওয়া যায়নি।
          </div>
        )}
      </div>

      <SupplierFormDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <SupplierFormDialog isOpen={!!editSupplier} onClose={() => setEditSupplier(null)} supplier={editSupplier} />
    </div>
  );
}
