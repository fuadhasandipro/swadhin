import { getTranslations } from "next-intl/server";
import { getCustomers } from "@/lib/actions/customers";
import { CustomerCollectionForm } from "@/components/cash/CustomerCollectionForm";

export default async function CashCollectionPage() {
  const t = await getTranslations("dashboard");

  const allCustomers = await getCustomers();
  const customers = (allCustomers || []).map(c => ({ id: c.id, name: c.name, phone: c.phone, balance: c.balance || 0 }));

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">
            Cash Collection
          </h1>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70 mt-1">
            Record customer collections
          </p>
        </div>
      </div>

      <CustomerCollectionForm customers={customers} />
    </div>
  );
}
