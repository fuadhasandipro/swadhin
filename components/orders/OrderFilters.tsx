"use client";

import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown } from "lucide-react";

export function OrderFilters({ 
  currentTab, 
  currentSearch, 
  currentCut, 
  currentSort,
  currentBodyColor,
  currentHandleColor,
  currentPrintColor,
  uniqueBodyColors,
  uniqueHandleColors,
  uniquePrintColors
}: { 
  currentTab: string, 
  currentSearch: string, 
  currentCut: string, 
  currentSort: string,
  currentBodyColor: string,
  currentHandleColor: string,
  currentPrintColor: string,
  uniqueBodyColors: string[],
  uniqueHandleColors: string[],
  uniquePrintColors: string[]
}) {
  const router = useRouter();

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cut = e.target.name === 'cut' ? e.target.value : currentCut;
    const sort = e.target.name === 'sort' ? e.target.value : currentSort;
    const bodyColor = e.target.name === 'bodyColor' ? e.target.value : currentBodyColor;
    const handleColor = e.target.name === 'handleColor' ? e.target.value : currentHandleColor;
    const printColor = e.target.name === 'printColor' ? e.target.value : currentPrintColor;
    const tab = e.target.name === 'tab' ? e.target.value : currentTab;
    
    const params = new URLSearchParams();
    if (tab && tab !== "all") params.set("tab", tab);
    if (currentSearch) params.set("search", currentSearch);
    if (cut && cut !== "all") params.set("cut", cut);
    if (sort && sort !== "date_desc") params.set("sort", sort);
    if (bodyColor && bodyColor !== "all") params.set("bodyColor", bodyColor);
    if (handleColor && handleColor !== "all") params.set("handleColor", handleColor);
    if (printColor && printColor !== "all") params.set("printColor", printColor);
    
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 text-muted-foreground ml-2 font-medium">
        <Filter size={14} /> Filter:
      </div>

      <select 
        name="tab" 
        value={currentTab || "all"}
        onChange={handleFilterChange}
        className="h-8 rounded-lg border-slate-200 text-xs px-2 bg-white dark:bg-slate-950 dark:border-slate-800 focus:ring-emerald-500"
      >
        <option value="all">All Status</option>
        <option value="order_placed">Order Placed</option>
        <option value="designing">Designing</option>
        <option value="design_waiting_confirmation">Design Waiting Confirmation</option>
        <option value="design_confirmed">Design Confirmed</option>
        <option value="waiting_for_plate">Waiting for Plate</option>
        <option value="plate_done">Plate Done</option>
        <option value="waiting_stock">Waiting for Stock</option>
        <option value="waiting_print">Waiting for Print</option>
        <option value="one_color_done">1st Color Print Done</option>
        <option value="drying">Drying</option>
        <option value="two_color_done">2nd Color Print Done</option>
        <option value="waiting_handle">Waiting for Handle</option>
        <option value="handle_done">Handle Done</option>
        <option value="ready_delivery">Ready for Delivery</option>
        <option value="on_the_way">On The Way</option>
        <option value="delivered">Delivered</option>
        <option value="canceled">Canceled</option>
      </select>

      <select 
        name="cut" 
        value={currentCut || "all"}
        onChange={handleFilterChange}
        className="h-8 rounded-lg border-slate-200 text-xs px-2 bg-white dark:bg-slate-950 dark:border-slate-800 focus:ring-emerald-500"
      >
        <option value="all">All Cuts</option>
        <option value="handle">Handle Cut</option>
        <option value="d-cut">D-Cut</option>
      </select>
      
      {uniqueBodyColors.length > 0 && (
        <select 
          name="bodyColor" 
          value={currentBodyColor || "all"}
          onChange={handleFilterChange}
          className="h-8 rounded-lg border-slate-200 text-xs px-2 bg-white dark:bg-slate-950 dark:border-slate-800 focus:ring-emerald-500"
        >
          <option value="all">All Body Colors</option>
          {uniqueBodyColors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {uniqueHandleColors.length > 0 && (
        <select 
          name="handleColor" 
          value={currentHandleColor || "all"}
          onChange={handleFilterChange}
          className="h-8 rounded-lg border-slate-200 text-xs px-2 bg-white dark:bg-slate-950 dark:border-slate-800 focus:ring-emerald-500"
        >
          <option value="all">All Handle Colors</option>
          {uniqueHandleColors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {uniquePrintColors.length > 0 && (
        <select 
          name="printColor" 
          value={currentPrintColor || "all"}
          onChange={handleFilterChange}
          className="h-8 rounded-lg border-slate-200 text-xs px-2 bg-white dark:bg-slate-950 dark:border-slate-800 focus:ring-emerald-500 max-w-[120px] truncate"
        >
          <option value="all">All Print Colors</option>
          {uniquePrintColors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block" />
      
      <div className="flex items-center gap-2 text-muted-foreground font-medium">
        <ArrowUpDown size={14} /> Sort:
      </div>
      <select 
        name="sort" 
        value={currentSort || "date_desc"}
        onChange={handleFilterChange}
        className="h-8 rounded-lg border-slate-200 text-xs px-2 bg-white dark:bg-slate-950 dark:border-slate-800 focus:ring-emerald-500"
      >
        <option value="date_desc">Newest First</option>
        <option value="date_asc">Oldest First</option>
        <option value="total_desc">Highest Total</option>
        <option value="qty_desc">Highest Quantity</option>
      </select>
    </div>
  );
}
