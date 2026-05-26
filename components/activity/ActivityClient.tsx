"use client";

import { useState, useEffect } from "react";
import { getActivityLogs, getActivityUsers } from "@/lib/actions/activityLogs";
import { ActivityLogTable } from "./ActivityLogTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";

export function ActivityClient({ isAdmin }: { isAdmin: boolean }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [userIdFilter, setUserIdFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const fetchLogs = async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await getActivityLogs({
        page: currentPage,
        limit: 50,
        userId: userIdFilter !== "all" ? userIdFilter : undefined,
        actionType: actionFilter !== "all" ? [actionFilter] : undefined,
        startDate: dateFilter ? new Date(dateFilter).toISOString() : undefined,
      });
      setLogs(res.data || []);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (isAdmin) {
      getActivityUsers().then(data => setUsers(data));
    }
  }, [userIdFilter, actionFilter, dateFilter]); // Re-fetch on filter change

  return (
    <div className="space-y-6">
      <Card className="border-emerald-900/10 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-emerald-900">Activity Logs</CardTitle>
            <CardDescription>Track all system events and actions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchLogs(page)} disabled={loading} className="w-fit">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            রিফ্রেশ
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {isAdmin && (
              <Select value={userIdFilter} onValueChange={(val) => setUserIdFilter(val || "all")}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল ইউজার</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={actionFilter} onValueChange={(val) => setActionFilter(val || "all")}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল অ্যাকশন</SelectItem>
                <SelectItem value="CREATE_ORDER">অর্ডার তৈরি</SelectItem>
                <SelectItem value="UPDATE_STATUS">স্ট্যাটাস আপডেট</SelectItem>
                <SelectItem value="CASH_TRANSACTION">নগদ লেনদেন</SelectItem>
                <SelectItem value="CREATE_CUSTOMER">গ্রাহক তৈরি</SelectItem>
                <SelectItem value="ADD_STOCK">স্টক যোগ</SelectItem>
                <SelectItem value="PAY_SALARY">বেতন প্রদান</SelectItem>
              </SelectContent>
            </Select>

            <Input 
              type="date" 
              className="w-full md:w-[200px]" 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              placeholder="From Date"
            />
            {dateFilter && (
              <Button variant="ghost" onClick={() => setDateFilter("")} className="text-slate-500">
                Clear Date
              </Button>
            )}
          </div>

          {loading && logs.length === 0 ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
          ) : (
            <>
              <ActivityLogTable logs={logs} />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-slate-500">
                    Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, totalCount)} of {totalCount} entries
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchLogs(page - 1)} 
                      disabled={page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchLogs(page + 1)} 
                      disabled={page === totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
