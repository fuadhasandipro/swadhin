import { getProducts } from "@/lib/actions/stock";
import { getCurrentProfile } from "@/lib/actions/auth";
import { StockClient } from "@/components/stock/StockClient";

export default async function StockPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const sp = await searchParams;
  const products = await getProducts(sp.search);
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-7xl mx-auto">
      <StockClient products={products} profile={profile} />
    </div>
  );
}
