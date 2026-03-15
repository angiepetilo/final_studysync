'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Lock, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    setError(null)

    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      // Create user profile
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: 'student',
        })
      }
      router.push('/verify-email')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-900 font-sans">
      
      {/* Brand Logo Top Left */}
      <div className="fixed top-12 left-12 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className="text-xl font-black tracking-tighter text-slate-900">StudSync</span>
      </div>

      <div className="w-full max-w-[540px] bg-white rounded-[2.5rem] p-12 shadow-sm border border-slate-100 mt-12 mb-20 animate-fadeIn">
        <div className="mb-10 text-left">
          <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Get Started</p>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6Leading-tight">Create Account</h1>
          <p className="text-slate-500 font-medium">Join the community of students syncing their success.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-8 text-center border border-red-100 italic">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">Full Name</label>
              <div className="relative group">
                <User size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 focus:outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300 shadow-inner focus:shadow-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 focus:outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300 shadow-inner focus:shadow-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 focus:outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300 shadow-inner focus:shadow-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">Confirm Password</label>
                <div className="relative group">
                  <CheckCircle2 size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 focus:outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300 shadow-inner focus:shadow-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 ml-1 mt-6">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs font-semibold text-slate-500 leading-relaxed cursor-pointer select-none">
              I agree to the <Link href="#" className="text-indigo-600 hover:underline">Terms of Service</Link> and <Link href="#" className="text-indigo-600 hover:underline">Privacy Policy</Link>. I understand my data will be synced securely.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 mt-8 active:scale-[0.98] text-lg"
          >
            {loading ? <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3" /> : null}
            Create My Account
          </button>
        </form>

        <div className="mt-12 text-center pt-8 border-t border-slate-50">
          <p className="text-sm font-medium text-slate-500">
            Already have an account? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Login</Link>
          </p>
        </div>
      </div>

      <footer className="text-[0.625rem] font-black text-slate-300 uppercase tracking-[0.2em] mb-12">
        © 2024 STUDSYNC PRODUCTIVITY SUITE
      </footer>
    </div>
  )
}
