"use client";

import { useState } from "react";
import { Customer, Profile } from "@/types";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { Search, Plus, UserCircle, Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Link } from "@/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";

export function CustomerList({ customers, profile }: { customers: Customer[], profile: Profile | null }) {
  const t = useTranslations('customers');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set('search', e.target.value);
    } else {
      params.delete('search');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return "text-red-600 dark:text-red-400"; // They owe us
    if (balance > 0) return "text-blue-600 dark:text-blue-400"; // We owe them
    return "text-slate-500 dark:text-emerald-500/70"; // Settled
  };

  const getBalanceStatus = (balance: number) => {
    if (balance < 0) return t('balanceStatus.receivable');
    if (balance > 0) return t('balanceStatus.payable');
    return t('balanceStatus.settled');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              defaultValue={searchParams.get('search') || ''}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background"
            />
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap"
          >
            <Plus size={18} /> <span className="hidden sm:inline">{t('newCustomer')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {customers.map((customer) => {
          const isDue = customer.balance < 0;
          const isWeOwe = customer.balance > 0;
          const balanceColor = isDue
            ? "bg-red-50 border-red-100 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400"
            : isWeOwe
              ? "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400"
              : "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400";
          const balanceLabelColor = isDue ? "text-red-600/70" : isWeOwe ? "text-blue-600/70" : "text-emerald-600/70";
          const badgeClass = isDue
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none font-semibold"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-semibold";
          const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          return (
            <Link key={customer.id} href={`/customers/${customer.id}`} className="block transition-transform hover:-translate-y-1 duration-200">
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
                          {customer.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">Since {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
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
                      <span>{customer.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{customer.address || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2 text-center border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-center">
                      <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider font-semibold mb-0.5">Total orders</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{customer.orders?.[0]?.count || 0}</p>
                    </div>
                    <div className={`rounded-lg p-2 text-center border flex flex-col justify-center ${balanceColor}`}>
                      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${balanceLabelColor}`}>
                        {isWeOwe ? 'Payable' : 'Due amount'}
                      </p>
                      <p className="text-lg font-bold">
                        ৳{Math.abs(customer.balance).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {customers.length === 0 && (
          <div className="col-span-full bg-card border rounded-2xl p-8 text-center text-muted-foreground">
            {t('noCustomers')}
          </div>
        )}
      </div>

      <CustomerFormDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

    </div>
  );
}
