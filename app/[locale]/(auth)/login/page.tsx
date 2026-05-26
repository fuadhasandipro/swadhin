"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from '@/routing';
import { loginAction } from '@/lib/actions/auth';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/routing';

const loginSchema = z.object({
  phone: z.string().regex(/^01[3-9]\d{8}$/, "সঠিক ফোন নম্বর দিন (যেমন: 01XXXXXXXXX)"),
  password: z.string().min(6, "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    const result = await loginAction(data.phone, data.password);
    
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col items-center justify-center relative overflow-hidden dark">
      {/* Radial green glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Link 
          href={pathname} 
          locale="bn" 
          className={`px-3 py-1 rounded text-sm transition-colors ${locale === 'bn' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-900/50'}`}
        >
          বাং
        </Link>
        <Link 
          href={pathname} 
          locale="en" 
          className={`px-3 py-1 rounded text-sm transition-colors ${locale === 'en' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-900/50'}`}
        >
          EN
        </Link>
      </div>

      {/* Glassmorphism Card */}
      <div className="z-10 w-full max-w-md p-8 rounded-2xl bg-[#0a0f0a]/60 backdrop-blur-xl border border-emerald-900/50 shadow-[0_8px_32px_rgba(16,185,129,0.1)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-emerald-400 mb-2">Swadhin Enterprise</h1>
          <p className="text-emerald-500/80 font-sans">লগইন করুন</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-emerald-100 mb-2">ফোন নম্বর</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-emerald-500 font-medium">+88</span>
              <input
                type="tel"
                {...register('phone')}
                className="w-full bg-[#0d1a0e] border border-emerald-900/50 rounded-lg py-3 pl-12 pr-4 text-white placeholder-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="01XXXXXXXXX"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-100 mb-2">পাসওয়ার্ড</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full bg-[#0d1a0e] border border-emerald-900/50 rounded-lg py-3 px-4 text-white placeholder-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : "লগইন"}
          </button>
        </form>
      </div>
    </div>
  );
}
