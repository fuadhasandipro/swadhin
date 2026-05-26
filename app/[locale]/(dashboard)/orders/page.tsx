import { getOrders } from "@/lib/actions/orders";
import { getTranslations } from "next-intl/server";
import { Link } from "@/routing";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye } from "lucide-react";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("orders");
  const currentTab = params.tab || "all";
  const orders = await getOrders(params.search, currentTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "order_placed":
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">{t(`status.${status}`)}</Badge>;
      case "delivered":
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50">{t(`status.${status}`)}</Badge>;
      case "canceled":
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/50">{t(`status.${status}`)}</Badge>;
      case "ready_delivery":
      case "on_the_way":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50">{t(`status.${status}`)}</Badge>;
      default:
        // Processing statuses
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">{t(`status.${status}`)}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70">{t("subtitle")}</p>
        </div>
        <Link href="/orders/create">
          <Button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap">
            <Plus size={18} />
            <span className="hidden sm:inline">{t("newOrder")}</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 md:p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex space-x-1 bg-slate-100 dark:bg-[#0d1a0e] p-1 rounded-xl border border-slate-200 dark:border-emerald-900/50 overflow-x-auto">
            {["all", "active", "delivered", "canceled"].map((tab) => (
              <Link
                key={tab}
                href={`/orders?tab=${tab}${params.search ? `&search=${params.search}` : ""}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  currentTab === tab
                    ? "bg-white dark:bg-emerald-800 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-emerald-300/70 hover:text-slate-900 dark:hover:text-emerald-100 hover:bg-white/50 dark:hover:bg-emerald-900/50"
                }`}
              >
                {t(`tabs.${tab}`)}
              </Link>
            ))}
          </div>

          <form className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="hidden"
              name="tab"
              value={currentTab}
            />
            <input
              type="text"
              name="search"
              defaultValue={params.search}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-[#0a0f0a] text-sm text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
            />
          </form>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-emerald-500/70">
            No orders found.
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-[#0d1a0e]">
                <TableRow className="border-emerald-100 dark:border-emerald-900/50 hover:bg-transparent">
                  <TableHead className="text-slate-600 dark:text-emerald-300 font-semibold">{t("columns.id")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-emerald-300 font-semibold">{t("columns.customer")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-emerald-300 font-semibold">{t("columns.date")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-emerald-300 font-semibold">{t("columns.status")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-emerald-300 font-semibold text-right">{t("columns.total")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-emerald-300 font-semibold text-center">{t("columns.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow
                    key={order.id}
                    className="border-b border-emerald-50 dark:border-emerald-900/20 hover:bg-slate-50 dark:hover:bg-[#0d1a0e] transition-colors"
                  >
                    <TableCell className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {order.id.split("-")[0]}
                    </TableCell>
                    <TableCell className="text-slate-800 dark:text-emerald-100 font-medium">
                      {order.customer?.name}
                      <div className="text-xs text-slate-500 dark:text-emerald-500/70 font-normal">{order.customer?.phone}</div>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-emerald-400 text-sm">
                      {format(new Date(order.order_date), "PP")}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right text-slate-800 dark:text-emerald-100 font-bold">
                      ৳{Number(order.total_amount).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/orders/${order.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-3 py-1.5 bg-slate-100 dark:bg-emerald-900/20 text-slate-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-600 rounded-lg text-sm font-medium transition-colors h-auto"
                        >
                          <Eye className="h-4 w-4 mr-1 hidden sm:inline" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
