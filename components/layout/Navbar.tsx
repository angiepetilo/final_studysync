'use client'

import React from 'react'
import NotificationBell from '@/components/dashboard/NotificationBell'
import UserNav from '@/components/dashboard/UserNav'
import { useData } from '@/context/DataContext'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'

export const Navbar = () => {
  const { user, hasUnreadMessages, unreadRoomId, collaborations } = useData()
  const pathname = usePathname()
  const router = useRouter()
  
  // Map pathname to breadcrumb/page title if needed
  const getPageTitle = () => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return 'Sync'
    const lastPart = parts[parts.length - 1]
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[80px] lg:left-[260px] h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 z-40 transition-all duration-300">
      <div className="h-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:block">
            {getPageTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <button
                onClick={() => {
                  if (unreadRoomId) {
                    router.push(`/collaborations/${unreadRoomId}`)
                  } else if (collaborations && collaborations.length > 0) {
                    router.push(`/collaborations/${collaborations[0].id}`)
                  } else {
                    router.push('/collaborations')
                  }
                }}
                className="relative w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center text-slate-500 group"
              >
                <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                
                {hasUnreadMessages && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-sm" />
                )}
              </button>

              <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

              <NotificationBell 
                userId={user.id} 
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" 
              />
              <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />
              <UserNav user={user} />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
