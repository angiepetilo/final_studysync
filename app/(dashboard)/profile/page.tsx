'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useData } from '@/context/DataContext'
import { 
  User, 
  Mail, 
  Camera, 
  Check, 
  RefreshCw,
  Sparkles,
  GraduationCap,
  Quote
} from 'lucide-react'
import { ProfileSkeleton } from '@/components/shared/LoadingSkeleton'
import PageLayout from '@/components/layout/PageLayout'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const supabase = createClient()
  const { user, profile, refreshData, loading: contextLoading } = useData()
  
  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    academic_goal: '',
    avatar_url: ''
  })
  
  const [initialForm, setInitialForm] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      const data = {
        full_name: profile.full_name || '',
        bio: (profile as any).bio || '',
        academic_goal: (profile as any).academic_goal || '',
        avatar_url: profile.avatar_url || ''
      }
      setForm(data)
      setInitialForm(data)
    }
  }, [profile])

  useEffect(() => {
    if (initialForm) {
      setHasChanges(JSON.stringify(form) !== JSON.stringify(initialForm))
    }
  }, [form, initialForm])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
      })
      .eq('id', user.id)

    if (!error) {
      setInitialForm(form)
      setHasChanges(false)
      await refreshData()
    }
    setSaving(false)
  }

  const handleDiscard = () => {
    if (initialForm) {
      setForm(initialForm)
      setHasChanges(false)
    }
  }

  if (contextLoading && !profile) {
    return <ProfileSkeleton />
  }

  return (
    <PageLayout>
      <PageHeader 
        title="Profile"
        subtitle="Manage your academic identity and personal profile."
      />

      <div className="max-w-[1600px] mx-auto pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Avatar */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="p-10 flex flex-col items-center text-center border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="relative group mb-8">
                <div className="w-44 h-44 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border-8 border-white dark:border-slate-800 shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                  <img 
                    src={form.avatar_url || `https://ui-avatars.com/api/?name=${form.full_name}&background=6366f1&color=fff&size=200`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-indigo-600 border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <Camera size={20} />
                </button>
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2 tracking-tight">{form.full_name || 'Academic Scholar'}</h2>
              <div className="flex items-center justify-center gap-2 text-indigo-500 dark:text-indigo-400 font-black text-[0.6rem] uppercase tracking-widest mb-8">
                <Sparkles size={14} strokeWidth={3} />
                <span>Premium Access</span>
              </div>

              <div className="w-full pt-8 border-t border-slate-50 dark:border-slate-800/50 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Account Status</span>
                  <span className="text-[0.6rem] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg uppercase tracking-widest">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[0.6rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Enrollment</span>
                  <span className="text-[0.65rem] font-black text-slate-900 dark:text-white uppercase tracking-tight">Sept 2025</span>
                </div>
              </div>
            </Card>

            <div className="bg-indigo-600 dark:bg-indigo-700 rounded-[2.5rem] p-9 text-white relative overflow-hidden group shadow-xl shadow-indigo-500/20 dark:shadow-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <GraduationCap size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black leading-tight mb-2 tracking-tight">Academic Velocity <span className="text-indigo-200">92%</span></h3>
                  <p className="text-[0.7rem] font-bold text-white/70 leading-relaxed uppercase tracking-tight">Your learning consistency remains optimal this semester.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="p-12 border border-slate-100 dark:border-slate-800 shadow-sm space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[0.6rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-1 flex items-center gap-2">
                    <User size={12} strokeWidth={3} className="text-indigo-400" />
                    Display Name
                  </label>
                  <input 
                    type="text" 
                    value={form.full_name}
                    onChange={(e) => setForm({...form, full_name: e.target.value})}
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 dark:bg-slate-800/30 border-none rounded-2xl px-8 py-5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-4 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-4 opacity-70">
                  <label className="text-[0.6rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-1 flex items-center gap-2">
                    <Mail size={12} strokeWidth={3} className="text-indigo-400" />
                    Authentic Email
                  </label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-8 py-5 text-sm font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[0.6rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Quote size={12} strokeWidth={3} className="text-indigo-400" />
                  Motto / Description
                </label>
                <textarea 
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({...form, bio: e.target.value})}
                  placeholder="Share your academic mission..."
                  className="w-full bg-slate-50 dark:bg-slate-800/30 border-none rounded-[1.5rem] px-8 py-5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none shadow-inner"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[0.6rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Sparkles size={12} strokeWidth={3} className="text-indigo-400" />
                  Primary Learning Objective
                </label>
                <input 
                  type="text" 
                  value={form.academic_goal}
                  onChange={(e) => setForm({...form, academic_goal: e.target.value})}
                  placeholder="e.g. Master Neural Architecture"
                  className="w-full bg-slate-50 dark:bg-slate-800/30 border-none rounded-2xl px-8 py-5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Sync Control */}
      {hasChanges && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-xl bg-slate-900 dark:bg-indigo-950 text-white rounded-[2rem] p-2 pr-6 shadow-2xl shadow-indigo-900/40 flex items-center justify-between border border-white/5 dark:border-indigo-800 animate-in slide-in-from-bottom-8 duration-500 z-[100] backdrop-blur-xl">
          <div className="flex items-center gap-4 pl-6">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400">
              <RefreshCw size={18} strokeWidth={3} className="animate-spin-slow" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Identity Sync</p>
              <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-tighter">Modified session attributes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDiscard}
              className="px-5 py-3 rounded-lg text-[0.65rem] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[0.65rem] font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2 uppercase tracking-[0.15em]"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} strokeWidth={3} />}
              {saving ? 'Syncing' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </PageLayout>
  )
}
