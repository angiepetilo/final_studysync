'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Sparkles
} from 'lucide-react'

interface UserNavProps {
  user: {
    id: string
    email?: string
    full_name?: string
  }
}

export default function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (user.full_name || user.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all active:scale-95 group"
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
          {initials}
        </div>
        <div className="flex flex-col items-start pr-1 hidden sm:flex">
          <span className="text-xs font-black text-slate-900 leading-tight truncate max-w-[120px]">
            {user.full_name || 'Student'}
          </span>
          <span className="text-[0.65rem] font-bold text-indigo-500 uppercase tracking-wider">Premium</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 mr-1 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-4 py-4 mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Account</p>
            <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
          </div>

          <div className="space-y-1">
            <button 
              onClick={() => { router.push('/settings'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-all">
                <Settings size={16} />
              </div>
              <span className="text-sm font-bold">Settings</span>
            </button>

            <button 
              onClick={() => { router.push('/dashboard'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-all">
                <User size={16} />
              </div>
              <span className="text-sm font-bold">Public Profile</span>
            </button>

            <div className="h-px bg-slate-100 my-2 mx-4" />

            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:text-red-500 hover:bg-red-50 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-red-500 transition-all">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-bold">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
