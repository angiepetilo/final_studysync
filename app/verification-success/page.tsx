'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Rocket, Sparkles, ArrowRight } from 'lucide-react'

export default function VerificationSuccessPage() {
  const router = useRouter()
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    setShowCelebration(true)
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* Brand Logo Top Left */}
      <div className="fixed top-12 left-12 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className="text-xl font-black tracking-tighter text-slate-900">StudSync</span>
      </div>

      <div className="w-full max-w-[540px] bg-white rounded-[3rem] p-12 shadow-2xl shadow-indigo-500/[0.03] border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-700">
        
        {/* Animated Background Element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 transition-transform duration-1000 scale-150" />
        
        {/* Success Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100/50">
            <CheckCircle2 size={48} className="text-emerald-500 animate-in zoom-in spin-in-90 duration-500 delay-200" />
          </div>
          {showCelebration && (
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-32 h-32 border-2 border-emerald-500/20 rounded-full animate-ping" />
            </div>
          )}
        </div>

        <div className="relative z-10">
          <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Account Activated</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-6 font-sans">Verification Complete!</h1>
          
          <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10 max-w-sm mx-auto">
            Your identity has been confirmed. You&apos;re now ready to sync your academic success with your team.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98] text-lg group"
            >
              Enter Dashboard
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pt-2">
              Launch into your dynamic workspace
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-1.5">
           <Sparkles size={14} className="text-indigo-400" />
           <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Welcome to the future of study</span>
           <Sparkles size={14} className="text-indigo-400" />
        </div>
      </div>

      <footer className="fixed bottom-12 text-[0.625rem] font-black text-slate-300 uppercase tracking-[0.2em]">
        STUDSYNC PRODUCTIVITY SUITE • GLOBAL VERIFICATION SYSTEM
      </footer>
    </div>
  )
}
