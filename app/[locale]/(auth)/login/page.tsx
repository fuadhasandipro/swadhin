"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2, ArrowUpRight, Leaf } from 'lucide-react';
import { useRouter } from '@/routing';
import { loginAction } from '@/lib/actions/auth';

const loginSchema = z.object({
  phone: z.string().regex(/^01[3-9]\d{8}$/, "সঠিক ফোন নম্বর দিন (যেমন: 01XXXXXXXXX)"),
  password: z.string().min(6, "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

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
    <div className="min-h-screen flex w-full bg-[#f8fafc] font-sans">
      {/* Left Panel - Green Side */}
      <div className="hidden md:flex flex-col w-[45%] bg-[#0e6344] relative overflow-hidden items-center justify-center text-white">
        {/* Dot Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-[#147a54] rounded-[2rem] flex items-center justify-center mb-8 border border-[#1b8f64] shadow-2xl">
            <Leaf size={40} className="text-white fill-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading tracking-tight">Swadhin</h1>

          <p className="text-[#a1d8c1] max-w-[280px] text-center text-lg leading-relaxed">
            The next generation of Enterprize management. Stable, fast, and secure.
          </p>
        </div>

        {/* Footer info in green panel */}
        <div className="absolute bottom-16 w-full flex justify-between px-20">
          <div>
            <div className="text-2xl font-bold text-white mb-1">100%</div>
            <div className="text-[#a1d8c1] text-xs font-bold tracking-widest uppercase">RELIABLE</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white mb-1">Cloud</div>
            <div className="text-[#a1d8c1] text-xs font-bold tracking-widest uppercase">ENCRYPTED</div>
          </div>
        </div>
      </div>

      {/* Right Panel - White Side */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-screen p-4">

        {/* Mobile Header (Only visible on small screens) */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#0e6344] rounded-2xl flex items-center justify-center mb-4">
            <Leaf size={28} className="text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#0e6344] font-heading">Swadhin</h1>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[420px] p-8 md:p-10 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 z-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-2 font-heading tracking-tight">লগইন</h2>
          <p className="text-slate-500 mb-8 text-sm">Access your Enterprize dashboard</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-6 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-500 mb-2">ফোন নম্বর</label>
              <div className="relative">
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full bg-[#f1f5f9] border-none rounded-xl py-3.5 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6344]/20 transition-all font-medium text-[15px]"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-500 mb-2">পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full bg-[#f1f5f9] border-none rounded-xl py-3.5 px-4 pr-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6344]/20 transition-all font-medium text-[15px]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0e6344] hover:bg-[#0c5339] text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-lg shadow-[#0e6344]/20"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <span className="flex items-center gap-2">
                  লগইন <ArrowUpRight size={18} className="opacity-80" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer copyright */}
        <div className="absolute bottom-8 text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase text-center w-full">
          © 2026 SWADHIN - POWERING THE Enterprize
        </div>
      </div>
    </div>
  );
}
