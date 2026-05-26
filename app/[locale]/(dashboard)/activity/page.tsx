import { getCurrentProfile } from "@/lib/actions/auth";
import { redirect } from "@/routing";
import { ActivityClient } from "@/components/activity/ActivityClient";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: 'Activity Logs | Swadhin',
};

export default async function ActivityPage() {
  const profile = await getCurrentProfile();
  const privileges = profile?.privileges || {};
  const isOrderManager = profile?.role === 'manager' && (Array.isArray(privileges) ? privileges.includes('order_manager') : (privileges as any)?.order_manager === true);
  const canAccess = profile?.role === 'admin' || isOrderManager;

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-slate-600 max-w-md">
          You do not have permission to view the activity logs. Please contact an administrator if you believe this is a mistake.
        </p>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-emerald-950 dark:text-emerald-50 mb-2 tracking-tight">
          অ্যাক্টিভিটি লগ
        </h1>
        <p className="text-emerald-700/80 dark:text-emerald-400/80 text-sm md:text-base max-w-2xl">
          {isAdmin 
            ? "Monitor all system activities, track changes, and audit user actions across the platform." 
            : "Review your recent activities and actions on the platform."}
        </p>
      </div>

      <ActivityClient isAdmin={isAdmin} />
    </div>
  );
}
