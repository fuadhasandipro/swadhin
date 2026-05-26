"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types';

export function NotificationsPanel({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const supabase = createClient();

  const { data: lowStockProducts, isLoading } = useQuery({
    queryKey: ['low-stock-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .lt('qty', 10);
      
      if (error) throw error;
      return data as Product[];
    },
    refetchInterval: 300000, // 5 mins
  });

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
              ) : lowStockProducts && lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl flex items-start gap-3">
                    <div className="bg-red-900/30 p-2 rounded-lg text-red-400 mt-0.5">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 className="font-sans font-medium text-red-400">Low Stock: {product.bag_size}</h3>
                      <p className="text-red-300/70 text-sm mt-1 font-sans">
                          Only <span className="font-bold text-red-400">{product.qty} pcs</span> remaining.
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
  const supabase = createClient();

  const { data: count } = useQuery({
    queryKey: ['low-stock-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('qty', 10);
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 60000, // 1 minute
  });

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
