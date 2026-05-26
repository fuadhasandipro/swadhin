"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "@/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MinusCircle, HandCoins, Search, Calendar as CalendarIcon } from "lucide-react";
import { AddIncomeDialog } from "./AddIncomeDialog";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { CustomerCollectionQuickEntry } from "./CustomerCollectionQuickEntry";

export default function CashClient({ transactions, currentTab, cashInHand, expenseCategories }: { transactions: any[], currentTab: string, cashInHand: number, expenseCategories: {id: string, name: string}[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    router.push(`/cash?tab=${tab}`);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description?.toLowerCase().includes(search.toLowerCase()) || 
                          tx.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesDate = dateFilter ? tx.created_at.startsWith(dateFilter) : true;
    return matchesSearch && matchesDate;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsIncomeOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Income
          </Button>
          <Button onClick={() => setIsExpenseOpen(true)} variant="destructive" className="shadow-sm">
            <MinusCircle className="w-4 h-4 mr-2" /> Add Expense
          </Button>
          <Button onClick={() => setIsCollectionOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <HandCoins className="w-4 h-4 mr-2" /> Customer Collection
          </Button>
        </div>
      </div>

      <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 dark:border-emerald-900/30">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex bg-slate-100 dark:bg-emerald-950/30 p-1 rounded-lg">
              {['all', 'in', 'out', 'collection', 'salary'].map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    currentTab === tab 
                      ? 'bg-white dark:bg-emerald-900 text-emerald-600 dark:text-emerald-100 shadow-sm' 
                      : 'text-slate-500 dark:text-emerald-500/70 hover:text-slate-700 hover:dark:text-emerald-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Search description..." 
                  className="pl-9 h-9 w-full sm:w-[200px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Input 
                type="date"
                className="h-9 w-auto"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-emerald-950/20">
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount (৳)</TableHead>
                  <TableHead className="hidden md:table-cell">By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10">
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {format(new Date(tx.created_at), "MMM dd, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`uppercase text-[10px] tracking-wider font-semibold ${
                        tx.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' 
                        : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                      }`}>
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-800 dark:text-emerald-100">
                        {tx.description || "N/A"}
                      </div>
                      {tx.customer && (
                        <div className="text-xs text-slate-500 dark:text-emerald-500">
                          {tx.customer.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono font-bold ${tx.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tx.type === 'in' ? '+' : '-'} {Number(tx.amount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-emerald-600/70 hidden md:table-cell">
                      {tx.profile?.full_name || 'System'}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500 dark:text-emerald-600/50">
                      No transactions found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddIncomeDialog 
        isOpen={isIncomeOpen} 
        onClose={() => setIsIncomeOpen(false)} 
        onSuccess={() => router.refresh()}
      />
      
      <AddExpenseDialog 
        isOpen={isExpenseOpen} 
        onClose={() => setIsExpenseOpen(false)} 
        cashInHand={cashInHand}
        expenseCategories={expenseCategories}
        onSuccess={() => router.refresh()}
      />
      
      <CustomerCollectionQuickEntry 
        isOpen={isCollectionOpen} 
        onClose={() => setIsCollectionOpen(false)} 
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
