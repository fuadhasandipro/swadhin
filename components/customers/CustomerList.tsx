"use client";

import { useState } from "react";
import { Customer, Profile } from "@/types";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { Search, Plus, UserCircle, Phone, MapPin } from "lucide-react";
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

      {/* Table (Desktop) */}
      <div className="hidden md:block rounded-2xl overflow-hidden border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">{t('columns.name')}</TableHead>
              <TableHead className="font-semibold">{t('columns.contact')}</TableHead>
              <TableHead className="font-semibold">{t('columns.address')}</TableHead>
              <TableHead className="font-semibold text-right">{t('columns.balance')}</TableHead>
              <TableHead className="font-semibold text-center">{t('columns.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="border-b transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold">
                      {customer.name.charAt(0)}
                    </div>
                    {customer.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone size={14} className="text-muted-foreground" /> {customer.phone}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  <div className="flex items-center gap-1" title={customer.address}>
                    <MapPin size={14} className="text-muted-foreground shrink-0" /> <span className="truncate">{customer.address}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <p className={cn("font-bold", getBalanceColor(customer.balance))}>
                    ৳{Math.abs(customer.balance).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{getBalanceStatus(customer.balance)}</p>
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/customers/${customer.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    {t('viewProfile')}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {t('noCustomers')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cards (Mobile) */}
      <div className="md:hidden space-y-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="relative overflow-hidden flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold shrink-0 text-lg">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <Phone size={12} /> {customer.phone}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-1 text-sm text-muted-foreground mb-4 bg-muted/50 p-2 rounded-lg">
                <MapPin size={14} className="shrink-0 mt-0.5" /> 
                <span className="line-clamp-2">{customer.address}</span>
              </div>

              <div className="pt-3 border-t flex justify-between items-center mt-auto">
                <div>
                  <p className="text-xs text-muted-foreground">{getBalanceStatus(customer.balance)}</p>
                  <p className={cn("font-bold text-lg leading-tight", getBalanceColor(customer.balance))}>
                    ৳{Math.abs(customer.balance).toLocaleString('en-IN')}
                  </p>
                </div>
                
                <Link href={`/customers/${customer.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  {t('viewProfile')}
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {customers.length === 0 && (
          <div className="bg-card border rounded-2xl p-8 text-center text-muted-foreground">
            {t('noCustomers')}
          </div>
        )}
      </div>

      <CustomerFormDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      
    </div>
  );
}
