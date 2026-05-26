import { getTranslations } from "next-intl/server";
import { getCashSummary, getCashTransactions } from "@/lib/actions/cash";
import { getExpenseCategories } from "@/lib/actions/settings";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash In Hand */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet size={64} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-50 font-medium text-sm">Cash in Hand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              ৳{summary.cashInHand.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-100 mt-2 opacity-80">
              Running absolute total
            </p>
          </CardContent>
        </Card>

        {/* Net Cash (Today) */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 dark:text-emerald-500 text-sm font-medium">Net Cash (Today)</CardTitle>
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${summary.today.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {summary.today.net >= 0 ? '+' : ''}৳{summary.today.net.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 dark:text-emerald-600/70 mt-1">
              Month: {summary.month.net >= 0 ? '+' : ''}৳{summary.month.net.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Cash In (Today) */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 dark:text-emerald-500 text-sm font-medium">Cash In (Today)</CardTitle>
            <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-800 dark:text-emerald-100">
              ৳{summary.today.in.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 dark:text-emerald-600/70 mt-1">
              Month: ৳{summary.month.in.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Cash Out (Today) */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 dark:text-emerald-500 text-sm font-medium">Cash Out (Today)</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-800 dark:text-emerald-100">
              ৳{summary.today.out.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 dark:text-emerald-600/70 mt-1">
              Month: ৳{summary.month.out.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <CashClient
        transactions={transactions}
        currentTab={tab}
        cashInHand={summary.cashInHand}
        expenseCategories={expenseCategories}
      />

    </div>
  );
}
