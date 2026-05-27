"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'blue';
  prefix?: string;
  suffix?: string;
  valueColor?: string;
}

export function KPICard({ title, value, subtitle, icon, variant = 'emerald', prefix = '', suffix = '', valueColor }: KPICardProps) {
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

  const iconStyles = {
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn("p-2 rounded-xl flex items-center justify-center", iconStyles[variant])}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold font-sans flex items-baseline gap-1", valueColor || "text-foreground")}>
            {prefix && <span className="text-lg opacity-60">{prefix}</span>}
            {Math.floor(displayValue).toLocaleString('en-IN')}
            {suffix && <span className="text-lg opacity-60">{suffix}</span>}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
