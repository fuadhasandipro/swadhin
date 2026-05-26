"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DateRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  // Update query params when from/to change (debounce slightly to avoid multiple rapid pushes)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (from) params.set("from", from);
      else params.delete("from");
      
      if (to) params.set("to", to);
      else params.delete("to");

      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeout);
  }, [from, to, pathname, router, searchParams]);

  const setRange = (type: string) => {
    const now = new Date();
    let newFrom, newTo;

    switch (type) {
      case "today":
        newFrom = startOfDay(now);
        newTo = endOfDay(now);
        break;
      case "week":
        newFrom = startOfWeek(now, { weekStartsOn: 6 }); // Assuming Saturday start for Bangladesh
        newTo = endOfWeek(now, { weekStartsOn: 6 });
        break;
      case "month":
        newFrom = startOfMonth(now);
        newTo = endOfMonth(now);
        break;
      case "year":
        newFrom = startOfYear(now);
        newTo = endOfYear(now);
        break;
      default:
        return;
    }

    setFrom(format(newFrom, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
    setTo(format(newTo, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
  };

  const currentType = (): string => {
    // Basic heuristic to highlight active button
    if (!from || !to) return "month"; // default behavior is month if not set, but let's highlight based on dates
    const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
    const monthStr = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const weekStr = format(startOfWeek(new Date(), { weekStartsOn: 6 }), "yyyy-MM-dd");
    const yearStr = format(startOfYear(new Date()), "yyyy-MM-dd");
    const fStr = from.split('T')[0];
    
    if (fStr === todayStr) return "today";
    if (fStr === monthStr) return "month";
    if (fStr === weekStr) return "week";
    if (fStr === yearStr) return "year";
    return "custom";
  };

  const active = currentType();

  return (
    <Card className="sticky top-0 z-10 bg-white/80 dark:bg-[#0a0f0a]/80 backdrop-blur-md border-emerald-900/20 shadow-sm print:hidden">
      <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={active === "today" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setRange("today")}
            className={active === "today" ? "bg-emerald-600 text-white" : ""}
          >
            আজ
          </Button>
          <Button 
            variant={active === "week" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setRange("week")}
            className={active === "week" ? "bg-emerald-600 text-white" : ""}
          >
            এই সপ্তাহ
          </Button>
          <Button 
            variant={active === "month" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setRange("month")}
            className={active === "month" ? "bg-emerald-600 text-white" : ""}
          >
            এই মাস
          </Button>
          <Button 
            variant={active === "year" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setRange("year")}
            className={active === "year" ? "bg-emerald-600 text-white" : ""}
          >
            এই বছর
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-600" />
          <Input 
            type="date" 
            className="h-8 text-sm" 
            value={from ? from.split('T')[0] : ''} 
            onChange={(e) => setFrom(e.target.value ? new Date(e.target.value).toISOString() : "")} 
          />
          <span className="text-muted-foreground">-</span>
          <Input 
            type="date" 
            className="h-8 text-sm" 
            value={to ? to.split('T')[0] : ''} 
            onChange={(e) => setTo(e.target.value ? new Date(e.target.value).toISOString() : "")} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
