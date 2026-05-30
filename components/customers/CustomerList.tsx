"use client";

import { useState, useMemo } from "react";
import { Customer, Profile } from "@/types";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { Search, Plus, UserCircle, Phone, MapPin, ArrowUpDown, Send, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { sendPaymentReminderSMS } from "@/lib/actions/sms";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Link } from "@/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  const [isSendingSMS, setIsSendingSMS] = useState(false);

  // SMS Confirmation Dialog State
  const [confirmSMSCustomer, setConfirmSMSCustomer] = useState<{ id: string; name: string; phone: string; amount: number } | null>(null);

  const handleSendReminderClick = (e: React.MouseEvent, customerId: string, name: string, phone: string, dueAmount: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!phone) {
      toast.error("No phone number available");
      return;
    }
    setConfirmSMSCustomer({ id: customerId, name, phone, amount: dueAmount });
  };

  const handleConfirmSendSMS = async () => {
    if (!confirmSMSCustomer) return;
    setIsSendingSMS(true);
    const { phone, amount, name } = confirmSMSCustomer;
    
    try {
      const res = await sendPaymentReminderSMS(phone, amount, name);
      if (res.success) {
        toast.success("SMS Sent Successfully!");
        setConfirmSMSCustomer(null);
      } else {
        toast.error(res.error || "Failed to send SMS");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while sending SMS");
    } finally {
      setIsSendingSMS(false);
    }
  };

  const [sortBy, setSortBy] = useState<'default' | 'amount_due' | 'recent_tx'>('default');

  const sortedCustomers = useMemo(() => {
    let list = [...customers];
    if (sortBy === 'amount_due') {
      list.sort((a, b) => {
        if (a.balance < 0 && b.balance >= 0) return -1;
        if (b.balance < 0 && a.balance >= 0) return 1;
        if (a.balance < 0 && b.balance < 0) return a.balance - b.balance;
        return 0;
      });
    } else if (sortBy === 'recent_tx') {
      list = list.filter(c => c.balance < 0);
      list.sort((a, b) => {
        const aTxs = (a as any).customer_transactions || [];
        const bTxs = (b as any).customer_transactions || [];
        const aDate = aTxs.length > 0 ? new Date(Math.max(...aTxs.map((t: any) => new Date(t.created_at).getTime()))) : new Date(a.created_at);
        const bDate = bTxs.length > 0 ? new Date(Math.max(...bTxs.map((t: any) => new Date(t.created_at).getTime()))) : new Date(b.created_at);
        return aDate.getTime() - bDate.getTime();
      });
    }
    return list;
  }, [customers, sortBy]);

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

  const engToBngNum = (num: number) => {
    const bngNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(c => bngNums[parseInt(c)] || c).join('');
  };

  const getBengaliDaysAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "আজকে";
    if (diffDays === 1) return "গতকাল";
    return `${engToBngNum(diffDays)} দিন আগে`;
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
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              defaultValue={searchParams.get('search') || ''}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background"
            />
          </div>

          <select
            className="h-[44px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[140px] truncate"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="default">Default Sort</option>
            <option value="amount_due">Highest Due</option>
            <option value="recent_tx">Recent Trans (Due)</option>
          </select>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap shrink-0"
          >
            <Plus size={18} /> <span className="hidden sm:inline">{t('newCustomer')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedCustomers.map((customer) => {
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

          const cTxs = (customer as any).customer_transactions || [];
          const lastTxDate = cTxs.length > 0 ? new Date(Math.max(...cTxs.map((t: any) => new Date(t.created_at).getTime()))) : null;

          return (
            <div
              key={customer.id}
              onClick={() => router.push(`/customers/${customer.id}`)}
              className="block transition-transform hover:-translate-y-1 duration-200 cursor-pointer"
            >
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
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Since {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
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

                  {/* Footer Stats Wrapper to align items at the bottom */}
                  <div className="mt-auto flex flex-col gap-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
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

                    <div className="flex-1 flex flex-col justify-end mt-1">
                      {lastTxDate && (
                        <div className="text-center p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 w-full shadow-sm">
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            Last Transaction: <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm block sm:inline mt-0.5 sm:mt-0">{getBengaliDaysAgo(lastTxDate)}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {isDue && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-900/40"
                        onClick={(e) => handleSendReminderClick(e, customer.id, customer.name, customer.phone, Math.abs(customer.balance))}
                      >
                        <Send className="w-3 h-3 mr-1.5" />
                        তাগাদা দিন
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
        {sortedCustomers.length === 0 && (
          <div className="col-span-full bg-card border rounded-2xl p-8 text-center text-muted-foreground">
            {customers.length === 0 ? t('noCustomers') : "No customers match this filter"}
          </div>
        )}
      </div>

      <CustomerFormDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      <Dialog open={!!confirmSMSCustomer} onOpenChange={(open) => !open && setConfirmSMSCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS Reminder</DialogTitle>
            <DialogDescription>
              Preview the SMS before sending to {confirmSMSCustomer?.name} ({confirmSMSCustomer?.phone}).
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border text-sm font-medium whitespace-pre-wrap">
            {`[স্বাধীন এন্টারপ্রাইজ]\n${confirmSMSCustomer?.name},\nআপনার বর্তমান বকেয়া: ${confirmSMSCustomer?.amount} টাকা। অনুগ্রহ করে দ্রুত পরিশোধ করার অনুরোধ করা হলো।\nধন্যবাদ!`}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmSMSCustomer(null)} disabled={isSendingSMS}>Cancel</Button>
            <Button onClick={handleConfirmSendSMS} className="bg-emerald-600 hover:bg-emerald-700" disabled={isSendingSMS}>
              {isSendingSMS ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {isSendingSMS ? "Sending..." : "Send SMS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
