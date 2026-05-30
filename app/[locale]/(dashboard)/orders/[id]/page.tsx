import { getOrderById } from "@/lib/actions/orders";
import { getTranslations } from "next-intl/server";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusUpdate } from "@/components/orders/OrderStatusUpdate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getColorHex } from "@/lib/utils/colors";
import { getSettings } from "@/lib/actions/settings";
import { PrintInvoiceButton } from "@/components/orders/PrintInvoiceButton";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("orders");
  const order = await getOrderById(id);
  const supabase = await createClient();

  // Fetch activity logs for this order
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*, profile:profiles(full_name)")
    .eq("entity_type", "orders")
    .eq("entity_id", id)
    .order("created_at", { ascending: false });

  const { data: colorConfigs } = await supabase.from('print_color_configs').select('*');
  const settings = await getSettings();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "order_placed":
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">{t(`status.${status}`)}</Badge>;
      case "designing":
      case "design_waiting_confirmation":
        return <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-400">{t(`status.${status}`)}</Badge>;
      case "design_confirmed":
      case "waiting_for_plate":
      case "plate_done":
        return <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">{t(`status.${status}`)}</Badge>;
      case "waiting_stock":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">{t(`status.${status}`)}</Badge>;
      case "waiting_print":
      case "one_color_done":
      case "drying":
      case "two_color_done":
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">{t(`status.${status}`)}</Badge>;
      case "waiting_handle":
      case "handle_done":
        return <Badge variant="secondary" className="bg-pink-500/10 text-pink-700 dark:text-pink-400">{t(`status.${status}`)}</Badge>;
      case "ready_delivery":
      case "on_the_way":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">{t(`status.${status}`)}</Badge>;
      case "delivered":
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{t(`status.${status}`)}</Badge>;
      case "canceled":
        return <Badge variant="destructive">{t(`status.${status}`)}</Badge>;
      default:
        return <Badge variant="outline">{t(`status.${status}`)}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">
            {t("detail.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70 font-mono mt-1">
            {t("detail.orderId")} {order.id.split("-")[0]}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <OrderStatusUpdate orderId={order.id} currentStatus={order.status} />
          <PrintInvoiceButton 
            order={order} 
            settings={settings} 
            translations={{ print: t("detail.print") }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-emerald-100 text-lg font-bold">{t("detail.customerInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-slate-700 dark:text-emerald-100">
            <div className="flex justify-between border-b border-slate-100 dark:border-emerald-900/20 pb-2">
              <span className="text-slate-500 dark:text-emerald-500">Name:</span>
              <span className="font-medium text-slate-800 dark:text-emerald-100">{order.customer?.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-emerald-900/20 pb-2">
              <span className="text-slate-500 dark:text-emerald-500">Phone:</span>
              <span>{order.customer?.phone}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 dark:text-emerald-500 shrink-0">Delivery Address:</span>
              <span className="text-right break-words">{order.location}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-emerald-100 text-lg font-bold">{t("detail.orderInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-slate-700 dark:text-emerald-100">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-emerald-900/20 pb-2">
              <span className="text-slate-500 dark:text-emerald-500">Status:</span>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-emerald-900/20 pb-2">
              <span className="text-slate-500 dark:text-emerald-500">Order Date:</span>
              <span>{format(new Date(order.order_date), "PP")}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-emerald-900/20 pb-2">
              <span className="text-slate-500 dark:text-emerald-500">Delivery Date:</span>
              <span>{format(new Date(order.delivery_date), "PP")}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-emerald-900/20 pb-2">
              <span className="text-slate-500 dark:text-emerald-500">Total Amount:</span>
              <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-300">
                ৳{Number(order.total_amount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-emerald-900/20 pb-2">
              <span className="text-slate-500 dark:text-emerald-500">Paid (Advance):</span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-300">
                ৳{Number(order.paid_amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-700 dark:text-emerald-300 font-semibold">Due Amount:</span>
              <span className={`font-mono font-bold text-lg ${(Number(order.total_amount) - Number(order.paid_amount || 0)) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-300'}`}>
                ৳{(Number(order.total_amount) - Number(order.paid_amount || 0)).toLocaleString('en-IN')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-emerald-100 text-lg font-bold">{t("detail.productInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-slate-700 dark:text-emerald-100">

            <div className="space-y-1">
              <div className="text-xs text-slate-500 dark:text-emerald-500 uppercase tracking-wider">{t("form.bagSize")}</div>
              <div className="font-medium text-slate-800 dark:text-emerald-100 bg-slate-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-slate-100 dark:border-emerald-900/50">{order.product?.bag_size || order.notes?.match(/Size: (.*)/)?.[1] || "Custom"}</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500 dark:text-emerald-500 uppercase tracking-wider">{t("form.cuttingType")}</div>
              <div className="font-medium text-slate-800 dark:text-emerald-100 bg-slate-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-slate-100 dark:border-emerald-900/50">{order.cutting_type === 'handle' ? 'Handle Cut' : 'D-Cut'}</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500 dark:text-emerald-500 uppercase tracking-wider">{t("form.gsm")}</div>
              <div className="font-medium text-slate-800 dark:text-emerald-100 bg-slate-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-slate-100 dark:border-emerald-900/50">{order.gsm} GSM</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500 dark:text-emerald-500 uppercase tracking-wider">{t("form.bodyColor")}</div>
              <div className="font-medium text-slate-800 dark:text-emerald-100 bg-slate-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-slate-100 dark:border-emerald-900/50 flex items-center h-10 gap-2 px-3">
                <div className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: getColorHex(order.body_color, colorConfigs || []) }}>{order.body_color}</div>
              </div>
            </div>

            {order.cutting_type === 'handle' && (
              <div className="space-y-1">
                <div className="text-xs text-slate-500 dark:text-emerald-500 uppercase tracking-wider">{t("form.handleColor")}</div>
                <div className="font-medium text-slate-800 dark:text-emerald-100 bg-slate-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-slate-100 dark:border-emerald-900/50 flex items-center h-10 gap-2 px-3">
                  <div className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: getColorHex(order.handle_color, colorConfigs || []) }}>{order.handle_color}</div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs text-slate-500 dark:text-emerald-500 uppercase tracking-wider">{t("form.printColorType")}</div>
              <div className="font-medium text-slate-800 dark:text-emerald-100 bg-slate-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-slate-100 dark:border-emerald-900/50 flex items-center h-10 px-3">{order.print_color_type === 'single' ? t("form.singleColor") : t("form.doubleColor")}</div>
            </div>

            {order.print_color_config && (
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-slate-500 dark:text-emerald-500 uppercase tracking-wider">{t("form.printColorConfig")}</div>
                <div className="font-medium text-slate-800 dark:text-emerald-100 bg-slate-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-slate-100 dark:border-emerald-900/50 flex items-center h-10 gap-2 px-3">
                  {order.print_color_config.type === "multi" || order.print_color_config.color === "multi" || (order.print_color_config.color && order.print_color_config.color.includes("-")) ? (
                    <div className="flex items-center gap-1.5 flex-wrap whitespace-nowrap">
                      {order.print_color_config.code1 && <div className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: order.print_color_config.code1 }}>{order.print_color_config.color.split(/[-&]/).map((s: string) => s.trim())[0] || "Color 1"}</div>}
                      {order.print_color_config.code2 && <div className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: order.print_color_config.code2 }}>{order.print_color_config.color.split(/[-&]/).map((s: string) => s.trim())[1] || "Color 2"}</div>}
                    </div>
                  ) : order.print_color_config.code1 || order.print_color_config.code ? (
                    <div className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: order.print_color_config.code1 || order.print_color_config.code }}>{order.print_color_config.color || order.print_color_config.name}</div>
                  ) : (
                    <span className="text-sm">{order.print_color_config.color || order.print_color_config.name}</span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-slate-500 dark:text-emerald-500 uppercase tracking-wider">{t("form.qty")} & {t("form.ratePerPiece")}</div>
              <div className="font-medium text-slate-800 dark:text-emerald-100 bg-slate-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-slate-100 dark:border-emerald-900/50 flex justify-between items-center">
                <span>{order.qty} pcs</span>
                <span className="text-slate-500 dark:text-emerald-500">@ ৳{order.rate_per_piece}/pc</span>
              </div>
            </div>

          </CardContent>
          {order.notes && (
            <div className="px-6 pb-6 pt-2">
              <div className="text-xs text-slate-500 dark:text-emerald-500 uppercase tracking-wider mb-1">{t("form.notes")}</div>
              <div className="bg-slate-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-slate-200 dark:border-emerald-900/50 text-slate-700 dark:text-emerald-200 text-sm">
                {order.notes}
              </div>
            </div>
          )}
        </Card>

        {/* Activity Timeline */}
        <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/50 md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-emerald-100 text-lg font-bold">{t("detail.timeline")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-emerald-800 before:to-transparent">
              {logs?.map((log: any, i: number) => (
                <div key={log.id} className="relative flex items-start gap-4 md:gap-0 md:items-center md:justify-normal md:odd:flex-row-reverse group">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-emerald-700 bg-white dark:bg-emerald-950 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-slate-500 dark:text-emerald-400 text-xs font-bold">
                    {i + 1}
                  </div>
                  {/* Content */}
                  <div className="flex-1 md:flex-none md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-slate-50 dark:bg-emerald-950/30 shadow-sm transition-all hover:shadow-md overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:space-x-2 mb-2 gap-1 sm:gap-0">
                      <div className="font-bold text-slate-800 dark:text-emerald-300">{log.action === 'UPDATE_STATUS' ? 'Status Update' : 'Created Order'}</div>
                      <time className="font-mono text-xs text-slate-500 dark:text-emerald-500">{format(new Date(log.created_at), "PPp")}</time>
                    </div>
                    <div className="text-slate-600 dark:text-emerald-100 text-sm mt-1">
                      {log.action === 'UPDATE_STATUS' && (
                        <span className="flex flex-wrap items-center gap-1.5 leading-relaxed">
                          Changed from
                          <strong className="text-slate-800 dark:text-emerald-400 bg-white dark:bg-emerald-900/40 px-2 py-0.5 rounded border border-slate-200 dark:border-emerald-800/50">{t(`status.${log.details?.from}`)}</strong>
                          to
                          <strong className="text-slate-800 dark:text-emerald-400 bg-white dark:bg-emerald-900/40 px-2 py-0.5 rounded border border-slate-200 dark:border-emerald-800/50">{t(`status.${log.details?.to}`)}</strong>
                        </span>
                      )}
                      {log.action === 'CREATE_ORDER' && (
                        <span>Order created with total ৳{log.details?.total?.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <div className="text-slate-400 dark:text-emerald-500 text-xs mt-3 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-emerald-800/50 flex items-center justify-center text-[10px] text-slate-600 dark:text-emerald-300">
                        {log.profile?.full_name?.charAt(0) || 'S'}
                      </span>
                      {log.profile?.full_name || 'System'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {logs?.length === 0 && (
              <div className="text-center text-slate-500 dark:text-emerald-500 py-8 bg-slate-50 dark:bg-emerald-900/10 rounded-xl border border-slate-100 dark:border-emerald-900/30 border-dashed">No activity recorded yet.</div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
