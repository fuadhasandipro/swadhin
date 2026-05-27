import { getDeliverySchedule } from "@/lib/actions/orders";
import DeliveryClient from "@/components/deliveries/DeliveryClient";

export default async function DeliveriesPage() {
  const deliveries = await getDeliverySchedule();

  return <DeliveryClient initialDeliveries={deliveries} />;
}
