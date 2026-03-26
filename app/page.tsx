'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, Users, LayoutGrid, ArrowRight, Zap, Globe, Shield, Send, Mail, MessageSquare, Info, Star, Sparkles } from 'lucide-react'

import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

function LandingPageContent() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      // Check locally first
      const localAdmin = localStorage.getItem('admin_session')
      if (localAdmin) {
        setIsAdmin(true)
      }

      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)
      }
      setLoading(false)
    }
    
    checkSession()
  }, [supabase])

  useEffect(() => {
    if (searchParams.get('message') === 'signed-out') {
      setShowToast(true)
      const timer = setTimeout(() => {
        setShowToast(false)
        // Clean up the URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const [feedback, setFeedback] = useState({
    name: '',
    email: '',
    type: 'Suggestion',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id || null,
      message: `[${feedback.type}] From ${feedback.name} (${feedback.email}): ${feedback.message}`,
    })

    if (!error) {
      setSubmitted(true)
      setFeedback({ name: '', email: '', type: 'Suggestion', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } else {
      alert('Error sending feedback: ' + error.message)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="w-4 h-4 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-indigo-100 overflow-x-hidden">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 duration-500">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 backdrop-blur-xl">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <CheckCircle2 size={14} strokeWidth={3} />
            </div>
            <span className="text-sm font-black tracking-tight">Signed out successfully</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-indigo-600">StudSync</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-400">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#about" className="hover:text-indigo-600 transition-colors">About</Link>
            <Link href="#feedback" className="hover:text-indigo-600 transition-colors">Feedback</Link>
          </div>

          <div className="flex items-center gap-6">
            {isAdmin ? (
              <Link href="/admin/dashboard" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">
                Admin Dashboard
              </Link>
            ) : user ? (
              <Link href="/dashboard" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors hidden sm:block">
                Log In
              </Link>
            )}
            <button 
              onClick={() => {
                setIsNavigating(true);
                router.push('/register');
              }}
              disabled={isNavigating}
              className="px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[0.65rem] font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2 uppercase tracking-[0.15em] disabled:opacity-70"
            >
              {isNavigating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {user || isAdmin ? 'Enter Workspace' : 'Get Started'}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20">

        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            <div className="flex-1 text-center lg:text-left animate-fadeIn">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[0.7rem] font-black uppercase tracking-[0.1em] mb-8">
                The Weightless Workspace
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.05] mb-8">
                All-in-one <br />
                <span className="text-white">collaborative study platform</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                StudSync helps students reduce cognitive load through a centralized, intuitive, and collaborative workspace.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => {
                    setIsNavigating(true);
                    router.push('/register');
                  }}
                  disabled={isNavigating}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold px-10 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-200 hover:translate-y-[-2px] disabled:opacity-70 flex items-center justify-center gap-3"
                >
                  {isNavigating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  Start Studying Free
                </button>
              </div>
            </div>

            <div className="flex-1 relative animate-slideInRight">
              <div className="relative z-10 rounded-[2.5rem] bg-indigo-500/10 p-4 border border-slate-800 shadow-2xl">
                <div className="relative rounded-[2rem] overflow-hidden bg-[#0F172A] shadow-inner">
                  <Image
                    src="/landing-mockup.png"
                    alt="StudSync App Interface"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-700"
                    priority
                  />
                </div>
              </div>
              {/* Decorative Blur */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-300/20 blur-[100px] rounded-full -z-10" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-200/30 blur-[80px] rounded-full -z-10" />
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="bg-slate-900/40 py-20 border-y border-slate-900">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.2em] mb-12">
              Trusted by students at leading institutions
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale transition-all hover:grayscale-0">
              {['Stanford', 'MIT', 'Harvard', 'Oxford'].map(univ => (
                <span key={univ} className="text-2xl md:text-3xl font-black text-slate-200 tracking-tighter">
                  {univ}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Header */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Study Smarter, Together</h2>
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
            Everything you need to succeed in your academic journey, simplified into one elegant interface.
          </p>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Card 1: Centralized */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-[2.5rem] p-12 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-10">
                <LayoutGrid size={28} className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Centralized</h3>
              <p className="text-slate-400 font-medium leading-relaxed text-base">
                All your notes, schedules, and resources in one secure cloud location. No more switching between apps or losing track of your materials.
              </p>
            </div>

            {/* Card 2: Collaborative (Premium Accent) */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-12 shadow-2xl shadow-indigo-200 hover:translate-y-[-4px] transition-all duration-300 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-125 transition-transform" />
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-10">
                <Users size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-black mb-4">Collaborative</h3>
              <p className="text-indigo-100 font-medium leading-relaxed text-base">
                Work seamlessly with classmates in real-time on shared projects and study sets. Sync is instant across all devices.
              </p>
            </div>

            {/* Card 3: Intuitive (Large Bottom Card) */}
            <div className="md:col-span-2 bg-[#0F172A] border border-slate-800 rounded-[2.5rem] p-12 flex flex-col md:flex-row items-center gap-12 group hover:bg-[#111c34] transition-colors">
              <div className="flex-1">
                <div className="w-14 h-14 rounded-2xl bg-[#030712] flex items-center justify-center mb-10 shadow-sm">
                  <Globe size={28} className="text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4">Intuitive</h3>
                <p className="text-slate-400 font-medium leading-relaxed text-base">
                  A minimalist design focused on reducing distraction and cognitive overhead. Designed for deep work and academic flow states.
                </p>
              </div>
              <div className="flex-1 w-full max-w-sm">
                <div className="bg-[#030712] p-6 rounded-2xl shadow-sm border border-slate-800">
                  <div className="h-4 w-3/4 bg-slate-800 rounded-full mb-4" />
                  <div className="h-4 w-1/2 bg-slate-800 rounded-full mb-8" />
                  <div className="space-y-3">
                    <div className="h-10 w-full bg-indigo-500/10 rounded-xl" />
                    <div className="h-10 w-full bg-slate-800 rounded-xl" />
                    <div className="h-10 w-full bg-slate-800 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-[#030712] py-32 border-y border-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[0.7rem] font-black uppercase tracking-[0.1em]">
                  The Mission
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  Born from the chaos of <br />
                  <span className="text-indigo-400">modern academia</span>
                </h2>
                <div className="space-y-6 text-slate-400 font-medium text-lg leading-relaxed">
                  <p>
                    StudSync was founded on a simple realization: students are overwhelmed. Between fragmented notes, scattered schedules, and disconnected communication, the &quot;cognitive load&quot; of managing studies often outweighs the studying itself.
                  </p>
                  <p>
                    Our vision is to build the first truly integrated &quot;Academic Command Center&quot; &mdash; a weightless workspace where focus is the default state, and collaboration happens at the speed of thought.
                  </p>
                </div>
                <div className="flex items-center gap-6 pt-4">
                   <div className="flex -space-x-4">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="w-12 h-12 rounded-full border-4 border-[#030712] bg-slate-800 overflow-hidden shadow-sm">
                         <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-indigo-500/40" />
                       </div>
                     ))}
                   </div>
                   <div>
                     <p className="text-sm font-black text-white">Developed by Educators</p>
                     <p className="text-xs font-bold text-slate-500">Supporting 10,000+ Students</p>
                   </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-6 w-full">
                <div className="bg-[#0F172A] p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/[0.03] border border-slate-800 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Info size={24} />
                  </div>
                  <h4 className="font-black text-white">Transparency</h4>
                  <p className="text-sm font-medium text-slate-500">Open product roadmaps and clear privacy policies.</p>
                </div>
                <div className="bg-[#0F172A] p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/[0.03] border border-slate-800 space-y-4 translate-y-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Shield size={24} />
                  </div>
                  <h4 className="font-black text-white">Privacy</h4>
                  <p className="text-sm font-medium text-slate-500">Your data belongs to you. Zero tracking or ads.</p>
                </div>
                <div className="bg-[#0F172A] p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/[0.03] border border-slate-800 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Users size={24} />
                  </div>
                  <h4 className="font-black text-white">Students First</h4>
                  <p className="text-sm font-medium text-slate-500">Every feature is co-designed with actual scholars.</p>
                </div>
                <div className="bg-[#0F172A] p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/[0.03] border border-slate-800 space-y-4 translate-y-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Zap size={24} />
                  </div>
                  <h4 className="font-black text-white">Performance</h4>
                  <p className="text-sm font-medium text-slate-500">Built for speed on a lightweight architecture.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-[#030712] py-32">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-slate-900 rounded-[3rem] p-16 md:p-24 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8 relative z-10 tracking-tight leading-tight">
                Ready to sync your studies?
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 relative z-10 max-w-xl mx-auto">
                Join thousands of students simplifying their academic life.
              </p>
              <button 
                onClick={() => {
                  setIsNavigating(true);
                  router.push('/register');
                }}
                disabled={isNavigating}
                className="inline-flex items-center gap-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold px-12 py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 active:scale-95 relative z-10 disabled:opacity-70"
              >
                {isNavigating ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Create Free Account
              </button>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section id="feedback" className="bg-[#030712] py-32">
          <div className="max-w-4xl mx-auto px-6">
             <div className="text-center mb-16">
               <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[0.7rem] font-black uppercase tracking-[0.1em] mb-6">
                 Growth Engine
               </div>
               <h2 className="text-4xl font-black text-white mb-6">Help us evolve</h2>
               <p className="text-lg text-slate-400 font-medium">Have a suggestion or found a glitch? Let us know.</p>
             </div>

             <div className="bg-[#0F172A] border border-slate-800 rounded-[3.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl shadow-indigo-500/[0.03]">
               {submitted ? (
                 <div className="text-center py-10 animate-scaleIn">
                   <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-8 shadow-lg shadow-emerald-500/10">
                     <CheckCircle2 size={48} />
                   </div>
                   <h3 className="text-3xl font-black text-white mb-4">Transmission Successful!</h3>
                   <p className="text-slate-400 font-medium mb-12 max-w-xs mx-auto">Your feedback has been logged in our system. Thank you for contributing to StudSync.</p>
                   <button 
                     onClick={() => setSubmitted(false)}
                     className="bg-[#030712] border border-slate-800 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-900 transition-all"
                   >
                     Send Another Message
                   </button>
                 </div>
               ) : (
                 <form onSubmit={handleFeedbackSubmit} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                        <input 
                          type="text"
                          required
                          value={feedback.name}
                          onChange={(e) => setFeedback({...feedback, name: e.target.value})}
                          placeholder="Your Name"
                          className="w-full bg-[#030712] border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                        <input 
                          type="email"
                          required
                          value={feedback.email}
                          onChange={(e) => setFeedback({...feedback, email: e.target.value})}
                          placeholder="student@university.edu"
                          className="w-full bg-[#030712] border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                        />
                      </div>
                   </div>

                   <div className="space-y-3">
                    <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest pl-1">Feedback Type</label>
                    <div className="flex flex-wrap gap-4">
                      {['Bug Report', 'Suggestion', 'General Feedback'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFeedback({...feedback, type})}
                          className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${
                            feedback.type === type 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                            : 'bg-[#030712] text-slate-500 border border-slate-800 hover:border-indigo-500/30'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                   </div>

                   <div className="space-y-3">
                    <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest pl-1">Message</label>
                    <textarea 
                      required
                      value={feedback.message}
                      onChange={(e) => setFeedback({...feedback, message: e.target.value})}
                      placeholder="Tell us what's on your mind..."
                      className="w-full h-40 bg-[#030712] border border-slate-800 rounded-3xl px-8 py-6 text-sm font-bold text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm resize-none"
                    />
                   </div>

                   <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-6 rounded-2xl shadow-xl shadow-indigo-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                   >
                    {submitting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={20} strokeWidth={3} />
                        <span>Submit Feedback</span>
                      </>
                    )}
                   </button>
                 </form>
               )}
             </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xl font-black text-indigo-400 tracking-tighter">StudSync</span>
              </div>
              <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xs mb-8">
                Reducing cognitive load for students everywhere. Built for the modern academic journey.
              </p>
            </div>

            <div>
              <h4 className="font-black text-white mb-8 text-xs uppercase tracking-widest">Product</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><Link href="#features" className="hover:text-indigo-600">Features</Link></li>
                <li><Link href="#feedback" className="hover:text-indigo-600">Feedback</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-8 text-xs uppercase tracking-widest">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><Link href="#about" className="hover:text-indigo-600">About</Link></li>
                <li><Link href="#feedback" className="hover:text-indigo-600">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-8 text-xs uppercase tracking-widest">Support</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><Link href="#" className="hover:text-indigo-600">Help Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-8 text-xs uppercase tracking-widest">Legal</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><Link href="#" className="hover:text-indigo-600">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[0.7rem] font-bold text-slate-600">&copy; 2024 StudSync. All rights reserved.</p>
            <div className="flex gap-6">
              <Globe size={18} className="text-slate-400 cursor-pointer hover:text-indigo-600" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="w-4 h-4 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  )
}
