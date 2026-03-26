'use client'

import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-center items-center justify-center p-8 font-sans transition-colors duration-300">
      <div className="max-w-md w-full text-center space-y-8 animate-fadeIn">
        <div className="w-24 h-24 rounded-[2rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
          <WifiOff size={48} />
        </div>
        
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Offline Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
            Connection lost. StudSync academic artifacts are currently static.
          </p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-all shadow-xl shadow-indigo-200 dark:shadow-none active:scale-95 group"
        >
          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          Retry Connection
        </button>
      </div>
    </div>
  )
}
