"use client";

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTheme } from 'next-themes';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { NotificationsPanel, NotificationBell } from './NotificationsPanel';
import { logoutAction } from '@/lib/actions/auth';
import { useRouter } from '@/routing';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function Header() {
  const { profile, clearProfile } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');

  const handleLogout = async () => {
    await logoutAction();
    clearProfile();
    router.push('/login');
  };

  // Extract a readable title from pathname
  const segments = pathname.split('/').filter(Boolean);
  const pageName = segments.length > 1 ? segments[1] : 'dashboard';
  const pageTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <>
      <header className="h-16 border-b border-emerald-900/30 bg-white/90 dark:bg-[#0a0f0a]/90 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-heading font-bold text-emerald-900 dark:text-emerald-100 hidden sm:block">
            {pageTitle}
          </h1>
          <h1 className="text-xl font-heading font-bold text-emerald-600 dark:text-emerald-400 sm:hidden">
            Swadhin
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-full transition-colors cursor-pointer"
          >
            <Sun size={20} className="hidden dark:block" />
            <Moon size={20} className="block dark:hidden" />
          </button>

          <NotificationBell onClick={() => setNotificationsOpen(true)} />

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 pl-2 pr-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/50 rounded-full transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                {profile?.full_name?.charAt(0) || <User size={16} />}
              </div>
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100 hidden sm:block">
                {profile?.full_name?.split(' ')[0]}
              </span>
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0d1a0e] border border-emerald-100 dark:border-emerald-900/50 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-emerald-100 dark:border-emerald-900/30">
                    <p className="font-medium text-emerald-900 dark:text-emerald-100 text-sm truncate">{profile?.full_name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500/70 capitalize">{profile?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    {t('logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <NotificationsPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </>
  );
}
