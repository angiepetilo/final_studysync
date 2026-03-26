'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import NProgress from 'nprogress'
import { createClient } from '@/lib/supabase'
import { useData } from '@/context/DataContext'
import {
  LayoutDashboard,
  CheckCircle2,
  FileText,
  GraduationCap,
  CalendarDays,
  FolderDot,
  Users,
  ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckCircle2 },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/courses', label: 'Courses', icon: GraduationCap },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/files', label: 'Files', icon: FolderDot },
  { href: '/collaborations', label: 'Collaborations', icon: Users },
]

export default function Sidebar({ user }: { user: { id: string; email?: string; full_name?: string } }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { notifications, refreshData } = useData()
  const [showNotifications, setShowNotifications] = useState(false)

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    refreshData()
  }


  const initials = (user.full_name || user.email || 'U').charAt(0).toUpperCase()

  return (
    <aside className="fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col p-4 lg:p-6 transition-all duration-300 hidden md:flex md:w-[80px] lg:w-[260px] z-50">
      
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 px-2 mb-12 group cursor-pointer" onClick={() => router.push('/')}>
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform flex-shrink-0">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="flex flex-col lg:flex hidden">
          <span className="text-xl font-black text-indigo-600 tracking-tighter leading-tight">StudSync</span>
          <span className="text-[0.6rem] font-black text-slate-400 tracking-[0.2em] uppercase">Academic Platform</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 flex flex-col gap-8">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => NProgress.start()}
                className={`flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 font-bold' 
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50 font-semibold dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                  <Icon 
                    size={22} 
                    className={`transition-colors flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} 
                  />
                </div>
                <span className="text-[0.95rem] tracking-tight lg:block hidden truncate">{item.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto opacity-60 lg:block hidden" />}
                
                {/* TOOLTIP FOR TABLET */}
                <div className="absolute left-full ml-4 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity lg:hidden z-50 whitespace-nowrap">
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="mt-auto pt-8 border-t border-slate-50 dark:border-slate-800 lg:block hidden">
        <div className="bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl p-6 border border-indigo-50/50 dark:border-indigo-900/20 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-[0.65rem] font-black text-indigo-600 uppercase tracking-widest mb-1 relative z-10">Sync Status</p>
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-slate-900 dark:text-slate-300">Cloud Connected</p>
          </div>
        </div>
      </div>
      

      
    </aside>
  )
}
