"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'blue';
  prefix?: string;
  suffix?: string;
}

export function KPICard({ title, value, subtitle, icon, variant = 'emerald', prefix = '', suffix = '' }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepTime = Math.abs(Math.floor(duration / steps));
    let current = 0;
    const increment = value / steps;
    
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= value) || (increment < 0 && current <= value)) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]);

  const colorStyles = {
    emerald: "text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(225,29,72,0.1)]",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.1)]",
  };

  const iconStyles = {
    emerald: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400",
    blue: "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 relative overflow-hidden group", colorStyles[variant])}
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="font-sans font-medium text-slate-600 dark:text-emerald-100/70 text-sm group-hover:text-slate-900 dark:group-hover:text-emerald-100 transition-colors">
          {title}
        </h3>
        <div className={cn("p-2 rounded-xl flex items-center justify-center", iconStyles[variant])}>
          {icon}
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="text-2xl font-bold font-sans text-slate-800 dark:text-white flex items-baseline gap-1">
          {prefix && <span className="text-lg opacity-60">{prefix}</span>}
          {Math.floor(displayValue).toLocaleString('en-IN')}
          {suffix && <span className="text-lg opacity-60">{suffix}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-emerald-100/50 mt-1">{subtitle}</p>
        )}
      </div>

      <div className={cn(
        "absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-40 transition-opacity duration-300",
        variant === 'emerald' && "bg-emerald-500",
        variant === 'amber' && "bg-amber-500",
        variant === 'rose' && "bg-rose-500",
        variant === 'blue' && "bg-blue-500",
      )} />
    </motion.div>
  );
}
