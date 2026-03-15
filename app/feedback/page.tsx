'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { MessageSquare, Send, CheckCircle2, ArrowLeft, LogIn, Star, Sparkles, User } from 'lucide-react'

export default function FeedbackPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user) return
    setSending(true)
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      message: message.trim(),
    })
    if (!error) {
      setSent(true)
      setMessage('')
    } else {
      alert('Error sending feedback: ' + error.message)
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden -z-10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.05),transparent_40%)]" />

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-indigo-600">StudSync</span>
          </Link>

          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="pt-40 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          
          <div className="text-center mb-16 animate-fadeIn">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[0.7rem] font-black uppercase tracking-[0.1em] mb-6">
              Platform Growth
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
              Shape the future of <span className="text-indigo-600">StudSync</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Your feedback is the catalyst for our progress. Help us build the ultimate workspace for students.
            </p>
          </div>

          {!user ? (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center shadow-xl shadow-indigo-500/5 animate-slideInUp">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-8 mx-auto">
                <Sparkles size={40} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4">Login to get started</h2>
              <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">
                To help us track and respond to your feedback, please sign in to your student account.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-200">
                <LogIn size={20} /> Access Student Portal
              </Link>
            </div>
          ) : sent ? (
            <div className="bg-indigo-600 rounded-[2.5rem] p-16 text-center text-white shadow-2xl shadow-indigo-200 animate-scaleIn">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-10 mx-auto">
                <CheckCircle2 size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-black mb-6">Mission Accomplished!</h2>
              <p className="text-indigo-100 text-lg font-medium mb-12">
                Your feedback has been transmitted successfully to the administrative console. We appreciate your contribution to the system.
              </p>
              <button 
                onClick={() => setSent(false)}
                className="bg-white text-indigo-600 font-bold px-10 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
              >
                Send Another Alert
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 md:p-12 shadow-2xl shadow-indigo-500/5 animate-slideInUp">
              
              <div className="flex items-center gap-4 mb-10 pb-10 border-b border-slate-50">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">
                  {(user.email?.[0] || 'S').toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated Student</p>
                  <p className="text-sm font-bold text-slate-900">{user.email}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-4 ml-1">
                    Your Message
                  </label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Describe a feature request, report a bug, or just say hi..."
                    className="w-full h-48 px-6 py-5 rounded-3xl bg-slate-50 border border-slate-100 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all text-base font-medium resize-none shadow-inner"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  ) : (
                    <>
                      <Send size={22} className="transform rotate-12" />
                      Submit System Feedback
                    </>
                  )}
                </button>
              </div>

              <p className="mt-8 text-center text-slate-400 text-[0.7rem] font-bold uppercase tracking-widest">
                Admin response time: 24-48 hours
              </p>
            </form>
          )}

          {/* Social Proof / Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 text-center animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div>
              <p className="text-3xl font-black text-slate-900 mb-1">100%</p>
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Read Rate</p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 mb-1">2.4k</p>
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Improvements</p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 mb-1">12h</p>
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Avg Response</p>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="py-12 border-t border-slate-50 text-center">
        <p className="text-[0.7rem] font-bold text-slate-300 uppercase tracking-[0.2em]">
          © 2024 StudSync • Transmitting Excellence
        </p>
      </footer>
    </div>
  )
}
