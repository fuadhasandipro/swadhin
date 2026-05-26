"use client";

import { useState } from "react";
import { Customer, Profile } from "@/types";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { Search, Plus, UserCircle, Phone, MapPin } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Link } from "@/routing";

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
          <h2 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">{t('title')}</h2>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70">{t('subtitle')}</p>
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={t('searchPlaceholder')}
              defaultValue={searchParams.get('search') || ''}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-[#0a0f0a] text-sm text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
            />
          </div>
          
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap"
          >
            <Plus size={18} /> <span className="hidden sm:inline">{t('newCustomer')}</span>
          </button>
        </div>
      </div>

      {/* Table (Desktop) */}
      <div className="hidden md:block bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0d1a0e] border-b border-emerald-100 dark:border-emerald-900/50">
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300">{t('columns.name')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300">{t('columns.contact')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300">{t('columns.address')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300 text-right">{t('columns.balance')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300 text-center">{t('columns.action')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-emerald-50 dark:border-emerald-900/20 hover:bg-slate-50 dark:hover:bg-[#0d1a0e] transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      {customer.name}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-emerald-400">
                    <div className="flex items-center gap-1">
                      <Phone size={14} className="text-slate-400" /> {customer.phone}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-emerald-400 max-w-[200px] truncate">
                    <div className="flex items-center gap-1" title={customer.address}>
                      <MapPin size={14} className="text-slate-400 shrink-0" /> <span className="truncate">{customer.address}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <p className={cn("font-bold", getBalanceColor(customer.balance))}>
                      ৳{Math.abs(customer.balance).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{getBalanceStatus(customer.balance)}</p>
                  </td>
                  <td className="p-4 text-center">
                    <Link 
                      href={`/customers/${customer.id}`}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-emerald-900/20 text-slate-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      {t('viewProfile')}
                    </Link>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-emerald-500/70">
                    {t('noCustomers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards (Mobile) */}
      <div className="md:hidden space-y-4">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold shrink-0 text-lg">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-emerald-100 leading-tight">
                    {customer.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-emerald-500/70 mt-0.5">
                    <Phone size={12} /> {customer.phone}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-1 text-sm text-slate-500 dark:text-emerald-500/70 mb-4 bg-slate-50 dark:bg-emerald-900/10 p-2 rounded-lg">
              <MapPin size={14} className="shrink-0 mt-0.5" /> 
              <span className="line-clamp-2">{customer.address}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-emerald-900/30 flex justify-between items-center mt-auto">
              <div>
                <p className="text-xs text-slate-500 dark:text-emerald-500/70">{getBalanceStatus(customer.balance)}</p>
                <p className={cn("font-bold text-lg leading-tight", getBalanceColor(customer.balance))}>
                  ৳{Math.abs(customer.balance).toLocaleString('en-IN')}
                </p>
              </div>
              
              <Link 
                href={`/customers/${customer.id}`}
                className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl text-sm font-medium transition-colors"
              >
                {t('viewProfile')}
              </Link>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-8 text-center text-slate-500 dark:text-emerald-500/70">
            {t('noCustomers')}
          </div>
        )}
      </div>

      <CustomerFormDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      
    </div>
  );
}
