import { getTranslations } from "next-intl/server";
import { CreateOrderForm } from "@/components/orders/CreateOrderForm";

export default async function CreateOrderPage() {
  const t = await getTranslations("orders");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-emerald-400">
          {t("newOrder")}
        </h1>
        <p className="text-emerald-300/70">Fill out the details to create a new order.</p>
      </div>

      <CreateOrderForm />
    </div>
  );
}
