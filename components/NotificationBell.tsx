'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Bell, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface NotificationBellProps {
  userId: string
  className?: string
  iconSize?: number
  variant?: 'circle' | 'square'
}

export default function NotificationBell({ 
  userId, 
  className = "", 
  iconSize = 22,
  variant = 'circle'
}: NotificationBellProps) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        setNotifications(data || [])
      } catch { /* fail silently */ }
    }

    fetchNotifications()

    const notifChannel = supabase
      .channel(`header-notifs-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(notifChannel)
    }
  }, [userId, supabase])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const roundedClass = variant === 'circle' ? 'rounded-full' : 'rounded-2xl'
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className={`${className} flex items-center justify-center transition-all relative ${showNotifications ? 'text-indigo-600 shadow-inner bg-slate-50' : 'text-slate-400 hover:text-indigo-600 hover:shadow-md'}`}
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-4 w-[320px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-900 border-b-2 border-indigo-500 pb-1">Notifications</h3>
            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="mx-auto text-slate-200 mb-3" size={32} />
                <p className="text-xs text-slate-400 font-bold">All caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 rounded-[1.25rem] border transition-all cursor-pointer ${n.read ? 'border-slate-50 bg-slate-50/50 grayscale-[0.5]' : 'border-indigo-50 bg-indigo-50/30'}`}
                >
                  <p className="text-[0.75rem] font-black text-slate-900 leading-tight mb-1">{n.title}</p>
                  <p className="text-[0.7rem] text-slate-500 leading-normal mb-2">{n.message}</p>
                  <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-tight">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
