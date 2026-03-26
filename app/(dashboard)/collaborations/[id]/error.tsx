'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Collaboration Room Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-[2rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mb-8 shadow-xl shadow-rose-100 dark:shadow-none">
        <AlertTriangle size={48} strokeWidth={2.5} />
      </div>
      
      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
        Oops! Room Encountered a Problem
      </h2>
      
      <p className="max-w-md text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-12">
        We encountered an error while loading the collaboration room. This might be due to a connection issue or a temporary glitch.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
        >
          <RotateCcw size={18} strokeWidth={3} />
          Try Again
        </button>
        
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
        >
          <Home size={18} strokeWidth={3} />
          Back to Dashboard
        </Link>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-16 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-left max-w-2xl w-full">
          <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-3">Debug Info</p>
          <pre className="text-xs font-mono text-rose-500 overflow-x-auto whitespace-pre-wrap">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        </div>
      )}
    </div>
  )
}
