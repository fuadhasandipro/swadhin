"use client";

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { usePathname, Link } from '@/routing';
import { 
  LayoutDashboard, 
  PackageSearch, 
  Kanban, 
  Banknote, 
  Menu,
  X,
  Users, 
  Layers, 
  BarChart3, 
  Wallet, 
  History, 
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const primaryItems = [
  { href: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, id: 'dashboard' },
  { href: '/orders', label: 'অর্ডার', icon: PackageSearch, id: 'orders' },
  { href: '/stock', label: 'স্টক', icon: Layers, id: 'stock' },
  { href: '/cash', label: 'নগদ', icon: Banknote, id: 'cash' },
];

const secondaryItems = [
  { href: '/kanban', label: 'কানবান', icon: Kanban, id: 'kanban' },
  { href: '/customers', label: 'গ্রাহক', icon: Users, id: 'customers' },
  { href: '/reports', label: 'রিপোর্ট', icon: BarChart3, id: 'reports' },
  { href: '/salary', label: 'বেতন', icon: Wallet, id: 'salary' },
  { href: '/activity', label: 'লগ', icon: History, id: 'activity' },
  { href: '/settings', label: 'সেটিংস', icon: Settings, id: 'settings' },
];

export function BottomNav() {
  const { profile } = useAuthStore();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!profile) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#0a0f0a]/90 backdrop-blur-lg border-t border-emerald-900/40 z-40 pb-safe animate-pulse">
        <div className="flex items-center justify-around h-full px-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-10 h-10 bg-emerald-900/30 rounded-lg"></div>
          ))}
        </div>
      </nav>
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

  const visiblePrimary = primaryItems.filter(item => isVisible(item.id));
  const visibleSecondary = secondaryItems.filter(item => isVisible(item.id));

  // Ensure we don't exceed 4 primary icons so 'More' fits in the 5 slots
  const displayPrimary = visiblePrimary.slice(0, 4);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0f0a]/90 backdrop-blur-lg border-t border-emerald-900/40 z-40 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {displayPrimary.map((item) => {
            const isActive = pathname?.startsWith(item.href) || false;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-emerald-400" : "text-emerald-600 hover:text-emerald-500"
                )}
                onClick={() => setMoreOpen(false)}
              >
                <div className={cn("p-1 rounded-full transition-all", isActive && "bg-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]")}>
                  <Icon size={20} className={isActive ? "fill-emerald-900/20" : ""} />
                </div>
                <span className="text-[10px] font-sans font-medium">{item.label}</span>
              </Link>
            );
          })}

          {visibleSecondary.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                moreOpen ? "text-emerald-400" : "text-emerald-600 hover:text-emerald-500"
              )}
            >
              <div className={cn("p-1 rounded-full transition-all", moreOpen && "bg-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]")}>
                <Menu size={20} />
              </div>
              <span className="text-[10px] font-sans font-medium">আরও</span>
            </button>
          )}
        </div>
      </nav>

      {/* More Drawer */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 w-full bg-[#0d1a0e] rounded-t-3xl border-t border-emerald-900/50 z-50 md:hidden pb-safe pt-4 px-4 shadow-[0_-10px_40px_rgba(16,185,129,0.15)] max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-xl font-heading font-bold text-emerald-400">আরও অপশন</h2>
                <button onClick={() => setMoreOpen(false)} className="p-2 bg-emerald-900/40 text-emerald-300 rounded-full hover:bg-emerald-800/60">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {visibleSecondary.map((item) => {
                  const isActive = pathname?.startsWith(item.href) || false;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border border-emerald-900/30 transition-all",
                        isActive 
                          ? "bg-emerald-800/50 text-emerald-300 border-emerald-600/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                          : "bg-[#0a0f0a] text-emerald-500 hover:bg-emerald-900/20"
                      )}
                    >
                      <Icon size={24} className="mb-2" />
                      <span className="text-xs font-sans text-center">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
