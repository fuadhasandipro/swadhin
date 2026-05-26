"use client";

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Link } from '@/routing';

export function LowStockBanner({ count }: { count: number }) {
  const [isVisible, setIsVisible] = useState(true);

  if (count === 0 || !isVisible) return null;

  return (
    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-3 mb-6 flex items-center justify-between shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h3 className="font-sans font-medium text-red-800 dark:text-red-200 text-sm">স্টক অ্যালার্ট (Stock Alert)</h3>
          <p className="text-red-600 dark:text-red-400/80 text-xs mt-0.5">
            ⚠️ স্টক কম: {count} টি পণ্যের স্টক কম আছে।{' '}
            <Link href="/stock" className="font-bold underline hover:text-red-700 dark:hover:text-red-300">
              চেক করুন
            </Link>
          </p>
        </div>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}
