"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_MAP: Record<string, string> = {
  'CREATE_ORDER': 'নতুন অর্ডার তৈরি',
  'UPDATE_STATUS': 'অর্ডার স্ট্যাটাস আপডেট',
  'DELETE_ORDER': 'অর্ডার ডিলিট',
  'ADD_STOCK': 'নতুন স্টক যোগ',
  'UPDATE_PRODUCT': 'স্টক আপডেট',
  'RESTOCK_PRODUCT': 'রিস্টক',
  'DELETE_PRODUCT': 'স্টক ডিলিট',
  'CASH_TRANSACTION': 'ক্যাশ ট্রানজেকশন',
  'CREATE_CUSTOMER': 'গ্রাহক তৈরি',
  'UPDATE_CUSTOMER': 'গ্রাহক আপডেট',
  'DELETE_CUSTOMER': 'গ্রাহক ডিলিট',
  'ADJUST_BALANCE': 'ব্যালেন্স অ্যাডজাস্ট',
  'CASH_COLLECTION': 'নগদ সংগ্রহ',
  'PAY_SALARY': 'বেতন প্রদান',
  'CREATE_MANAGER': 'ম্যানেজার তৈরি',
  'UPDATE_PRIVILEGES': 'প্রিভিলেজ আপডেট',
  'UPDATE_SALARY': 'বেতন পরিবর্তন',
  'TOGGLE_USER_STATUS': 'স্ট্যাটাস টগল',
  'UPDATE_SETTING': 'সেটিংস আপডেট',
  'CREATE_PRINT_CONFIG': 'প্রিন্ট কালার তৈরি',
  'TOGGLE_PRINT_CONFIG': 'প্রিন্ট কালার টগল',
  'SEND_TEST_SMS': 'টেস্ট SMS',
  'CREATE_EXPENSE_CATEGORY': 'খরচ ক্যাটাগরি তৈরি',
  'DELETE_EXPENSE_CATEGORY': 'খরচ ক্যাটাগরি ডিলিট',
};

export function ActivityLogTable({ logs }: { logs: any[] }) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatEntityName = (log: any) => {
    switch (log.entity_type) {
      case 'orders': return `অর্ডার #${log.entity_id.slice(0, 8)}`;
      case 'customers': return `গ্রাহক (ID: ${log.entity_id.slice(0, 8)})`;
      case 'products': return `স্টক (ID: ${log.entity_id.slice(0, 8)})`;
      default: return log.entity_type;
    }
  };

  return (
    <div className="rounded-md border border-emerald-900/10 bg-white overflow-hidden shadow-sm">
      {/* Mobile View */}
      <div className="md:hidden divide-y divide-emerald-900/10">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">কোন লগ পাওয়া যায়নি</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col gap-3 hover:bg-emerald-50/20 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Badge variant="secondary" className="bg-emerald-100/50 text-emerald-800 mb-2 whitespace-normal text-left">
                    {ACTION_MAP[log.action] || log.action}
                  </Badge>
                  <div className="font-semibold text-slate-800 text-sm">
                    {formatEntityName(log)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="font-semibold text-slate-800 text-sm">{log.profile?.full_name || 'System'}</span>
                  {log.profile?.role && (
                    <Badge variant="outline" className={cn(
                      "text-[10px] h-4 px-1.5 leading-none py-1",
                      log.profile.role === 'admin' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                    )}>
                      {log.profile.role}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>{format(new Date(log.created_at), "dd MMM yyyy, hh:mm a", { locale: bn })}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => toggleRow(log.id)}
                >
                  {expandedRows[log.id] ? "কম দেখান" : "বিস্তারিত দেখান"} {expandedRows[log.id] ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </Button>
              </div>
              {expandedRows[log.id] && (
                <div className="mt-1 text-xs overflow-x-auto w-full max-w-[calc(100vw-4rem)]">
                  <pre className="text-slate-600 font-mono bg-slate-100/50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap word-break-all">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto w-full">
        <Table>
          <TableHeader className="bg-emerald-50/50">
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>তারিখ ও সময়</TableHead>
              <TableHead>ব্যবহারকারী</TableHead>
              <TableHead>অ্যাকশন</TableHead>
              <TableHead>এন্টিটি</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  কোন লগ পাওয়া যায়নি
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <React.Fragment key={`desktop-${log.id}`}>
                  <TableRow className={cn("hover:bg-emerald-50/30", expandedRows[log.id] && "bg-emerald-50/30")}>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-6 w-6 text-slate-400 hover:text-emerald-600"
                        onClick={() => toggleRow(log.id)}
                      >
                        {expandedRows[log.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                      {format(new Date(log.created_at), "dd MMM yyyy, hh:mm a", { locale: bn })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{log.profile?.full_name || 'System'}</span>
                        {log.profile?.role && (
                          <Badge variant="outline" className={cn(
                            "text-[10px] h-5 px-1.5",
                            log.profile.role === 'admin' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {log.profile.role}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-100/50 text-emerald-800 hover:bg-emerald-100">
                        {ACTION_MAP[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatEntityName(log)}
                    </TableCell>
                  </TableRow>
                  {expandedRows[log.id] && (
                    <TableRow className="bg-slate-50/50">
                      <TableCell colSpan={5} className="p-0">
                        <div className="p-4 border-t border-slate-100 text-sm overflow-x-auto">
                          <pre className="text-slate-600 font-mono bg-slate-100/50 p-4 rounded-md whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
