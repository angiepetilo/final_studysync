'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  User, 
  Shield, 
  Bell, 
  Trash2, 
  ChevronRight,
  Mail,
  RefreshCw,
  BellRing,
  AlertTriangle,
  Check,
  X
} from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Settings State
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    presence: 'Active',
    emailSummaries: true,
    taskReminders: true,
    collabSync: false
  })
  
  const [initialForm, setInitialForm] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        const initial = {
          full_name: profileData.full_name || '',
          email: user.email || '',
          presence: 'Active',
          emailSummaries: true,
          taskReminders: true,
          collabSync: false
        }
        setProfile(profileData)
        setForm(initial)
        setInitialForm(initial)
      }
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  useEffect(() => {
    if (initialForm) {
      const changed = JSON.stringify(form) !== JSON.stringify(initialForm)
      setHasChanges(changed)
    }
  }, [form, initialForm])

  const handleSave = async () => {
    setSaving(true)
    // In a real app, update Supabase here
    await new Promise(r => setTimeout(r, 1000))
    setInitialForm(form)
    setHasChanges(false)
    setSaving(false)
  }

  const handleDiscard = () => {
    setForm(initialForm)
    setHasChanges(false)
  }

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-[#F8FAFC] p-12 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-32">
      
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <div>
          <span className="text-[0.7rem] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3 block">Account Configuration</span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">System Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Profile & Main Settings */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Profile Section */}
            <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-indigo-500/[0.02]">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Profile Details</h2>
                  <p className="text-sm text-slate-400 font-bold mt-1">Manage how your identity is presented across the StudSync ecosystem.</p>
                </div>
                <button className="px-6 py-2.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-black hover:bg-indigo-100 transition-colors">
                  Edit Profile
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-slate-200 border-4 border-white shadow-xl overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${form.full_name}&background=6366f1&color=fff&size=200`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center text-indigo-600 cursor-pointer hover:scale-110 transition-transform">
                    <User size={18} />
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                    <input 
                      type="text" 
                      value={form.full_name} 
                      onChange={e => setForm({...form, full_name: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                    <input 
                      type="email" 
                      value={form.email} 
                      disabled
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-400 cursor-not-allowed opacity-70"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Presence Status</label>
                    <div className="flex flex-wrap gap-3">
                      {['Active', 'Idle', 'DND'].map(status => (
                        <button 
                          key={status}
                          onClick={() => setForm({...form, presence: status})}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border-2 ${form.presence === status ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100'}`}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${status === 'Active' ? 'bg-emerald-400' : status === 'Idle' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Protocols Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 pl-4">System Protocols</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {[
                  { key: 'emailSummaries', icon: Mail, title: 'Email Summaries', desc: 'Weekly digest of your learning progress and upcoming deadlines.' },
                  { key: 'taskReminders', icon: BellRing, title: 'Task Reminders', desc: 'Push notifications for tasks due within the next 24 hours.' },
                  { key: 'collabSync', icon: RefreshCw, title: 'Collaboration Sync', desc: 'Real-time alerts when team members edit shared documents.' }
                ].map(item => (
                  <div key={item.key} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-lg shadow-indigo-500/[0.01] flex items-start gap-6 group hover:border-indigo-100 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <item.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black text-slate-900">{item.title}</h3>
                        <button 
                          onClick={() => setForm({...form, [item.key]: !form[item.key] as any})}
                          className={`w-12 h-6 rounded-full relative transition-colors ${form[item.key as keyof typeof form] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form[item.key as keyof typeof form] ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                      <p className="text-[0.7rem] text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>

          {/* Right Column: Security & Misc */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Security Section */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-indigo-500/[0.02] space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Shield size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Security</h2>
              </div>

              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100 group">
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900">Change Password</p>
                    <p className="text-[0.65rem] text-slate-400 font-bold mt-1">Last changed 3 months ago</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </button>
                <button className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100 group">
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900">Two-Factor Auth</p>
                    <p className="text-[0.65rem] text-emerald-500 font-bold mt-1">Currently Enabled</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50/30 rounded-[2.5rem] p-10 border border-rose-100 space-y-8">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle size={20} />
                <h2 className="text-xl font-black">Danger Zone</h2>
              </div>
              <p className="text-xs font-bold text-rose-600/70 leading-relaxed">
                Once you delete your account, there is no going back. All your data, notes, and collaborations will be purged.
              </p>
              <button className="w-full py-4 rounded-2xl bg-rose-600 text-white text-sm font-black hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95">
                Delete Student Account
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Confirmation Bar */}
      {hasChanges && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900 text-white rounded-[2rem] p-2 pr-6 shadow-2xl shadow-slate-900/40 flex items-center justify-between border border-slate-800 animate-in slide-in-from-bottom-8 duration-500 z-[100]">
          <div className="flex items-center gap-4 pl-6">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 shadow-inner">
              <RefreshCw size={20} className="animate-spin-slow" />
            </div>
            <p className="text-sm font-bold tracking-tight">You have unsaved configuration changes</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDiscard}
              className="px-6 py-3 rounded-xl text-xs font-black text-slate-400 hover:text-white transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  )
}
