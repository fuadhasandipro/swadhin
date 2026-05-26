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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Image from 'next/image';

const navItems = [
  { href: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, id: 'dashboard' },
  { href: '/orders', label: 'অর্ডার', icon: PackageSearch, id: 'orders' },
  { href: '/kanban', label: 'কানবান', icon: Kanban, id: 'kanban' },
  { href: '/customers', label: 'গ্রাহক', icon: Users, id: 'customers' },
  { href: '/stock', label: 'স্টক', icon: Layers, id: 'stock' },
  { href: '/cash', label: 'নগদ', icon: Banknote, id: 'cash' },
  { href: '/reports', label: 'রিপোর্ট', icon: BarChart3, id: 'reports' },
  { href: '/salary', label: 'বেতন', icon: Wallet, id: 'salary' },
  { href: '/activity', label: 'লগ', icon: History, id: 'activity' },
  { href: '/settings', label: 'সেটিংস', icon: Settings, id: 'settings' },
];

export function Sidebar() {
  const { profile } = useAuthStore();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!profile) {
    return (
      <aside className="hidden md:flex flex-col w-[240px] h-screen bg-[#0f1a0f] border-r border-emerald-900/30 animate-pulse">
        <div className="h-16 flex items-center gap-3 px-4 border-b border-emerald-900/30">
          <div className="w-8 h-8 bg-emerald-900/50 rounded-lg"></div>
          <div className="w-24 h-6 bg-emerald-900/50 rounded"></div>
        </div>
        <div className="flex-1 py-6 px-3 flex flex-col gap-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 bg-emerald-900/20 rounded-xl"></div>
          ))}
        </div>
      </aside>
    );
  }

  const role = profile.role;
  let privileges: any = {};
  if (typeof profile.privileges === 'string') {
    try { privileges = JSON.parse(profile.privileges); } catch (e) {}
  } else if (profile.privileges) {
    privileges = profile.privileges;
  }

  const isVisible = (id: string) => {
    if (role === 'admin') return true;
    
    if (role === 'manager') {
      const isOrderManager = (Array.isArray(privileges) ? privileges.includes('order_manager') : privileges?.order_manager === true);
      const isDeliveryManager = (Array.isArray(privileges) ? privileges.includes('delivery_manager') : privileges?.delivery_manager === true);
      
      switch (id) {
        case 'dashboard':
        case 'orders':
        case 'kanban':
          return isOrderManager || isDeliveryManager;
        case 'customers':
        case 'stock':
        case 'cash':
        case 'reports':
        case 'activity':
          return isOrderManager;
        case 'salary':
        case 'settings':
          return false;
        default:
          return false;
      }
    }

    if (role === 'staff') {
      return id === 'dashboard' || id === 'orders';
    }

    return false;
  };

  const visibleItems = navItems.filter(item => isVisible(item.id));

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-screen bg-[#0f1a0f] dark:bg-[rgba(10,20,10,0.95)] border-r border-emerald-900/30 transition-all duration-300 relative",
        collapsed ? "w-[80px]" : "w-[240px]"
      )}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-emerald-900/30">
        <div className="flex items-center gap-3 px-4 w-full">
          <div className="bg-emerald-900/50 p-2 rounded-lg flex-shrink-0">
            <Image src="/next.svg" alt="Logo" width={24} height={24} className="invert" />
          </div>
          {!collapsed && (
            <span className="font-heading font-bold text-emerald-400 whitespace-nowrap overflow-hidden text-ellipsis">
              Swadhin
            </span>
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

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 no-scrollbar">
        {visibleItems.map((item) => {
          const isActive = pathname?.startsWith(item.href) || false;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                  : "text-emerald-300/70 hover:bg-emerald-900/40 hover:text-emerald-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={22} className={cn("flex-shrink-0 transition-transform group-hover:scale-110", isActive && "text-white")} />
              
              {!collapsed && (
                <span className="font-sans font-medium whitespace-nowrap overflow-hidden transition-all">
                  {item.label}
                </span>
              )}

              {/* Hover tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-emerald-900 text-emerald-100 text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-emerald-800">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
