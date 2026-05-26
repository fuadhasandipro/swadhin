"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "./ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SalaryReportProps {
  data: {
    totalPaid: number;
    totalDue: number;
    employeeBreakdown: { name: string; paid: number; due: number }[];
    rawRecords: any[];
  };
}

export function SalaryReportSection({ data }: SalaryReportProps) {
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center border-b border-emerald-900/20 pb-2">
        <h3 className="text-xl font-heading font-bold text-emerald-800 dark:text-emerald-400">Salary Report</h3>
        <ExportButton data={data.rawRecords} filename="salary_report" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Salary Paid (Period)</p>
            <p className="text-2xl font-bold text-emerald-600">৳{data.totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Salary Due</p>
            <p className="text-2xl font-bold text-red-500">৳{data.totalDue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Employee Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead className="text-right">Paid Amount (৳)</TableHead>
                    <TableHead className="text-right">Due Amount (৳)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.employeeBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        No salary records found for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.employeeBreakdown.map((emp, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="text-right text-emerald-600">{emp.paid.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-red-500">{emp.due.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3">
              {data.employeeBreakdown.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">No salary records found for this period.</p>
              ) : (
                data.employeeBreakdown.map((emp, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-2">
                    <p className="font-semibold text-sm">{emp.name}</p>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="text-sm font-medium text-emerald-600">৳{emp.paid.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Due</p>
                        <p className="text-sm font-medium text-red-500">৳{emp.due.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        </CardContent>
      </Card>
    </section>
  );
}
