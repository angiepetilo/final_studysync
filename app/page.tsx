'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Users, LayoutGrid, ArrowRight, Zap, Globe, Shield } from 'lucide-react'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function LandingPage() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check locally first
    const localAdmin = localStorage.getItem('admin_session')
    if (localAdmin) {
      setIsAdmin(true)
      return
    }

    supabase.auth.getUser().then(({ data }: { data: any }) => {
      if (data?.user) {
        setUser(data.user)
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 overflow-x-hidden">

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-indigo-600">StudSync</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-500">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#solutions" className="hover:text-indigo-600 transition-colors">Why StudSync</Link>
            <Link href="/feedback" className="hover:text-indigo-600 transition-colors">Feedback</Link>
            <Link href="#about" className="hover:text-indigo-600 transition-colors">About</Link>
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
              <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">
                Log In
              </Link>
            )}
            <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:translate-y-[-1px] active:translate-y-[1px]">
              {user || isAdmin ? 'Enter Workspace' : 'Get Started'}
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">

        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            <div className="flex-1 text-center lg:text-left animate-fadeIn">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[0.7rem] font-black uppercase tracking-[0.1em] mb-8">
                The Weightless Workspace
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.05] mb-8">
                All-in-one <br />
                <span className="text-slate-900">collaborative study platform</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                StudSync helps students reduce cognitive load through a centralized, intuitive, and collaborative workspace.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/register" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold px-10 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-200 hover:translate-y-[-2px]">
                  Start Studying Free
                </Link>
              </div>
            </div>

            <div className="flex-1 relative animate-slideInRight">
              <div className="relative z-10 rounded-[2.5rem] bg-indigo-500/5 p-4 border border-indigo-100 shadow-2xl">
                <div className="relative rounded-[2rem] overflow-hidden bg-white shadow-inner">
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
        <section className="bg-slate-50/50 py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.2em] mb-12">
              Trusted by students at leading institutions
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale transition-all hover:grayscale-0">
              {['Stanford', 'MIT', 'Harvard', 'Oxford'].map(univ => (
                <span key={univ} className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter">
                  {univ}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Header */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Study Smarter, Together</h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Everything you need to succeed in your academic journey, simplified into one elegant interface.
          </p>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Card 1: Centralized */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-10">
                <LayoutGrid size={28} className="text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">Centralized</h3>
              <p className="text-slate-500 font-medium leading-relaxed text-base">
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
            <div className="md:col-span-2 bg-slate-50 border border-slate-100 rounded-[2.5rem] p-12 flex flex-col md:flex-row items-center gap-12 group hover:bg-slate-100/50 transition-colors">
              <div className="flex-1">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-10 shadow-sm">
                  <Globe size={28} className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Intuitive</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-base">
                  A minimalist design focused on reducing distraction and cognitive overhead. Designed for deep work and academic flow states.
                </p>
              </div>
              <div className="flex-1 w-full max-w-sm">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="h-4 w-3/4 bg-slate-100 rounded-full mb-4" />
                  <div className="h-4 w-1/2 bg-slate-100 rounded-full mb-8" />
                  <div className="space-y-3">
                    <div className="h-10 w-full bg-indigo-50 rounded-xl" />
                    <div className="h-10 w-full bg-slate-50 rounded-xl" />
                    <div className="h-10 w-full bg-slate-50 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-white py-32">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-slate-900 rounded-[3rem] p-16 md:p-24 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8 relative z-10 tracking-tight leading-tight">
                Ready to sync your studies?
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 relative z-10 max-w-xl mx-auto">
                Join thousands of students simplifying their academic life.
              </p>
              <Link href="/register" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold px-12 py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 active:scale-95 relative z-10">
                Create Free Account
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xl font-black text-indigo-600 tracking-tighter">StudSync</span>
              </div>
              <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xs mb-8">
                Reducing cognitive load for students everywhere. Built for the modern academic journey.
              </p>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 text-xs uppercase tracking-widest">Product</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><Link href="#" className="hover:text-indigo-600">Features</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 text-xs uppercase tracking-widest">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><Link href="#" className="hover:text-indigo-600">About</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 text-xs uppercase tracking-widest">Support</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><Link href="#" className="hover:text-indigo-600">Help Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 mb-8 text-xs uppercase tracking-widest">Legal</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><Link href="#" className="hover:text-indigo-600">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[0.7rem] font-bold text-slate-400">© 2024 StudSync. All rights reserved.</p>
            <div className="flex gap-6">
              <Globe size={18} className="text-slate-400 cursor-pointer hover:text-indigo-600" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
