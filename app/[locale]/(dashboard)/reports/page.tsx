import { getTranslations } from "next-intl/server";
import { DateRangeSelector } from "@/components/reports/DateRangeSelector";
import { SalesReportSection } from "@/components/reports/SalesReportSection";
import { CashFlowReportSection } from "@/components/reports/CashFlowReportSection";
import { StockReportSection } from "@/components/reports/StockReportSection";
import { CustomerReportSection } from "@/components/reports/CustomerReportSection";
import { SalaryReportSection } from "@/components/reports/SalaryReportSection";
import { ReportTabs } from "@/components/reports/ReportTabs";
import { 
  getSalesReport, 
  getCashFlowReport, 
  getStockReport, 
  getCustomerReport, 
  getSalaryReport 
} from "@/lib/actions/reports";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/reports/PrintButton";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string, to?: string }> }) {
  const t = await getTranslations("reports");
  const sp = await searchParams;

  const now = new Date();
  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  const defaultTo = format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

  const from = sp.from || defaultFrom;
  const to = sp.to || defaultTo;

  // We fetch all reports in parallel
  const [salesData, cashData, stockData, customerData, salaryData] = await Promise.all([
    getSalesReport(from, to),
    getCashFlowReport(from, to),
    getStockReport(),
    getCustomerReport(from, to),
    getSalaryReport(from, to)
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">বিজনেস রিপোর্ট</h2>
          <p className="text-sm text-muted-foreground">Comprehensive business analytics</p>
        </div>
        
        {/* Global Print Button */}
        <PrintButton />
      </div>

      <DateRangeSelector />

      {/* The printable area */}
      <div className="space-y-12 bg-white dark:bg-[#0a0f0a] rounded-xl p-4 md:p-6 shadow-sm border border-emerald-900/20 print:shadow-none print:border-none print:p-0">
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-3xl font-bold font-heading text-emerald-800">Swadhin Enterprise</h1>
          <h2 className="text-xl text-slate-600">Business Report</h2>
          <p className="text-sm text-slate-500">
            Period: {format(new Date(from), "MMM dd, yyyy")} to {format(new Date(to), "MMM dd, yyyy")}
          </p>
        </div>

        <ReportTabs 
          sales={
            <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading Sales Data...</div>}>
              <SalesReportSection data={salesData} />
            </Suspense>
          }
          cash={
            <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading Cash Flow Data...</div>}>
              <CashFlowReportSection data={cashData} />
            </Suspense>
          }
          stock={
            <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading Stock Data...</div>}>
              <StockReportSection data={stockData} />
            </Suspense>
          }
          customers={
            <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading Customer Data...</div>}>
              <CustomerReportSection data={customerData} />
            </Suspense>
          }
          salary={
            <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading Salary Data...</div>}>
              <SalaryReportSection data={salaryData} />
            </Suspense>
          }
        />
        
        <div className="hidden print:block mt-12 text-center text-xs text-slate-400">
          Generated on {format(new Date(), "PPpp")}
        </div>
      </div>
    </div>
  );
}
