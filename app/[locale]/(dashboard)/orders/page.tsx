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
import { Plus, Search, Eye, TrendingUp, CheckCircle2, Clock, XCircle, Palette } from "lucide-react";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrderStatusUpdate } from "@/components/orders/OrderStatusUpdate";
import { createClient } from "@/lib/supabase/server";
import { getColorHex } from "@/lib/utils/colors";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tab?: string; sort?: string; cut?: string; bodyColor?: string; handleColor?: string; printColor?: string; size?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("orders");
  const currentTab = params.tab || "all";
  let orders = await getOrders(params.search, currentTab);

  const supabase = await createClient();
  const { data: colorConfigs } = await supabase.from('print_color_configs').select('*');

  // Extract unique colors and sizes for filtering before applying filters
  const uniqueBodyColors = Array.from(new Set(orders.map((o: any) => o.body_color).filter(Boolean))) as string[];
  const uniqueHandleColors = Array.from(new Set(orders.map((o: any) => o.handle_color).filter(Boolean))) as string[];
  const uniqueSizes = Array.from(new Set(orders.map((o: any) => o.product?.bag_size).filter(Boolean))) as string[];

  // Extract distinct individual print colors
  const printColorsSet = new Set<string>();
  orders.forEach((o: any) => {
    const pColor = o.print_color_config?.color || o.print_color_config?.name;
    if (pColor) {
      if (pColor.includes('-')) {
        pColor.split('-').forEach((c: string) => printColorsSet.add(c.trim()));
      } else {
        printColorsSet.add(pColor.trim());
      }
    }
  });
  const uniquePrintColors = Array.from(printColorsSet);

  // Fetch monthly stats
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const { data: monthOrders } = await supabase
    .from('orders')
    .select('status, qty')
    .gte('order_date', startOfMonth);

  const monthlyStats = {
    total: monthOrders?.reduce((acc, o) => acc + o.qty, 0) || 0,
    running: monthOrders?.filter(o => !['delivered', 'canceled'].includes(o.status)).reduce((acc, o) => acc + o.qty, 0) || 0,
    delivered: monthOrders?.filter(o => o.status === 'delivered').reduce((acc, o) => acc + o.qty, 0) || 0,
    canceled: monthOrders?.filter(o => o.status === 'canceled').reduce((acc, o) => acc + o.qty, 0) || 0
  };

  // Apply Client-side filtering for Colors
  if (params.bodyColor && params.bodyColor !== "all") {
    orders = orders.filter((o: any) => o.body_color === params.bodyColor);
  }
  if (params.handleColor && params.handleColor !== "all") {
    orders = orders.filter((o: any) => o.handle_color === params.handleColor);
  }
  if (params.printColor && params.printColor !== "all") {
    orders = orders.filter((o: any) => {
      const pColor = o.print_color_config?.color || o.print_color_config?.name || "";
      return pColor.includes(params.printColor as string);
    });
  }

  // Apply Client-side filtering for Cut Type
  if (params.cut && params.cut !== "all") {
    orders = orders.filter((o: any) => o.cutting_type === params.cut);
  }

  // Apply Client-side filtering for Size
  if (params.size && params.size !== "all") {
    orders = orders.filter((o: any) => o.product?.bag_size === params.size);
  }

  // Apply Client-side sorting
  if (params.sort) {
    if (params.sort === "date_asc") {
      orders.sort((a: any, b: any) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
    } else if (params.sort === "date_desc") {
      orders.sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
    } else if (params.sort === "total_asc") {
      orders.sort((a: any, b: any) => a.total_amount - b.total_amount);
    } else if (params.sort === "total_desc") {
      orders.sort((a: any, b: any) => b.total_amount - a.total_amount);
    } else if (params.sort === "qty_asc") {
      orders.sort((a: any, b: any) => a.qty - b.qty);
    } else if (params.sort === "qty_desc") {
      orders.sort((a: any, b: any) => b.qty - a.qty);
    } else if (params.sort === "delivery_asc") {
      orders.sort((a: any, b: any) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime());
    } else if (params.sort === "delivery_desc") {
      orders.sort((a: any, b: any) => new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime());
    } else if (params.sort === "rate_asc") {
      orders.sort((a: any, b: any) => a.rate_per_piece - b.rate_per_piece);
    } else if (params.sort === "rate_desc") {
      orders.sort((a: any, b: any) => b.rate_per_piece - a.rate_per_piece);
    }
  }

  const createSortLink = (field: string) => {
    let newSort = `${field}_desc`;
    if (params.sort === `${field}_desc`) newSort = `${field}_asc`;
    
    const p = new URLSearchParams();
    if (currentTab !== "all") p.set("tab", currentTab);
    if (params.search) p.set("search", params.search);
    if (params.cut && params.cut !== "all") p.set("cut", params.cut);
    if (params.bodyColor && params.bodyColor !== "all") p.set("bodyColor", params.bodyColor);
    if (params.handleColor && params.handleColor !== "all") p.set("handleColor", params.handleColor);
    if (params.printColor && params.printColor !== "all") p.set("printColor", params.printColor);
    if (params.size && params.size !== "all") p.set("size", params.size);
    p.set("sort", newSort);
    
    return `/orders?${p.toString()}`;
  };

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

  const renderPrintColor = (config: any) => {
    if (!config) return <span className="text-muted-foreground">-</span>;
    if (config.type === "multi" || config.color === "multi" || (config.color && config.color.includes("-"))) {
      return (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <div className="flex -space-x-1 justify-center">
            {config.code1 && <div className="w-4 h-4 rounded-full shadow-sm border border-black/10 relative z-10" style={{ backgroundColor: config.code1 }} />}
            {config.code2 && <div className="w-4 h-4 rounded-full shadow-sm border border-black/10 relative z-0" style={{ backgroundColor: config.code2 }} />}
          </div>
          <span className="text-[13px]">{config.color}</span>
        </div>
      );
    }
    const singleColorCode = config.code1 || config.code;
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {singleColorCode && <div className="w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: singleColorCode }} />}
        <span className="text-[13px]">{config.color}</span>
      </div>
    );
  };

  const renderColorBox = (colorName: string) => {
    if (!colorName) return <span className="text-muted-foreground">-</span>;
    const hex = getColorHex(colorName, colorConfigs || []);
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <div className="w-4 h-4 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: hex }} />
        <span className="text-[13px] text-slate-700 dark:text-slate-300">{colorName}</span>
      </div>
    );
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

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Bags (This Month)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{monthlyStats.total.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bags in Prod</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{monthlyStats.running.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bags Delivered</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{monthlyStats.delivered.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bags Canceled</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mt-1">{monthlyStats.canceled.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6 space-y-6 pt-6">
          <div className="flex flex-col gap-4 px-4 sm:px-0">
            {/* Top Row: Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex space-x-1 bg-muted p-1 rounded-xl overflow-x-auto w-fit">
                {["all", "active", "delivered", "canceled"].map((tab) => (
                  <Link
                    key={tab}
                    href={`/orders?tab=${tab}${params.search ? `&search=${params.search}` : ""}${params.sort ? `&sort=${params.sort}` : ""}${params.cut ? `&cut=${params.cut}` : ""}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${currentTab === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {t(`tabs.${tab}`)}
                  </Link>
                ))}
              </div>

              <form className="relative w-full md:w-72 flex gap-2">
                <input type="hidden" name="tab" value={currentTab} />
                <input type="hidden" name="sort" value={params.sort || ""} />
                <input type="hidden" name="cut" value={params.cut || ""} />
                <input type="hidden" name="size" value={params.size || ""} />
                <input type="hidden" name="bodyColor" value={params.bodyColor || ""} />
                <input type="hidden" name="handleColor" value={params.handleColor || ""} />
                <input type="hidden" name="printColor" value={params.printColor || ""} />
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="text"
                    name="search"
                    defaultValue={params.search}
                    placeholder={t("searchPlaceholder")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background"
                  />
                </div>
                <Button type="submit" variant="secondary" className="px-3 rounded-xl hidden md:flex">
                  Search
                </Button>
              </form>
            </div>

            {/* Bottom Row: Filters & Sorting */}
            <OrderFilters
              currentTab={currentTab}
              currentSearch={params.search || ""}
              currentCut={params.cut || ""}
              currentSort={params.sort || ""}
              currentBodyColor={params.bodyColor || ""}
              currentHandleColor={params.handleColor || ""}
              currentSize={params.size || ""}
              uniqueBodyColors={uniqueBodyColors}
              uniqueHandleColors={uniqueHandleColors}
              uniqueSizes={uniqueSizes}
            />

            {/* Print Color Tags */}
            {uniquePrintColors.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                  <Palette size={14} /> Print Colors:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
                  {uniquePrintColors.map(color => (
                    <Link
                      key={color}
                      href={`/orders?${new URLSearchParams({
                        ...(currentTab !== "all" && { tab: currentTab }),
                        ...(params.search && { search: params.search }),
                        ...(params.sort && { sort: params.sort }),
                        ...(params.cut && params.cut !== "all" && { cut: params.cut }),
                        ...(params.size && params.size !== "all" && { size: params.size }),
                        ...(params.bodyColor && params.bodyColor !== "all" && { bodyColor: params.bodyColor }),
                        ...(params.handleColor && params.handleColor !== "all" && { handleColor: params.handleColor }),
                        ...(params.printColor !== color && { printColor: color }), // Toggle off if clicked again
                      }).toString()}`}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1.5 ${params.printColor === color
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      {renderColorBox(color)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-dashed mx-4 sm:mx-0">
              No orders found matching your criteria.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider"><Link href={createSortLink('date')} className="hover:text-emerald-600 flex items-center gap-1">Date {params.sort === 'date_asc' ? '↑' : params.sort === 'date_desc' ? '↓' : ''}</Link></TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider">Customer</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider text-center">Size</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider text-center">Cut</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider text-center">GSM</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider">Body Color</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider">Handle</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider">Print Color</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider text-right"><Link href={createSortLink('qty')} className="hover:text-emerald-600 flex justify-end items-center gap-1">Qty {params.sort === 'qty_asc' ? '↑' : params.sort === 'qty_desc' ? '↓' : ''}</Link></TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider text-right"><Link href={createSortLink('rate')} className="hover:text-emerald-600 flex justify-end items-center gap-1">Rate {params.sort === 'rate_asc' ? '↑' : params.sort === 'rate_desc' ? '↓' : ''}</Link></TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider text-right"><Link href={createSortLink('total')} className="hover:text-emerald-600 flex justify-end items-center gap-1">Total {params.sort === 'total_asc' ? '↑' : params.sort === 'total_desc' ? '↓' : ''}</Link></TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider text-center">Status</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider"><Link href={createSortLink('delivery')} className="hover:text-emerald-600 flex items-center gap-1">Delivery {params.sort === 'delivery_asc' ? '↑' : params.sort === 'delivery_desc' ? '↓' : ''}</Link></TableHead>
                      <TableHead className="font-semibold whitespace-nowrap px-3 text-xs uppercase tracking-wider text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order.id} className="border-b transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group">
                        <TableCell className="px-3 text-xs whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                          {format(new Date(order.order_date), "dd MMM yy")}
                        </TableCell>
                        <TableCell className="px-3">
                          <div className="font-medium text-[13px] text-slate-900 dark:text-slate-100 whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis" title={order.customer?.name}>
                            {order.customer?.name}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 text-center text-[13px] font-medium whitespace-nowrap">
                          {order.product?.bag_size || '-'}
                        </TableCell>
                        <TableCell className="px-3 text-center text-[13px] capitalize whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {order.cutting_type}
                        </TableCell>
                        <TableCell className="px-3 text-center text-[13px] font-medium whitespace-nowrap">
                          {order.gsm}
                        </TableCell>
                        <TableCell className="px-3">
                          {renderColorBox(order.body_color)}
                        </TableCell>
                        <TableCell className="px-3">
                          {order.cutting_type === 'handle' ? renderColorBox(order.handle_color) : <span className="text-muted-foreground text-center block">-</span>}
                        </TableCell>
                        <TableCell className="px-3">
                          {renderPrintColor(order.print_color_config)}
                        </TableCell>
                        <TableCell className="px-3 text-right text-[13px] font-medium text-slate-700 dark:text-slate-300">
                          {Number(order.qty).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-3 text-right text-[13px] text-slate-500 whitespace-nowrap">
                          ৳{Number(order.rate_per_piece).toFixed(2)}
                        </TableCell>
                        <TableCell className="px-3 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          ৳{Number(order.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-3 text-center whitespace-nowrap">
                          <OrderStatusUpdate compact orderId={order.id} currentStatus={order.status} />
                        </TableCell>
                        <TableCell className="px-3 text-xs whitespace-nowrap text-slate-500 font-medium">
                          {format(new Date(order.delivery_date), "dd MMM yy")}
                        </TableCell>
                        <TableCell className="px-3 text-center whitespace-nowrap">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 lg:hidden px-4 pb-4">
                {orders.map((order: any) => (
                  <Link href={`/orders/${order.id}`} key={order.id}>
                    <div className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
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

                      <div className="bg-slate-50 dark:bg-emerald-950/20 rounded-lg p-3 text-xs grid grid-cols-2 gap-x-2 gap-y-2 text-slate-700 dark:text-emerald-200/80 border border-slate-100 dark:border-emerald-900/30">
                        <div className="flex items-center justify-between"><span className="text-slate-400">Size:</span> <span className="font-medium">{order.product?.bag_size || '-'}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-400">GSM:</span> <span className="font-medium">{order.gsm}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-400">Cut:</span> <span className="font-medium capitalize">{order.cutting_type}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-400">Qty:</span> <span className="font-medium">{Number(order.qty).toLocaleString()}</span></div>

                        <div className="col-span-2 pt-2 mt-1 border-t border-slate-200/50 dark:border-emerald-900/30 flex justify-between items-center">
                          <span className="text-slate-400">Body Color:</span>
                          {renderColorBox(order.body_color)}
                        </div>
                        {order.cutting_type === 'handle' && (
                          <div className="col-span-2 flex justify-between items-center">
                            <span className="text-slate-400">Handle Color:</span>
                            {renderColorBox(order.handle_color)}
                          </div>
                        )}
                        <div className="col-span-2 flex justify-between items-center">
                          <span className="text-slate-400">Print Color:</span>
                          {renderPrintColor(order.print_color_config)}
                        </div>
                      </div>

                      <div className="flex justify-between items-end mt-1">
                        <div className="text-xs text-slate-500">Rate: ৳{Number(order.rate_per_piece).toFixed(2)}</div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-0.5 text-right">Total</div>
                          <div className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                            ৳{Number(order.total_amount).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
