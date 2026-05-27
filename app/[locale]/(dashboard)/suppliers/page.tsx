import { getSuppliers } from "@/lib/actions/suppliers";
import { getCurrentProfile } from "@/lib/actions/auth";
import { SupplierList } from "@/components/suppliers/SupplierList";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const sp = await searchParams;
  const [suppliers, profile] = await Promise.all([
    getSuppliers(sp.search),
    getCurrentProfile(),
  ]);

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <SupplierList suppliers={suppliers || []} isAdmin={profile?.role === "admin"} />
    </div>
  );
}
