import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-white dark:bg-emerald-950 p-4 rounded-full border border-emerald-100 dark:border-emerald-900 shadow-xl shadow-emerald-900/5">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-heading font-medium text-emerald-900 dark:text-emerald-100">
        অপেক্ষা করুন...
      </h3>
      <p className="text-emerald-600/70 dark:text-emerald-400/70 text-sm mt-2 animate-pulse">
        ডেটা লোড হচ্ছে
      </p>
    </div>
  );
}
