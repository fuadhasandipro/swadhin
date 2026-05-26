"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <AlertTriangle className="w-16 h-16 text-red-500" />
      </div>
      <h2 className="text-3xl font-bold text-slate-800 mb-3">দুঃখিত, একটি ত্রুটি ঘটেছে!</h2>
      <p className="text-slate-600 max-w-md mb-8">
        {error.message || "Something went wrong while processing your request. Please try again or contact support if the issue persists."}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => reset()} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
        >
          পুনরায় চেষ্টা করুন
        </Button>
        <Button 
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="min-w-[120px]"
        >
          ড্যাশবোর্ডে ফিরে যান
        </Button>
      </div>
    </div>
  );
}
