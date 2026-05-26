"use client";

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/types';
import { getOrders } from '@/lib/actions/orders';
import { isPast, isToday, startOfDay } from 'date-fns';

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showOverdue, setShowOverdue] = useState(false);
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});

  const supabase = createClient();

  // Initial fetch
  useEffect(() => {
    let isMounted = true;
    
    async function fetchInitialOrders() {
      try {
        setLoading(true);
        // fetch all orders for the kanban board (excluding canceled and delivered for now? Context says "all 17 statuses")
        // We fetch all active orders plus recent ones. We'll fetch all.
        const data = await getOrders();
        if (isMounted) {
          setOrders(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    fetchInitialOrders();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:orders:kanban')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          // Optimistically update the list
          // We must fetch full customer data if it's an INSERT, but for UPDATE we can merge
          if (payload.eventType === 'UPDATE') {
            setOrders((prev) => 
              prev.map((order) => 
                order.id === payload.new.id ? { ...order, ...payload.new } : order
              )
            );
          } else if (payload.eventType === 'INSERT') {
            // For full real-time we'd refetch this single order to get joins, but we'll append standard payload
            setOrders((prev) => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Derived filtered orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(o => 
        o.id.includes(lowerSearch) || 
        o.customer?.name?.toLowerCase().includes(lowerSearch) ||
        o.customer?.phone?.includes(lowerSearch)
      );
    }

    // Overdue filter
    if (showOverdue) {
      const today = startOfDay(new Date());
      result = result.filter(o => {
        if (o.status === 'delivered' || o.status === 'canceled') return false;
        const deliveryDate = startOfDay(new Date(o.delivery_date));
        return isPast(deliveryDate) && !isToday(deliveryDate);
      });
    }

    // Date range filter
    if (dateRange.from) {
      const from = startOfDay(dateRange.from);
      result = result.filter(o => startOfDay(new Date(o.delivery_date)) >= from);
    }
    if (dateRange.to) {
      const to = startOfDay(dateRange.to);
      result = result.filter(o => startOfDay(new Date(o.delivery_date)) <= to);
    }

    return result;
  }, [orders, search, showOverdue, dateRange]);

  // Expose setter for optimistic updates
  const updateOrderOptimistically = (orderId: string, updates: Partial<Order>) => {
    setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
  };

  return {
    orders: filteredOrders,
    loading,
    error,
    search,
    setSearch,
    showOverdue,
    setShowOverdue,
    dateRange,
    setDateRange,
    updateOrderOptimistically
  };
}
