"use client";

import { useState } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { useRouter } from "@/routing";
import { ChevronLeft, ChevronRight, Calculator, Wallet, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployeeSalaryCard } from "./EmployeeSalaryCard";

export default function SalaryClient({ 
  initialMonth, 
  summary, 
  employees,
  isAdmin
}: { 
  initialMonth: string; 
  summary: any;
  employees: any[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  
  // parse "YYYY-MM" to Date object for manipulation
  const [currentDate, setCurrentDate] = useState(() => {
    const [year, month] = initialMonth.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  });

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    router.push(`/salary?month=${format(newDate, "yyyy-MM")}`);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    router.push(`/salary?month=${format(newDate, "yyyy-MM")}`);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#0a0f0a] p-4 rounded-xl border border-slate-200 dark:border-emerald-900/50 shadow-sm">
        <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-full">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-lg font-bold text-slate-800 dark:text-emerald-100 flex items-center gap-2">
          {format(currentDate, "MMMM yyyy")}
        </div>
        <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-full">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md border-0 flex flex-col justify-between">
          <CardContent className="p-3 sm:p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-50" />
              </div>
            </div>
            <div>
              <p className="text-indigo-100 text-[9px] sm:text-sm font-medium mb-0.5 sm:mb-1 leading-tight uppercase tracking-wider">Total Salary</p>
              <h3 className="text-sm sm:text-3xl font-bold font-mono">৳{summary.totalSalary.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md border-0 flex flex-col justify-between">
          <CardContent className="p-3 sm:p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-50" />
              </div>
            </div>
            <div>
              <p className="text-emerald-100 text-[9px] sm:text-sm font-medium mb-0.5 sm:mb-1 leading-tight uppercase tracking-wider">Total Paid</p>
              <h3 className="text-sm sm:text-3xl font-bold font-mono">৳{summary.totalPaid.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md border-0 flex flex-col justify-between">
          <CardContent className="p-3 sm:p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-rose-50" />
              </div>
            </div>
            <div>
              <p className="text-rose-100 text-[9px] sm:text-sm font-medium mb-0.5 sm:mb-1 leading-tight uppercase tracking-wider">Total Due</p>
              <h3 className="text-sm sm:text-3xl font-bold font-mono text-white">৳{summary.totalDue.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {employees.map((emp) => (
          <EmployeeSalaryCard 
            key={emp.id} 
            employee={emp} 
            month={format(currentDate, "yyyy-MM")} 
            isAdmin={isAdmin}
            onUpdate={handleRefresh}
          />
        ))}
        {employees.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-emerald-600/50 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-dashed border-slate-200 dark:border-emerald-900/50">
            No active employees found in the system.
          </div>
        )}
      </div>
    </div>
  );
}
