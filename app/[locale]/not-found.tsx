"use client";

import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-emerald-50 p-6 rounded-full mb-6">
        <SearchX className="w-16 h-16 text-emerald-500" />
      </div>
      <h2 className="text-4xl font-bold text-slate-800 mb-3">৪0৪</h2>
      <h3 className="text-xl font-semibold text-slate-700 mb-3">পেজটি পাওয়া যায়নি</h3>
      <p className="text-slate-600 max-w-md mb-8">
        আপনি যে পেজটি খুঁজছেন তা মুছে ফেলা হয়েছে, নাম পরিবর্তন করা হয়েছে অথবা সাময়িকভাবে অনুপলব্ধ।
      </p>
      
      <Button 
        onClick={() => router.push('/dashboard')} 
        className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]"
      >
        ড্যাশবোর্ডে ফিরে যান
      </Button>
    </div>
  );
}
