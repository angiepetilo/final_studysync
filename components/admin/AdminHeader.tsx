'use client'

import React, { useEffect, useState } from 'react'
import { Bell, Search, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface AdminHeaderProps {
  isMobile: boolean
  onMenuClick: () => void
  searchPlaceholder?: string
}

export function AdminHeader({ isMobile, onMenuClick, searchPlaceholder = "Search analytics..." }: AdminHeaderProps) {
  const [newFeedbackCount, setNewFeedbackCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch for "pending" feedback count
    const fetchInitialCount = async () => {
      const { count } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      setNewFeedbackCount(count || 0)
    }
    fetchInitialCount()

    // Real-time listener for new feedback
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'feedback' 
      }, () => {
        setNewFeedbackCount(prev => prev + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'feedback'
      }, (payload: any) => {
        // If status changed from pending, decrement
        if (payload.new.status !== 'pending' && payload.old.status === 'pending') {
          setNewFeedbackCount(prev => Math.max(0, prev - 1))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '1rem' : '1.25rem 2.5rem', 
      background: 'rgba(15, 23, 42, 0.8)',
      borderBottom: '1px solid #1E293B',
      position: 'sticky', top: 0, zIndex: 30,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isMobile && (
          <button onClick={onMenuClick} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.25rem' }}>
            <Menu size={24} />
          </button>
        )}
        <div style={{ position: 'relative', width: isMobile ? 180 : 300 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            placeholder={searchPlaceholder}
            style={{
              width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', fontSize: '0.85rem',
              border: '1px solid #1E293B', borderRadius: '0.75rem', outline: 'none',
              background: '#0F172A', color: 'white'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
         <div style={{ 
           position: 'relative',
           padding: '0.5rem', 
           borderRadius: '0.75rem', 
           background: 'rgba(255,255,255,0.03)', 
           color: '#94A3B8', 
           cursor: 'pointer',
           transition: 'all 0.2s'
         }}>
           <Bell size={18} />
           {newFeedbackCount > 0 && (
             <span style={{
               position: 'absolute',
               top: '4px',
               right: '4px',
               width: '10px',
               height: '10px',
               background: '#EF4444',
               border: '2px solid #0F172A',
               borderRadius: '50%',
               boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
             }} />
           )}
         </div>
      </div>
    </header>
  )
}
