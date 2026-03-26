'use client'

import { Mail, ArrowLeft, RefreshCcw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { signOutUser } from '@/lib/actions/auth'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: any }) => {
      if (data.user) {
        setEmail(data.user.email || null)
        if (data.user.email_confirmed_at) {
          router.push('/dashboard')
        }
      } else {
        router.push('/login')
      }
    })
  }, [router, supabase.auth])

  const handleSignOut = async () => {
    await signOutUser()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-[480px] bg-[#0F172A] rounded-[2.5rem] p-12 shadow-sm border border-slate-800 text-center">
        <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <Mail size={40} className="stroke-[1.5]" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-4">Verify your email</h1>
        <p className="text-slate-400 font-medium mb-8 leading-relaxed">
          We&apos;ve sent a verification link to <span className="text-white font-bold">{email || 'your email address'}</span>. 
          Please check your inbox and click the link to continue.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <RefreshCcw size={18} />
            I&apos;ve verified my email
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-slate-500 hover:text-slate-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Didn&apos;t receive any email?</p>
          <button className="text-indigo-400 font-bold text-sm hover:underline">
            Resend Verification Link
          </button>
        </div>
      </div>

      <footer className="mt-12 text-[0.625rem] font-black text-slate-600 uppercase tracking-[0.2em]">
        © 2024 StudSync Editorial
      </footer>
    </div>
  )
}
