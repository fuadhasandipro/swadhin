import { getTranslations } from "next-intl/server";
import { format } from "date-fns";
import { getSalarySummary, getEmployeeSalaryDetails } from "@/lib/actions/salary";
import { getCurrentProfile } from "@/lib/actions/auth";
import SalaryClient from "@/components/salary/SalaryClient";
import { redirect } from "next/navigation";

export default async function SalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const t = await getTranslations("dashboard");
  const params = await searchParams;
  
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/bn/dashboard');
  }

  const isAdmin = profile.role === 'admin';
  const month = params.month || format(new Date(), "yyyy-MM");
  
  const summary = await getSalarySummary(month);
  const employees = await getEmployeeSalaryDetails(month);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">
            Salary Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70 mt-1">
            Track and process employee payroll.
          </p>
        </div>
      </div>

      <SalaryClient 
        initialMonth={month} 
        summary={summary} 
        employees={employees} 
        isAdmin={isAdmin}
      />
    </div>
  );
}
