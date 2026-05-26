"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReportTabsProps {
  sales: React.ReactNode;
  cash: React.ReactNode;
  stock: React.ReactNode;
  customers: React.ReactNode;
  salary: React.ReactNode;
}

export function ReportTabs({ sales, cash, stock, customers, salary }: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState("sales");

  const tabs = [
    { id: "sales", label: "সেলস (Sales)" },
    { id: "cash", label: "ক্যাশ ফ্লো (Cash Flow)" },
    { id: "stock", label: "স্টক (Stock)" },
    { id: "customers", label: "কাস্টমার (Customers)" },
    { id: "salary", label: "বেতন (Salary)" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto whitespace-nowrap bg-slate-100 dark:bg-[#0f1a0f] p-1 rounded-xl w-full md:w-fit print:hidden border border-emerald-900/10 gap-1 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === tab.id 
                ? "bg-white dark:bg-emerald-800 text-emerald-700 dark:text-emerald-100 shadow-sm" 
                : "text-slate-500 dark:text-emerald-500/70 hover:text-slate-700 hover:dark:text-emerald-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content - we hide inactive tabs on screen, but show them all on print! */}
      <div className={cn(activeTab === "sales" ? "block" : "hidden print:block", "print:break-after-page")}>
        {sales}
      </div>
      <div className={cn(activeTab === "cash" ? "block" : "hidden print:block", "print:break-after-page")}>
        {cash}
      </div>
      <div className={cn(activeTab === "stock" ? "block" : "hidden print:block", "print:break-after-page")}>
        {stock}
      </div>
      <div className={cn(activeTab === "customers" ? "block" : "hidden print:block", "print:break-after-page")}>
        {customers}
      </div>
      <div className={cn(activeTab === "salary" ? "block" : "hidden print:block")}>
        {salary}
      </div>
    </div>
  );
}
