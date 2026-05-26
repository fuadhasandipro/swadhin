import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getExpenseCategories } from "@/lib/actions/settings";
import { redirect } from "next/navigation";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { UsersTab } from "@/components/settings/UsersTab";
import { PrintColorConfigTab } from "@/components/settings/PrintColorConfigTab";
import { SMSSettingsTab } from "@/components/settings/SMSSettingsTab";
import { GeneralSettingsTab } from "@/components/settings/GeneralSettingsTab";
import ExpenseCategoriesClient from "@/components/settings/ExpenseCategoriesClient";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'admin') {
    redirect('/'); // Kick out non-admins
  }

  // Pre-fetch for expense categories tab
  const categories = await getExpenseCategories();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">
          Admin Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-emerald-500/70 mt-1">
          Configure application variables, manage users, and update system preferences.
        </p>
      </div>

      <SettingsTabs
        usersTab={<UsersTab />}
        printConfigTab={<PrintColorConfigTab />}
        expenseCategoriesTab={<ExpenseCategoriesClient initialCategories={categories} />}
        smsTab={<SMSSettingsTab />}
        generalTab={<GeneralSettingsTab />}
      />
    </div>
  );
}
