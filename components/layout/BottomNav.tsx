'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  Calendar,
  Settings,
  MoreHorizontal
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: BookOpen, label: 'Notes', href: '/notes' },
  { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
  { icon: Calendar, label: 'Schedule', href: '/schedule' },
  { icon: Settings, label: 'Settings', href: '/settings' }
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 py-3 lg:hidden z-[200] pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname?.startsWith(item.href)
        
        return (
          <Link 
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 group transition-all duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500'}`}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 scale-110 shadow-sm' : 'group-hover:bg-slate-50 dark:group-hover:bg-slate-800'}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[0.6rem] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
