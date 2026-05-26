"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SettingsTabsProps {
  usersTab: React.ReactNode;
  printConfigTab: React.ReactNode;
  expenseCategoriesTab: React.ReactNode;
  smsTab: React.ReactNode;
  generalTab: React.ReactNode;
}

export function SettingsTabs({ usersTab, printConfigTab, expenseCategoriesTab, smsTab, generalTab }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", label: "User Management" },
    { id: "expense", label: "Expense Categories" },
    { id: "print", label: "Print Colors" },
    { id: "sms", label: "SMS API" },
    { id: "general", label: "General Settings" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap bg-slate-100 dark:bg-[#0f1a0f] p-1 rounded-xl w-fit border border-emerald-900/10 gap-1">
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

      {/* Tab Content */}
      <div className={cn(activeTab === "users" ? "block" : "hidden")}>
        {usersTab}
      </div>
      <div className={cn(activeTab === "expense" ? "block" : "hidden")}>
        {expenseCategoriesTab}
      </div>
      <div className={cn(activeTab === "print" ? "block" : "hidden")}>
        {printConfigTab}
      </div>
      <div className={cn(activeTab === "sms" ? "block" : "hidden")}>
        {smsTab}
      </div>
      <div className={cn(activeTab === "general" ? "block" : "hidden")}>
        {generalTab}
      </div>
    </div>
  );
}
