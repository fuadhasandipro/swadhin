import { getTranslations } from "next-intl/server";
import { getExpenseCategories } from "@/lib/actions/settings";
import ExpenseCategoriesClient from "@/components/settings/ExpenseCategoriesClient";

export default async function ExpenseCategoriesPage() {
  const t = await getTranslations("dashboard");
  const categories = await getExpenseCategories();

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">
          Expense Categories
        </h1>
        <p className="text-sm text-slate-500 dark:text-emerald-500/70 mt-1">
          Manage custom categories for your expense tracking.
        </p>
      </div>

      <ExpenseCategoriesClient initialCategories={categories} />
    </div>
  );
}
