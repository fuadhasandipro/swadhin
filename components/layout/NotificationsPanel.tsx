"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, PackageSearch, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

type NotificationItem = {
  id: string;
  type: 'low_stock' | 'ready_delivery' | 'waiting_design';
  title: string;
  description: string;
  timestamp?: string;
};

// Global helper for dismissed notifications
const getDismissedIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('dismissed_notifications');
  return saved ? JSON.parse(saved) : [];
};

const dismissNotificationId = (id: string) => {
  const current = getDismissedIds();
  if (!current.includes(id)) {
    const next = [...current, id];
    localStorage.setItem('dismissed_notifications', JSON.stringify(next));
    window.dispatchEvent(new Event('notifications_updated'));
  }
};

const useNotificationsData = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: ['system-notifications-full'],
    queryFn: async () => {
      const items: NotificationItem[] = [];

      // 1. Low Stock
      const { data: lowStock } = await supabase
        .from('products')
        .select('*')
        .lt('qty', 10);
      
      if (lowStock) {
        lowStock.forEach(p => {
          items.push({
            id: `stock-${p.id}`,
            type: 'low_stock',
            title: `Low Stock: ${p.bag_size} ${p.bag_color ? `(${p.bag_color})` : ''}`,
            description: `Only ${p.qty} pcs remaining.`,
          });
        });
      }

      // 2. Ready for Delivery Orders
      const { data: readyOrders } = await supabase
        .from('orders')
        .select('id, created_at, customer_id')
        .eq('status', 'ready_delivery')
        .order('created_at', { ascending: false });

      if (readyOrders) {
        readyOrders.forEach(o => {
          items.push({
            id: `ready-${o.id}`,
            type: 'ready_delivery',
            title: `Ready for Delivery`,
            description: `Order #${o.id.split('-')[0].toUpperCase()} is ready for delivery.`,
            timestamp: o.created_at,
          });
        });
      }

      // 3. Waiting Design Confirmation
      const { data: designOrders } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('status', 'design_waiting_confirmation')
        .order('created_at', { ascending: false });

      if (designOrders) {
        designOrders.forEach(o => {
          items.push({
            id: `design-${o.id}`,
            type: 'waiting_design',
            title: `Action Required`,
            description: `Order #${o.id.split('-')[0].toUpperCase()} is waiting for design confirmation.`,
            timestamp: o.created_at,
          });
        });
      }

      return items;
    },
    staleTime: 60000,
  });
};

export function NotificationsPanel({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: allNotifications, isLoading } = useNotificationsData();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    setDismissedIds(getDismissedIds());
    const handleUpdate = () => setDismissedIds(getDismissedIds());
    window.addEventListener('notifications_updated', handleUpdate);
    return () => window.removeEventListener('notifications_updated', handleUpdate);
  }, []);

  const notifications = allNotifications?.filter(n => !dismissedIds.includes(n.id)) || [];



  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#0a0f0a] border-l border-emerald-900/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-emerald-900/30">
              <div className="flex items-center gap-2 text-emerald-400">
                <Bell size={20} />
                <h2 className="font-heading font-bold text-lg">সতর্কতা (Alerts)</h2>
              </div>
              <button onClick={onClose} className="p-2 text-emerald-500 hover:text-emerald-300 bg-emerald-900/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {isLoading ? (
                <div className="text-center text-emerald-600 font-sans mt-10 animate-pulse">
                  লোড হচ্ছে...
                </div>
              ) : notifications && notifications.length > 0 ? (
                notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 border rounded-xl flex items-start gap-3 relative group
                        ${notif.type === 'low_stock' ? 'bg-red-950/20 border-red-900/50' : ''}
                        ${notif.type === 'ready_delivery' ? 'bg-blue-950/20 border-blue-900/50' : ''}
                        ${notif.type === 'waiting_design' ? 'bg-amber-950/20 border-amber-900/50' : ''}
                      `}
                    >
                      <button 
                        onClick={() => dismissNotificationId(notif.id)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-200 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Mark as read"
                      >
                        <X size={14} />
                      </button>
                      <div className={`p-2 rounded-lg mt-0.5
                        ${notif.type === 'low_stock' ? 'bg-red-900/30 text-red-400' : ''}
                        ${notif.type === 'ready_delivery' ? 'bg-blue-900/30 text-blue-400' : ''}
                        ${notif.type === 'waiting_design' ? 'bg-amber-900/30 text-amber-400' : ''}
                      `}>
                        {notif.type === 'low_stock' && <AlertTriangle size={18} />}
                        {notif.type === 'ready_delivery' && <CheckCircle2 size={18} />}
                        {notif.type === 'waiting_design' && <PackageSearch size={18} />}
                      </div>
                      <div className="pr-4">
                        <h3 className={`font-sans font-medium 
                          ${notif.type === 'low_stock' ? 'text-red-400' : ''}
                          ${notif.type === 'ready_delivery' ? 'text-blue-400' : ''}
                          ${notif.type === 'waiting_design' ? 'text-amber-400' : ''}
                        `}>
                          {notif.title}
                        </h3>
                        <p className={`text-sm mt-1 font-sans
                          ${notif.type === 'low_stock' ? 'text-red-300/70' : ''}
                          ${notif.type === 'ready_delivery' ? 'text-blue-300/70' : ''}
                          ${notif.type === 'waiting_design' ? 'text-amber-300/70' : ''}
                        `}>
                          {notif.description}
                        </p>
                      </div>
                    </div>
                ))
              ) : (
                <div className="text-center text-emerald-600 font-sans mt-20 flex flex-col items-center">
                  <Bell size={40} className="mb-4 opacity-50" />
                  <p>কোনো সতর্কতা নেই</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function NotificationBell({ onClick }: { onClick: () => void }) {
  const { data: allNotifications } = useNotificationsData();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    setDismissedIds(getDismissedIds());
    const handleUpdate = () => setDismissedIds(getDismissedIds());
    window.addEventListener('notifications_updated', handleUpdate);
    return () => window.removeEventListener('notifications_updated', handleUpdate);
  }, []);

  const count = allNotifications?.filter(n => !dismissedIds.includes(n.id)).length || 0;

  return (
    <button onClick={onClick} className="relative p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 rounded-full transition-colors cursor-pointer">
      <Bell size={20} />
      {count !== undefined && count > 0 && (
        <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#0a0f0a]">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
