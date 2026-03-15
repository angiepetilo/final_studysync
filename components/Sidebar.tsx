'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import {
  LayoutDashboard,
  CheckCircle2,
  FileText,
  GraduationCap,
  CalendarDays,
  FolderDot,
  Users,
  Settings,
  PlusCircle,
  LogOut,
  Rocket,
  Bell,
  X,
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
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        setNotifications(data || [])
      } catch { /* fail silently */ }
    }

    fetchNotifications()

    const notifChannel = supabase
      .channel('sidebar-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(notifChannel)
    }
  }, [user.id, supabase])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (user.full_name || user.email || 'U').charAt(0).toUpperCase()

  return (
    <aside className="w-[280px] min-h-screen bg-white text-slate-600 flex flex-col fixed left-0 top-0 bottom-0 z-40 p-6 overflow-y-auto border-r border-slate-100 shadow-sm font-sans">
      
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 px-2 mb-12 group cursor-pointer" onClick={() => router.push('/')}>
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[1.35rem] font-black text-indigo-600 tracking-tighter leading-tight">StudSync</span>
          <span className="text-[0.6rem] font-black text-slate-400 tracking-[0.2em] uppercase">Academic Platform</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 flex flex-col gap-8">
        
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold' 
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50 font-semibold'
                }`}
              >
                <Icon 
                  size={20} 
                  className={`transition-colors flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} 
                />
                <span className="text-[0.95rem] tracking-tight">{item.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

      </div>

      {/* Footer Branding */}
      <div className="mt-auto pt-8 border-t border-slate-50">
        <div className="bg-indigo-50/30 rounded-3xl p-6 border border-indigo-50/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <p className="text-[0.65rem] font-black text-indigo-600 uppercase tracking-widest mb-1 relative z-10">Sync Status</p>
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-slate-900">Cloud Connected</p>
          </div>
        </div>
      </div>
      
    </aside>
  )
}
