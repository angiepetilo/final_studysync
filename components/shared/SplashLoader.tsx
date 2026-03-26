'use client'

import { GraduationCap } from 'lucide-react'

export function SplashLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-all duration-500">
      <div className="relative mb-12 animate-in fade-in zoom-in duration-700">
        {/* Main Logo Icon */}
        <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none relative z-10 animate-bounce group">
          <GraduationCap size={48} className="text-white" />
        </div>
        
        {/* Decorative Rings */}
        <div className="absolute inset-0 w-24 h-24 rounded-[2rem] bg-indigo-400 opacity-20 animate-ping" />
        <div className="absolute inset-0 w-24 h-24 rounded-[2rem] bg-indigo-500 opacity-10 animate-pulse [animation-delay:0.5s]" />
      </div>

      <div className="text-center space-y-4 max-w-sm w-full">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter animate-in slide-in-from-bottom-4 duration-700 [animation-delay:200ms]">
          StudSync
        </h1>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] animate-in slide-in-from-bottom-4 duration-700 [animation-delay:400ms]">
          Syncing your success
        </p>

        {/* Progress Bar Container */}
        <div className="mt-8 h-1.5 w-48 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto overflow-hidden animate-in fade-in duration-1000 [animation-delay:600ms]">
          <div className="h-full bg-indigo-600 rounded-full animate-[progress-flow_2s_infinite_ease-in-out]" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress-flow {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  )
}
