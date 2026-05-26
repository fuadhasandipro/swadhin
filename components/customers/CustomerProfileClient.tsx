"use client";

import { useState } from "react";
import { Customer, Order, CustomerTransaction, CashTransaction } from "@/types";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { BalanceAdjustDialog } from "./BalanceAdjustDialog";
import { CashCollectionDialog } from "./CashCollectionDialog";
import { CustomerProfileTabs } from "./CustomerProfileTabs";
import { UserCircle, Phone, MapPin, Edit2, ArrowRightLeft, HandCoins } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type FullCustomer = Customer & {
  orders: Order[];
  customer_transactions: CustomerTransaction[];
  cash_transactions: CashTransaction[];
};

export function CustomerProfileClient({ customer }: { customer: FullCustomer }) {
  const t = useTranslations('customers.profile');
  const tb = useTranslations('customers.balanceStatus');
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return "text-red-600 dark:text-red-400";
    if (balance > 0) return "text-blue-600 dark:text-blue-400";
    return "text-slate-500 dark:text-emerald-500/70";
  };

  const getBalanceStatus = (balance: number) => {
    if (balance < 0) return tb('receivable');
    if (balance > 0) return tb('payable');
    return tb('settled');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Customer Info Card */}
        <div className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-heading font-bold text-slate-800 dark:text-emerald-100">{t('info')}</h2>
            <button 
              onClick={() => setIsEditOpen(true)}
              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <Edit2 size={16} /> <span className="hidden sm:inline">{t('edit')}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold text-2xl shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-emerald-100">{customer.name}</h1>
              <p className="text-sm text-slate-500 dark:text-emerald-500/70">Joined: {new Date(customer.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            <div className="flex items-center gap-3 text-slate-600 dark:text-emerald-400">
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#0d1a0e] flex items-center justify-center shrink-0">
                <Phone size={16} className="text-emerald-500" />
              </div>
              <span className="font-medium">{customer.phone}</span>
            </div>
            <div className="flex items-start gap-3 text-slate-600 dark:text-emerald-400">
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#0d1a0e] flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-emerald-500" />
              </div>
              <span className="mt-1.5">{customer.address}</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between text-white border border-emerald-900/50">
          <div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-emerald-400/80 font-medium text-sm uppercase tracking-wider">{t('balance')}</p>
              <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-md">
                {getBalanceStatus(customer.balance)}
              </div>
            </div>
            <h1 className={cn("text-5xl font-bold font-sans mt-2", 
              customer.balance < 0 ? "text-red-400" : customer.balance > 0 ? "text-blue-400" : "text-emerald-400"
            )}>
              ৳{Math.abs(customer.balance).toLocaleString('en-IN')}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button 
              onClick={() => setIsAdjustOpen(true)}
              className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 backdrop-blur-md border border-white/10"
            >
              <ArrowRightLeft size={18} /> {t('adjustBalance')}
            </button>
            <button 
              onClick={() => setIsCollectionOpen(true)}
              disabled={customer.balance >= 0}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <HandCoins size={18} /> {t('collectCash')}
            </button>
          </div>

          {/* Decorative Background */}
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Tabs */}
      <CustomerProfileTabs 
        orders={customer.orders} 
        transactions={customer.customer_transactions} 
        cashCollections={customer.cash_transactions} 
      />

      {/* Dialogs */}
      <CustomerFormDialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} customer={customer} />
      <BalanceAdjustDialog isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} customer={customer} />
      <CashCollectionDialog isOpen={isCollectionOpen} onClose={() => setIsCollectionOpen(false)} customer={customer} />
      
    </div>
  );
}
