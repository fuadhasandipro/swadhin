"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "./ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CustomerReportProps {
  data: {
    totalCustomers: number;
    newCustomers: number;
    totalReceivables: number;
    totalPayables: number;
    topDebtors: any[];
    rawCustomers: any[];
  };
}

export function CustomerReportSection({ data }: CustomerReportProps) {
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center border-b border-emerald-900/20 pb-2">
        <h3 className="text-xl font-heading font-bold text-emerald-800 dark:text-emerald-400">Customer Report</h3>
        <ExportButton data={data.rawCustomers} filename="customer_report" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Customers</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{data.totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">New in Period</p>
            <p className="text-2xl font-bold text-blue-500">{data.newCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Receivables</p>
            <p className="text-2xl font-bold text-emerald-600">৳{data.totalReceivables.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Payables</p>
            <p className="text-2xl font-bold text-red-500">৳{data.totalPayables.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Top Debtors (Customers who owe money)</CardTitle>
        </CardHeader>
        <CardContent>
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Balance Due (৳)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topDebtors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No debtors found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topDebtors.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell className="truncate max-w-[200px]">{customer.address || '-'}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-bold">
                          {Number(customer.balance_amount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="md:hidden space-y-3">
              {data.topDebtors.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">No debtors found.</p>
              ) : (
                data.topDebtors.map(customer => (
                  <div key={customer.id} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm">{customer.name}</p>
                      <p className="text-emerald-600 font-bold text-sm">৳{Number(customer.balance_amount).toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    {customer.address && <p className="text-xs text-muted-foreground truncate">{customer.address}</p>}
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
