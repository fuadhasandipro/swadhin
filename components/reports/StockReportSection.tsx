"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "./ExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface StockReportProps {
  data: {
    totalStockValue: number;
    lowStockItems: any[];
    stockBySizeChart: { name: string; value: number }[];
    rawProducts: any[];
  };
}

export function StockReportSection({ data }: StockReportProps) {
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center border-b border-emerald-900/20 pb-2">
        <h3 className="text-xl font-heading font-bold text-emerald-800 dark:text-emerald-400">Stock Report</h3>
        <ExportButton data={data.rawProducts} filename="stock_report" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current Stock Value</p>
            <p className="text-2xl font-bold text-emerald-600">৳{data.totalStockValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Low Stock Items</p>
            <p className={`text-2xl font-bold ${data.lowStockItems.length > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {data.lowStockItems.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Stock by Bag Size</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stockBySizeChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value) => [`${value} items`, 'Quantity']} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-red-600">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No items are low on stock. Great job!</p>
            ) : (
              <div className="overflow-x-auto max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.lowStockItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.bag_size}</TableCell>
                        <TableCell>{item.bag_color}</TableCell>
                        <TableCell className="text-right text-red-600 font-bold">{item.qty}</TableCell>
                        <TableCell className="text-right text-slate-500">{item.minimum_stock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
