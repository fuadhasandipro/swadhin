"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { User, Wallet, HandCoins, Settings2 } from "lucide-react";
import { PaySalaryDialog } from "./PaySalaryDialog";
import { UpdateSalaryDialog } from "./UpdateSalaryDialog";

interface EmployeeSalary {
  id: string;
  full_name: string;
  role: string;
  salary_amount: number;
  paid_amount: number;
  due_amount: number;
  total_salary_this_month: number;
}

export function EmployeeSalaryCard({ 
  employee, 
  month, 
  isAdmin, 
  onUpdate 
}: { 
  employee: EmployeeSalary; 
  month: string; 
  isAdmin: boolean;
  onUpdate: () => void;
}) {
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  const total = Number(employee.total_salary_this_month);
  const paid = Number(employee.paid_amount);
  const due = Number(employee.due_amount);
  
  // Calculate progress percentage, handle 0 total case
  const progressPercent = total > 0 ? (paid / total) * 100 : (paid > 0 ? 100 : 0);

  return (
    <>
      <Card className="shadow-sm border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-[#0a0f0a] overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 flex gap-2">
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-500" onClick={() => setIsUpdateOpen(true)}>
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-emerald-900/30 flex items-center justify-center text-slate-500 dark:text-emerald-500">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-emerald-100">{employee.full_name}</h3>
              <Badge variant="outline" className="text-[10px] mt-0.5 bg-slate-50 dark:bg-emerald-950/20 text-slate-500 dark:text-emerald-500/70 border-slate-200 dark:border-emerald-900/30">
                {employee.role.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500 mb-1">Paid this Month</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">৳{paid.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
              <p className="text-xs font-medium text-red-600 dark:text-red-500 mb-1">Due Amount</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">৳{due.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-xs text-slate-500 dark:text-emerald-600/70">
              <span>Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 dark:text-emerald-700/50 text-right mt-1">
              Base Salary: ৳{Number(employee.salary_amount).toLocaleString()}
            </div>
          </div>

          <Button 
            onClick={() => setIsPayOpen(true)} 
            disabled={due <= 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <HandCoins className="w-4 h-4 mr-2" />
            {due > 0 ? "বেতন দিন (Pay Salary)" : "Paid in Full"}
          </Button>
        </CardContent>
      </Card>

      <PaySalaryDialog 
        isOpen={isPayOpen} 
        onClose={() => setIsPayOpen(false)}
        employee={{ id: employee.id, name: employee.full_name }}
        month={month}
        dueAmount={due}
        onSuccess={onUpdate}
      />

      <UpdateSalaryDialog 
        isOpen={isUpdateOpen} 
        onClose={() => setIsUpdateOpen(false)}
        employee={{ id: employee.id, name: employee.full_name }}
        currentAmount={Number(employee.salary_amount)}
        onSuccess={onUpdate}
      />
    </>
  );
}
