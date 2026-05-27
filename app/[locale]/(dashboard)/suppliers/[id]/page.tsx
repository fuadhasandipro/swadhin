import { notFound } from "next/navigation";
import { getSupplierById } from "@/lib/actions/suppliers";
import { SupplierProfileClient } from "@/components/suppliers/SupplierProfileClient";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await getSupplierById(id);

  if (!supplier) return notFound();

  const transactions = (supplier as any).supplier_transactions || [];
  const sorted = [...transactions].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return <SupplierProfileClient supplier={supplier} transactions={sorted} />;
}
