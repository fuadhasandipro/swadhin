import { getCustomerById } from "@/lib/actions/customers";
import { CustomerProfileClient } from "@/components/customers/CustomerProfileClient";
import { notFound } from "next/navigation";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let customer;
  try {
    customer = await getCustomerById(id);
  } catch (error) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <CustomerProfileClient customer={customer} />
    </div>
  );
}
