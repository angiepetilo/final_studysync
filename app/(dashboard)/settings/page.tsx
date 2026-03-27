'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useData } from '@/context/DataContext'
import { useTheme } from '@/context/ThemeProvider'
import { usePomodoro } from '@/context/PomodoroContext'
import { cn } from '@/lib/utils'
import { 
  Shield, 
  ChevronRight,
  Mail,
  RefreshCw,
  AlertTriangle,
  Check,
  Settings,
  Lock,
  Timer,
  Sun,
  Moon,
  Monitor,
  User,
  MessageSquare
} from 'lucide-react'
import { SettingsSkeleton } from '@/components/shared/LoadingSkeleton'
import PageLayout from '@/components/layout/PageLayout'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'

export default function SettingsPage() {
  const supabase = createClient()
  const { user, profile, loading: contextLoading } = useData()
  const { theme, setTheme: setGlobalTheme } = useTheme()
  const { settings: pomodoroSettings, setSettings: setPomodoroSettings } = usePomodoro()
  
  const [localTheme, setLocalTheme] = useState(theme)
  const [localPomodoro, setLocalPomodoro] = useState(pomodoroSettings)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalTheme(theme)
  }, [theme])

  useEffect(() => {
    setLocalPomodoro(pomodoroSettings)
  }, [pomodoroSettings])

  useEffect(() => {
    const themeChanged = localTheme !== theme
    const pomodoroChanged = JSON.stringify(localPomodoro) !== JSON.stringify(pomodoroSettings)
    setHasChanges(themeChanged || pomodoroChanged)
  }, [localTheme, theme, localPomodoro, pomodoroSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (localTheme !== theme) {
        await setGlobalTheme(localTheme)
      }
      if (JSON.stringify(localPomodoro) !== JSON.stringify(pomodoroSettings)) {
        await setPomodoroSettings(localPomodoro)
      }
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    setLocalTheme(theme)
    setLocalPomodoro(pomodoroSettings)
  }

  if (contextLoading && !profile) {
    return <SettingsSkeleton />
  }

  return (
    <PageLayout>
      <PageHeader 
        title="Settings"
        subtitle="Configure your workspace and personal preferences."
      />

      <div className="max-w-[1600px] mx-auto pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Settings Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* General Preferences */}
            <Card className="p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Settings size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">System Preferences</h2>
                  <p className="text-[0.7rem] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">Global configuration</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-7 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-50 dark:border-slate-800/50 gap-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">Visual Theme</h3>
                    <p className="text-[0.65rem] text-slate-400 dark:text-slate-500 font-bold max-w-xs">Select your preferred interface aesthetic.</p>
                  </div>
                  <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800 gap-1 shadow-sm">
                    {[
                      { id: 'light', icon: Sun, label: 'Light' },
                      { id: 'dark', icon: Moon, label: 'Dark' },
                      { id: 'system', icon: Monitor, label: 'System' }
                    ].map((t) => {
                      const Icon = t.icon
                      const selected = localTheme === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => setLocalTheme(t.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all ${
                            selected 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                              : 'text-slate-400 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon size={14} strokeWidth={selected ? 3 : 2.5} />
                          <span className={selected ? 'block' : 'hidden sm:block'}>{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-7 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-700 shadow-sm border border-slate-100 dark:border-slate-800">
                      <Mail size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Profile Identity</h3>
                      <p className="text-[0.65rem] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tight">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[0.55rem] font-black text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 rounded-full uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified
                  </div>
                </div>
              </div>
            </Card>

            {/* Pomodoro Protocol */}
            <Card className="p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Timer size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Deep Focus Logic</h2>
                  <p className="text-[0.7rem] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">Pomodoro optimization</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[0.6rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-1">Focus Session (Mins)</label>
                  <input 
                    type="number" 
                    value={localPomodoro.focus_duration}
                    onChange={(e) => setLocalPomodoro({...localPomodoro, focus_duration: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 dark:bg-slate-800/30 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[0.6rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-1">Interval Break (Mins)</label>
                  <input 
                    type="number" 
                    value={localPomodoro.short_break}
                    onChange={(e) => setLocalPomodoro({...localPomodoro, short_break: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 dark:bg-slate-800/30 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[0.6rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-1">Cycle Threshold</label>
                  <div className="flex bg-slate-50 dark:bg-slate-800/30 rounded-xl p-1 gap-1 shadow-inner">
                    {[2, 4, 6, 8].map(r => (
                      <button
                        key={r}
                        onClick={() => setLocalPomodoro({...localPomodoro, rounds: r})}
                        className={`flex-1 py-3 px-2 rounded-lg text-[0.65rem] font-black transition-all ${localPomodoro.rounds === r ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-6 flex flex-col justify-end pb-1">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[0.65rem] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">Audio Feedback</span>
                    <button 
                      onClick={() => setLocalPomodoro({...localPomodoro, sound_enabled: !localPomodoro.sound_enabled})}
                      className={`w-11 h-6 rounded-full relative transition-colors ${localPomodoro.sound_enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                    >
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", localPomodoro.sound_enabled ? 'left-6' : 'left-1')} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[0.65rem] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">Auto-initiate Next</span>
                    <button 
                      onClick={() => setLocalPomodoro({...localPomodoro, auto_start: !localPomodoro.auto_start})}
                      className={`w-11 h-6 rounded-full relative transition-colors ${localPomodoro.auto_start ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                    >
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", localPomodoro.auto_start ? 'left-6' : 'left-1')} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                  <Shield size={18} strokeWidth={3} />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Identity & Privacy</h2>
              </div>

              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-700 border border-slate-100 dark:border-slate-800 shadow-sm transition-all group-hover:scale-105">
                      <Lock size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-black text-slate-900 dark:text-white leading-none uppercase tracking-widest">Secret Vault</p>
                      <p className="text-[0.6rem] text-indigo-400 font-black mt-1.5 uppercase tracking-widest italic opacity-60">Hardened</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 transition-colors" />
                </button>

                <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-indigo-50/10 dark:bg-indigo-900/10 hover:bg-indigo-50/20 transition-all border border-indigo-100/30 group">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-all group-hover:scale-105">
                      <RefreshCw size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-black text-slate-900 dark:text-white leading-none uppercase tracking-widest">Auth Sessions</p>
                      <p className="text-[0.6rem] text-indigo-400 font-black mt-1.5 uppercase tracking-widest italic opacity-60">Persistent</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 transition-colors" />
                </button>
              </div>
            </Card>

            <div className="bg-rose-50/30 dark:bg-rose-950/20 rounded-[2.5rem] p-9 border border-rose-100 dark:border-rose-900/30 space-y-7">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <AlertTriangle size={18} strokeWidth={3} />
                <h2 className="text-lg font-black tracking-tight uppercase">System Purge</h2>
              </div>
              <p className="text-[0.65rem] font-black text-rose-600/70 dark:text-rose-400/60 leading-relaxed uppercase tracking-tight italic">
                Account deletion is irreversible. All academic artifacts will be decoupled from the core instance.
              </p>
              <button className="w-full py-4 rounded-xl bg-rose-600 dark:bg-rose-700 text-white text-[0.65rem] font-black uppercase tracking-[0.15em] hover:bg-rose-700 dark:hover:bg-rose-600 shadow-xl shadow-rose-200 dark:shadow-none transition-all active:scale-95">
                Execute Purge
              </button>
            </div>
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
              <p className="text-xs font-black uppercase tracking-widest">Sync Pending</p>
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