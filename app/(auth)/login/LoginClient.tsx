'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { signInUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase'

export default function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // PROACTIVE CLEANUP: Clear any existing session or stale data before new login
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.clear()
    sessionStorage.clear()

    const result = await signInUser(email, password)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-white font-sans">
      
      {/* Brand Logo Top Left */}
      <div className="fixed top-12 left-12 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className="text-xl font-black tracking-tighter text-white">StudSync</span>
      </div>

      <div className="w-full max-w-[480px] bg-[#0F172A] rounded-[2.5rem] p-12 shadow-sm border border-slate-800 mt-12 mb-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400 font-medium">Sign in to your weightless workspace.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-8 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.15em] mb-3 ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-6 py-4 rounded-xl bg-[#030712] border border-slate-800 focus:bg-[#030712] focus:border-indigo-500/50 focus:outline-none transition-all text-white font-medium placeholder:text-slate-600"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3 ml-1">
              <label className="block text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.15em]">
                Password
              </label>
              <Link href="#" className="text-[0.65rem] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-6 py-4 rounded-xl bg-[#030712] border border-slate-800 focus:bg-[#030712] focus:border-indigo-500/50 focus:outline-none transition-all text-white font-medium placeholder:text-slate-600"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 mt-4 active:scale-[0.98]"
          >
            {loading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" /> : null}
            Login to StudSync
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-sm font-medium text-slate-400">
            Don&apos;t have an account? <Link href="/register" className="text-indigo-400 font-bold hover:underline">Register</Link>
          </p>
        </div>
      </div>

      {/* Decorative Star Icon Bottom Right */}
      <div className="fixed bottom-24 right-32 opacity-20 transform rotate-12">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center p-4">
           <Sparkles size={32} className="text-indigo-400" />
        </div>
      </div>

      <footer className="text-[0.625rem] font-black text-slate-600 uppercase tracking-[0.2em] mb-12">
        © 2024 StudSync Editorial
      </footer>
    </div>
  )
}
