'use client'

import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-white font-sans text-center">
      <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/10">
        <span className="text-4xl font-black text-indigo-400">404</span>
      </div>
      
      <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Destination Lost</h1>
      <p className="text-slate-400 font-medium mb-12 max-w-sm leading-relaxed">
        The page you are looking for has been moved or does not exist in our synced workspace.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 active:scale-[0.98]"
        >
          <Home size={18} />
          Return Home
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="bg-[#0F172A] border border-slate-800 text-slate-300 font-bold px-8 py-4 rounded-2xl hover:bg-slate-900 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>

      <footer className="fixed bottom-12 text-[0.625rem] font-black text-slate-600 uppercase tracking-[0.2em]">
        STUDSYNC NAVIGATION SYSTEM • 404 ERROR
      </footer>
    </div>
  )
}
