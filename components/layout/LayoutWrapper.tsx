"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { DataProvider, useData } from "@/context/DataContext";
import { PomodoroProvider } from "@/context/PomodoroContext";
import { InstallPrompt } from '../shared/InstallPrompt';

const DynamicSidebar = dynamic(() => import("@/components/layout/Sidebar"), {
  ssr: false,
  loading: () => <div className="w-[280px] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 animate-pulse" />
});

import { Navbar } from './Navbar';
import BottomNav from './BottomNav';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useData();
  const router = useRouter();
  
  // Do not show sidebar on landing, auth, or admin pages
  const isAuthPage = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') || 
    pathname.startsWith('/signup') || 
    pathname.startsWith('/verify-email') || 
    pathname.startsWith('/verification-success') || 
    pathname === '/'
  
  // Client-side route guard: If no user and trying to access dashboard, go to login
  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.push('/login');
    }
    if (!loading && user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, loading, isAuthPage, router]);

  // Decide whether to show sidebar based on auth state and current path
  const showSidebar = user && !isAuthPage;

  if (loading) return null

  if (isAuthPage) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      {showSidebar && <DynamicSidebar user={user!} />}
      {showSidebar && <Navbar />}
      
      <main className={showSidebar ? "flex-1 overflow-x-hidden overflow-y-auto md:ml-[80px] lg:ml-[260px] pb-24 lg:pb-0 mt-20" : "flex-1 overflow-x-hidden overflow-y-auto"}>
        <Suspense fallback={
          <div className="flex-1 min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        }>
          <div className="p-safe px-4 md:px-6 lg:px-8 py-8 md:py-12">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </Suspense>
      </main>
      {showSidebar && <BottomNav />}
      <InstallPrompt />
    </div>
  );
}
