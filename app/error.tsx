'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-white font-sans text-center">
      <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 flex items-center justify-center mb-8 shadow-lg shadow-red-500/10">
        <AlertCircle size={48} className="text-red-500" />
      </div>
      
      <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">System Fault</h1>
      <p className="text-slate-400 font-medium mb-12 max-w-sm leading-relaxed">
        We encountered an error while syncing your data. Our engineers have been notified.
      </p>

      <button 
        onClick={() => reset()}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3 active:scale-[0.98]"
      >
        <RefreshCcw size={18} />
        Recover Session
      </button>

      <footer className="fixed bottom-12 text-[0.625rem] font-black text-slate-600 uppercase tracking-[0.2em]">
        STUDSYNC RECOVERY SYSTEM • CRITICAL ERROR
      </footer>
    </div>
  )
}
