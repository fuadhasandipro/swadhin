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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">{t(`status.${status}`)}</Badge>;
      case "delivered":
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{t(`status.${status}`)}</Badge>;
      case "canceled":
        return <Badge variant="destructive">{t(`status.${status}`)}</Badge>;
      case "ready_delivery":
      case "on_the_way":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">{t(`status.${status}`)}</Badge>;
      default:
        // Processing statuses
        return <Badge variant="outline">{t(`status.${status}`)}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/orders/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus size={18} />
            <span>{t("newOrder")}</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6 space-y-6 pt-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 px-4 sm:px-0">
          <div className="flex space-x-1 bg-muted p-1 rounded-xl overflow-x-auto w-fit">
            {["all", "active", "delivered", "canceled"].map((tab) => (
              <Link
                key={tab}
                href={`/orders?tab=${tab}${params.search ? `&search=${params.search}` : ""}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  currentTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`tabs.${tab}`)}
              </Link>
            ))}
          </div>

          <form className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="hidden"
              name="tab"
              value={currentTab}
            />
            <Input
              type="text"
              name="search"
              defaultValue={params.search}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background"
            />
          </form>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No orders found.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">{t("columns.id")}</TableHead>
                    <TableHead className="font-semibold">{t("columns.customer")}</TableHead>
                    <TableHead className="font-semibold">{t("columns.date")}</TableHead>
                    <TableHead className="font-semibold">{t("columns.status")}</TableHead>
                    <TableHead className="font-semibold text-right">{t("columns.total")}</TableHead>
                    <TableHead className="font-semibold text-center">{t("columns.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow
                      key={order.id}
                      className="border-b transition-colors"
                    >
                      <TableCell className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {order.id.split("-")[0]}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.customer?.name}
                        <div className="text-xs text-muted-foreground font-normal">{order.customer?.phone}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(order.order_date), "PP")}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right font-bold">
                        ৳{Number(order.total_amount).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/orders/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors h-auto"
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

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden px-4 pb-4">
              {orders.map((order: any) => (
                <div key={order.id} className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-1 flex items-center gap-2">
                        #{order.id.split("-")[0]}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 border-l pl-2 border-slate-200 dark:border-slate-700">
                          {format(new Date(order.order_date), "dd MMM yyyy")}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">{order.customer?.name}</div>
                      <div className="text-xs text-muted-foreground">{order.customer?.phone}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {getStatusBadge(order.status)}
                      <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/50">
                        Del: {format(new Date(order.delivery_date), "dd MMM")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-emerald-950/20 rounded-lg p-2.5 text-[11px] flex flex-wrap gap-x-3 gap-y-1.5 text-slate-600 dark:text-emerald-200/80 border border-slate-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-1"><span className="text-slate-400">Color:</span> <span className="font-medium">{order.body_color || '-'}</span></div>
                    <div className="flex items-center gap-1"><span className="text-slate-400">Print:</span> <span className="font-medium">{order.print_color_config?.color || (typeof order.print_color_config === 'string' ? order.print_color_config : '') || '-'}</span></div>
                    <div className="flex items-center gap-1"><span className="text-slate-400">Type:</span> <span className="font-medium">{order.cutting_type === 'handle' ? 'Handle' : 'D-Cut'}</span></div>
                    {order.cutting_type === 'handle' && (
                      <div className="flex items-center gap-1"><span className="text-slate-400">Handle:</span> <span className="font-medium">{order.handle_color || '-'}</span></div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-end mt-2 pt-3 border-t border-border/50">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Total Amount</div>
                      <div className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        ৳{Number(order.total_amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-5">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
