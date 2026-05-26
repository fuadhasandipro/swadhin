import { redirect } from 'next/navigation';
import { getSession, getCurrentProfile } from '@/lib/actions/auth';
import Preloader from '@/components/layout/Preloader';
import DashboardClientWrapper from './DashboardClientWrapper';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  // If not authenticated, redirect to login
  if (!session) {
    redirect('/login');
  }

  const profile = await getCurrentProfile();

  return (
    <>
      <Preloader />
      <DashboardClientWrapper profile={profile}>
        <div className="flex h-screen overflow-hidden bg-emerald-50/30 dark:bg-[#0a0f0a] transition-colors duration-200">
          <Sidebar />
          
          <div className="flex flex-col flex-1 overflow-hidden relative">
            <Header />
            
            <main className="flex-1 overflow-y-auto p-4 relative z-0 pb-20 md:pb-4 no-scrollbar">
              {children}
            </main>
            
            <BottomNav />
          </div>
        </div>
      </DashboardClientWrapper>
    </>
  );
}
