"use client";

import { useTheme } from 'next-themes';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useEffect, useState } from 'react';

interface ChartProps {
  data: { name: string, income: number, expense: number }[];
}

export function MonthlyCashChart({ data }: ChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[300px] w-full mt-4 animate-pulse bg-emerald-900/10 rounded-xl" />;

  const isDark = resolvedTheme === 'dark';
  
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1f2937" : "#e5e7eb"} />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12, fontFamily: 'var(--font-sans)' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12, fontFamily: 'var(--font-sans)' }}
            tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#0a0f0a' : '#ffffff', 
              borderColor: isDark ? '#064e3b' : '#e5e7eb',
              borderRadius: '12px',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: any, name: any) => [
              `৳${Number(value).toLocaleString('en-IN')}`, 
              name === 'income' ? 'আয় (Income)' : 'ব্যয় (Expense)'
            ]}
          />
          <Area 
            type="monotone" 
            dataKey="income" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorIncome)" 
          />
          <Area 
            type="monotone" 
            dataKey="expense" 
            stroke="#e11d48" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorExpense)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
