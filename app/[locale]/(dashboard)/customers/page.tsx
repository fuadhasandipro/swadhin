import { getCustomers } from "@/lib/actions/customers";
import { getCurrentProfile } from "@/lib/actions/auth";
import { CustomerList } from "@/components/customers/CustomerList";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const sp = await searchParams;
  const customers = await getCustomers(sp.search);
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-7xl mx-auto">
      <CustomerList customers={customers} profile={profile} />
    </div>
  );
}
