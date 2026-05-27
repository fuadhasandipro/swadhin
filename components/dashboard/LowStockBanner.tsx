"use client";

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Link } from '@/routing';

export function LowStockBanner({ count }: { count: number }) {
  const [isVisible, setIsVisible] = useState(true);

  if (count === 0 || !isVisible) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 mb-2 flex items-center justify-between shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
          <AlertTriangle size={18} />
        </div>
        <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
          ⚠️ Stock alert: {count} orders are waiting — Insufficient stock. {' '}
          <Link href="/stock" className="font-bold underline hover:text-amber-900 dark:hover:text-amber-200">
            Please restock immediately.
          </Link>
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="p-1.5 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}
