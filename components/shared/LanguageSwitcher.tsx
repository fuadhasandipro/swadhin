"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/routing';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage}
      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 font-sans px-3"
    >
      {locale === 'bn' ? 'EN' : 'বাং'}
    </Button>
  );
}
