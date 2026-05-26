"use client";

import { useState } from "react";
import { Order, CustomerTransaction, CashTransaction } from "@/types";
import { ShoppingBag, ArrowRightLeft, HandCoins, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Link } from "@/routing";

type Tab = 'orders' | 'transactions' | 'cash';

export function CustomerProfileTabs({ 
  orders, 
  transactions, 
  cashCollections 
}: { 
  orders: Order[], 
  transactions: CustomerTransaction[], 
  cashCollections: CashTransaction[] 
}) {
  const t = useTranslations('customers');
  const td = useTranslations('dashboard');
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      case 'canceled': return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case 'ready_delivery': return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      default: return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
      
      {/* Tabs Header */}
      <div className="flex border-b border-emerald-100 dark:border-emerald-900/50 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap relative border-b-2",
            activeTab === 'orders' 
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10" 
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-emerald-500/70 dark:hover:text-emerald-300"
          )}
        >
          <ShoppingBag size={18} /> {t('profile.tabs.orders')} <span className="ml-1 bg-slate-100 dark:bg-[#0d1a0e] px-2 py-0.5 rounded-full text-xs">{orders.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={cn(
            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap relative border-b-2",
            activeTab === 'transactions' 
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10" 
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-emerald-500/70 dark:hover:text-emerald-300"
          )}
        >
          <ArrowRightLeft size={18} /> {t('profile.tabs.transactions')} <span className="ml-1 bg-slate-100 dark:bg-[#0d1a0e] px-2 py-0.5 rounded-full text-xs">{transactions.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('cash')}
          className={cn(
            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap relative border-b-2",
            activeTab === 'cash' 
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10" 
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-emerald-500/70 dark:hover:text-emerald-300"
          )}
        >
          <HandCoins size={18} /> {t('profile.tabs.cash')} <span className="ml-1 bg-slate-100 dark:bg-[#0d1a0e] px-2 py-0.5 rounded-full text-xs">{cashCollections.length}</span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-center text-slate-500 py-10">No orders found.</p>
            ) : (
              orders.map(order => (
                <div key={order.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 sm:p-4 border border-slate-100 dark:border-emerald-900/30 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0d1a0e] transition-colors gap-3 sm:gap-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-emerald-100">Order #{order.id.slice(0, 8)}</p>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap", getStatusColor(order.status))}>
                        {td(`orderStatus.${order.status}`)}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-emerald-500/70">{format(new Date(order.order_date), 'MMM dd, yyyy')} • {order.qty} pcs</p>
                  </div>
                  <div className="flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto pt-2 border-t sm:border-t-0 sm:pt-0">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">৳{order.total_amount.toLocaleString('en-IN')}</p>
                    <Link href={`/orders`} className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md sm:bg-transparent sm:px-0 sm:py-0 mt-0 sm:mt-1">
                      View <ArrowRight size={12} className="ml-1"/>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-10">No transactions found.</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 sm:p-4 border border-slate-100 dark:border-emerald-900/30 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0d1a0e] transition-colors gap-2 sm:gap-0">
                  <div>
                    <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-emerald-100">{tx.description || "Balance Adjustment"}</p>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-emerald-500/70">{format(new Date(tx.created_at), 'MMM dd, yyyy hh:mm a')} • {tx.order_id ? `Order #${tx.order_id.slice(0, 8)}` : 'Manual'}</p>
                  </div>
                  <div className="flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto pt-2 border-t sm:border-t-0 sm:pt-0">
                    <p className="text-[10px] text-slate-500 uppercase sm:hidden">{tx.type}</p>
                    <p className={cn("font-bold text-sm sm:text-base", tx.type === 'credit' ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400")}>
                      {tx.type === 'credit' ? '+' : '-'} ৳{tx.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase hidden sm:block">{tx.type}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Cash Collections Tab */}
        {activeTab === 'cash' && (
          <div className="space-y-4">
            {cashCollections.length === 0 ? (
              <p className="text-center text-slate-500 py-10">No cash collections found.</p>
            ) : (
              cashCollections.map(cash => (
                <div key={cash.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 sm:p-4 border border-slate-100 dark:border-emerald-900/30 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0d1a0e] transition-colors gap-2 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <HandCoins className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-emerald-100">{cash.description || "Collection"}</p>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-emerald-500/70">{format(new Date(cash.created_at), 'MMM dd, yyyy hh:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto pt-2 border-t sm:border-t-0 sm:pt-0 pl-11 sm:pl-0">
                    <p className="text-[10px] text-slate-500 uppercase sm:hidden">Received</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">৳{cash.amount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-500 uppercase hidden sm:block">Received</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
