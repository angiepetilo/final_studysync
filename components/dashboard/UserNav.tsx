'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown
} from 'lucide-react'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

interface UserNavProps {
  user: {
    id: string
    email?: string
    full_name?: string
  }
}

export default function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
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
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      
      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Final redirection
      router.push('/?message=signed-out')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const name = user.full_name || user.email || 'Student'
  const initials = name.charAt(0).toUpperCase()

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 p-1.5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-900 hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 dark:shadow-none group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <div className="flex flex-col items-start pr-1 hidden sm:flex text-left">
            <span className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
              {name}
            </span>
            <span className="text-[0.65rem] font-bold text-indigo-500 uppercase tracking-wider">Premium</span>
          </div>
          <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 mr-1 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="px-4 py-4 mb-2">
              <p className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">Account</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
            </div>

            <div className="space-y-1">
              <button 
                onClick={() => { router.push('/settings'); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
                  <Settings size={16} />
                </div>
                <span className="text-sm font-bold">Settings</span>
              </button>

              <button 
                onClick={() => { router.push('/profile'); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
                  <User size={16} />
                </div>
                <span className="text-sm font-bold">Public Profile</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-4" />

              <button 
                onClick={() => { setShowSignOutConfirm(true); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/20 transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-red-500 dark:group-hover:text-rose-400 transition-all">
                  <LogOut size={16} />
                </div>
                <span className="text-sm font-bold">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Are you sure you want to end your current session?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        loading={isSigningOut}
        variant="danger"
      />
    </>
  )
}
