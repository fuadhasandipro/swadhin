"use client";

import { useAuthStore } from '@/lib/stores/authStore';
import { usePathname, Link } from '@/routing';
import {
  LayoutDashboard,
  PackageSearch,
  Kanban,
  Users,
  Layers,
  Banknote,
  BarChart3,
  Wallet,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Truck,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Image from 'next/image';

const navGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
      { href: '/kanban', label: 'Kanban Board', icon: Kanban, id: 'kanban' },
      { href: '/activity', label: 'Activity Log', icon: History, id: 'activity' },
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { href: '/orders', label: 'Orders', icon: PackageSearch, id: 'orders' },
      { href: '/customers', label: 'Customers', icon: Users, id: 'customers' },
      { href: '/stock', label: 'Stock', icon: Layers, id: 'stock' },
      { href: '/deliveries', label: 'Delivery', icon: Send, id: 'deliveries' },
      { href: '/cash-collection', label: 'Cash Collection', icon: Banknote, id: 'cash_collection' },
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { href: '/cash', label: 'Cash Flow', icon: Banknote, id: 'cash' },
      { href: '/suppliers', label: 'Suppliers', icon: Truck, id: 'suppliers' },
    ]
  },
  {
    title: 'ADMIN',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3, id: 'reports' },
      { href: '/salary', label: 'Salary', icon: Wallet, id: 'salary' },
      { href: '/settings', label: 'Settings', icon: Settings, id: 'settings' },
    ]
  }
];

export function Sidebar() {
  const { profile } = useAuthStore();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!profile) {
    return (
      <aside className="hidden md:flex flex-col w-[240px] h-screen bg-[#03200f] border-r border-[#0a361f] animate-pulse">
        <div className="h-16 flex items-center gap-3 px-4 border-b border-[#0a361f]">
          <div className="w-8 h-8 bg-[#0a361f] rounded-lg"></div>
          <div className="w-24 h-6 bg-[#0a361f] rounded"></div>
        </div>
        <div className="flex-1 py-6 px-3 flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-[#0a361f]/50 rounded-lg"></div>
          ))}
        </div>
      </aside>
    );
  }

  const role = profile.role;
  let privileges: any = {};
  if (typeof profile.privileges === 'string') {
    try { privileges = JSON.parse(profile.privileges); } catch (e) { }
  } else if (profile.privileges) {
    privileges = profile.privileges;
  }

  const isVisible = (id: string) => {
    if (role === 'admin') return id !== 'cash_collection';

    if (role === 'manager') {
      switch (id) {
        case 'orders':
        case 'customers':
        case 'stock':
        case 'deliveries':
        case 'cash_collection':
          return true;
        default:
          return false;
      }
    }

    if (role === 'staff') {
      return id === 'dashboard' || id === 'orders';
    }

    return false;
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-[#03200f] dark:bg-[rgba(10,20,10,0.95)] border-r border-[#0a361f] transition-all duration-300 relative",
        collapsed ? "w-[80px]" : "w-[240px]"
      )}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-[#0a361f]">
        <div className="flex items-center gap-3 px-4 w-full">
          <div className="bg-[#fff] text-emerald-400 p-2 rounded-lg flex-shrink-0 font-bold text-xs h-8 w-8 flex items-center justify-center">
            <Image src="/icon.svg" alt="Logo" width={90} height={75} />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-heading font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                Swadhin Enterprize
              </span>
              <span className="text-[10px] text-[#c9d2d1] whitespace-nowrap">Bag Print Management</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-emerald-800 text-white p-1 rounded-full border border-emerald-600 hover:bg-emerald-700 transition-colors z-10 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-6 no-scrollbar">
        {navGroups.map((group, groupIdx) => {
          const visibleGroupItems = group.items.filter(item => isVisible(item.id));
          if (visibleGroupItems.length === 0) return null;

          return (
            <div key={groupIdx} className="flex flex-col gap-1">
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold text-[#c9d2d1]/60 tracking-widest uppercase">
                  {group.title}
                </div>
              )}
              {visibleGroupItems.map((item) => {
                const isActive = pathname?.startsWith(item.href) || false; // Quick matching, might need better strict match for /cash
                const Icon = item.icon;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                      isActive
                        ? "bg-[#0a361f] text-emerald-400 font-semibold border-l-2 border-emerald-400"
                        : "text-[#c9d2d1] hover:bg-[#0a361f]/50 hover:text-emerald-400 border-l-2 border-transparent"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className={cn("flex-shrink-0 transition-transform group-hover:scale-110", isActive && "text-emerald-400")} />

                    {!collapsed && (
                      <span className="font-sans text-sm whitespace-nowrap overflow-hidden transition-all">
                        {item.label}
                      </span>
                    )}

                    {collapsed && (
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#0a361f] text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-[#03200f]">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
