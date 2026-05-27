import { getTranslations } from "next-intl/server";
import { getCashSummary, getCashTransactions } from "@/lib/actions/cash";
import { getExpenseCategories } from "@/lib/actions/settings";
import { getManagers } from "@/lib/actions/users";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getCustomers } from "@/lib/actions/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Wallet, HandCoins, ArrowUpDown, Banknote } from "lucide-react";
import CashClient from "@/components/cash/CashClient";

export default async function CashPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const t = await getTranslations("dashboard");
  const params = await searchParams;
  const tab = (params.tab as any) || "all";

  const summary = await getCashSummary();
  const transactions = await getCashTransactions(tab);
  const expenseCategories = await getExpenseCategories();
  const employees = await getManagers();
  const allSuppliers = await getSuppliers();
  const suppliers = (allSuppliers || []).map(s => ({ id: s.id, name: s.name, balance: s.balance || 0 }));
  const allCustomers = await getCustomers();
  const customers = (allCustomers || []).map(c => ({ id: c.id, name: c.name, phone: c.phone, balance: c.balance || 0 }));

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">
            Cash & Expense
          </h1>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70 mt-1">
            Financial overview and transaction management
          </p>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Cash In Hand */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 sm:opacity-20">
            <Wallet className="w-10 h-10 sm:w-16 sm:h-16" />
          </div>
          <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-2">
            <CardTitle className="text-emerald-50 font-medium text-[10px] sm:text-sm uppercase tracking-wider">Cash in Hand</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-1 sm:pt-0">
            <div className="text-lg sm:text-3xl font-bold font-mono">
              ৳{summary.cashInHand.toLocaleString()}
            </div>
            <p className="text-[9px] sm:text-xs text-emerald-100 mt-1 sm:mt-2 opacity-80 leading-none">
              Total Absolute
            </p>
          </CardContent>
        </Card>

        {/* Net Cash (Today) */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-slate-500 dark:text-emerald-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Net (Today)</CardTitle>
            <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-1 sm:pt-0">
            <div className={`text-base sm:text-2xl font-bold font-mono ${summary.today.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {summary.today.net >= 0 ? '+' : ''}৳{summary.today.net.toLocaleString()}
            </div>
            <p className="text-[9px] sm:text-xs text-slate-400 dark:text-emerald-600/70 mt-1 leading-none truncate">
              M: {summary.month.net >= 0 ? '+' : ''}৳{summary.month.net.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Cash In (Today) */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-slate-500 dark:text-emerald-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider">In (Today)</CardTitle>
            <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-1 sm:pt-0">
            <div className="text-base sm:text-2xl font-bold font-mono text-slate-800 dark:text-emerald-100">
              ৳{summary.today.in.toLocaleString()}
            </div>
            <p className="text-[9px] sm:text-xs text-slate-400 dark:text-emerald-600/70 mt-1 leading-none truncate">
              M: ৳{summary.month.in.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Cash Out (Today) */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-slate-500 dark:text-emerald-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider">Out (Today)</CardTitle>
            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-1 sm:pt-0">
            <div className="text-base sm:text-2xl font-bold font-mono text-slate-800 dark:text-emerald-100">
              ৳{summary.today.out.toLocaleString()}
            </div>
            <p className="text-[9px] sm:text-xs text-slate-400 dark:text-emerald-600/70 mt-1 leading-none truncate">
              M: ৳{summary.month.out.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <CashClient
        transactions={transactions}
        currentTab={tab}
        cashInHand={summary.cashInHand}
        expenseCategories={expenseCategories}
        employees={employees}
        suppliers={suppliers}
        customers={customers}
      />

    </div>
  );
}
