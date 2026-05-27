"use client";

import { useTheme } from 'next-themes';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
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

  if (!mounted) return <div className="h-[280px] w-full mt-4 animate-pulse bg-emerald-900/10 rounded-xl" />;

  const isDark = resolvedTheme === 'dark';

  // Find max value for annotation
  const maxEntry = data.reduce((prev, curr) => 
    (curr.income > prev.income ? curr : prev), data[0]
  );
  
  return (
    <div className="h-[280px] w-full mt-2">
      <div className="flex justify-between items-center mb-2 px-1">
        <p className="text-xs text-muted-foreground">
          Peak: ৳{Math.max(...data.map(d => d.income)).toLocaleString('en-IN')} — {maxEntry?.name} (current month)
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Income
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> Expense
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          barCategoryGap="30%"
          barGap={3}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1f2937" : "#e5e7eb"} />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            dy={8}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            cursor={{ fill: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(0,0,0,0.03)', radius: 8 }}
            contentStyle={{ 
              backgroundColor: isDark ? '#0a0f0a' : '#ffffff', 
              borderColor: isDark ? '#064e3b' : '#e5e7eb',
              borderRadius: '12px',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              fontSize: '12px'
            }}
            formatter={(value: any, name: any) => [
              `৳${Number(value).toLocaleString('en-IN')}`, 
              name === 'income' ? 'Income' : 'Expense'
            ]}
          />
          <Bar 
            dataKey="income" 
            fill="#10b981" 
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
          <Bar 
            dataKey="expense" 
            fill="#fb7185" 
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
