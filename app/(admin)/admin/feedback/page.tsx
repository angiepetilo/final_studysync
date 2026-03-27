'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Search,
  CheckCircle2,
  Clock,
  Menu,
  Send,
  MoreVertical,
  User,
  ArrowLeft,
  Mail,
  Zap,
} from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

interface AdminProfile {
  full_name: string
  email: string
  role: string
}

interface FeedbackItem {
  id: string
  user_id: string
  message: string
  status: string
  admin_reply: string | null
  created_at: string
  profiles?: { full_name: string; email: string }
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<AdminProfile | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchAdmin = async () => {
       const localSession = localStorage.getItem('admin_session')
       let currentProfile = null

       if (localSession) {
         try {
           currentProfile = JSON.parse(localSession)
           if (currentProfile.role === 'admin') setProfile(currentProfile)
         } catch { localStorage.removeItem('admin_session') }
       }
       const { data: { user } } = await supabase.auth.getUser()
       if (user && !currentProfile) {
         const { data: p } = await supabase.from('profiles').select('full_name, email, role').eq('id', user.id).single()
         if (p?.role === 'admin') setProfile(p)
       }
    }
    fetchAdmin()
    fetchFeedback()
  }, []) // Remove profile/supabase dependency

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/admin/feedback')
      const data = await res.json()
      setFeedback(data)
    } finally {
      setLoading(false)
    }
  }

  const FeedbackSkeleton = () => (
    <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid #1E293B', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
      <div style={{ width: '40%', height: '1.25rem', background: '#1E293B', borderRadius: '4px', marginBottom: '0.5rem' }} />
      <div style={{ width: '80%', height: '1rem', background: '#1E293B', borderRadius: '4px' }} />
    </div>
  )

  const handleUpdateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    fetchFeedback()
  }

  const handleSendReply = async () => {
    if (!selectedId || !replyText.trim()) return
    setSending(true)
    try {
      await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, admin_reply: replyText, status: 'resolved' })
      })
      setReplyText('')
      fetchFeedback()
    } finally {
      setSending(false)
    }
  }

  const selectedFeedback = feedback.find(f => f.id === selectedId)


  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#030712', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      <AdminSidebar 
        profile={profile}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="admin-main-container" style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        <AdminHeader 
          isMobile={isMobile} 
          onMenuClick={() => setIsSidebarOpen(true)} 
          searchPlaceholder="Search messages..."
        />

        {/* Content — Split View */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          
          {/* Feedback List */}
          <div style={{ 
            width: isMobile ? '100%' : 380, 
            borderRight: '1px solid #1E293B', 
            background: '#0F172A', 
            overflowY: 'auto',
            display: isMobile && selectedId ? 'none' : 'block'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #1E293B' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', margin: 0 }}>Conversations</h2>
            </div>
            
            {loading ? (
              <>
                <FeedbackSkeleton />
                <FeedbackSkeleton />
                <FeedbackSkeleton />
              </>
            ) : feedback.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>No feedback threads.</div>
            ) : (
              feedback.map(f => (
                <div 
                  key={f.id} 
                  onClick={() => setSelectedId(f.id)}
                  style={{
                    padding: '1.25rem 1.5rem', borderBottom: '1px solid #1E293B', cursor: 'pointer',
                    background: selectedId === f.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #334155, #111827)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                      {(f.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>{f.profiles?.full_name || 'Anonymous'}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Conversation Detail */}
          <div style={{ 
            flex: 1, display: (isMobile && !selectedId) ? 'none' : 'flex', 
            flexDirection: 'column', background: '#030712' 
          }}>
            {selectedFeedback ? (
              <>
                {/* Chat Header */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.4)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedFeedback.status === 'resolved' ? '#10B981' : '#F59E0B' }} />
                     <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0 }}>{selectedFeedback.profiles?.full_name}</h3>
                   </div>
                   <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>#{selectedFeedback.id.slice(0,8)}</div>
                </div>

                {/* Chat History */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   {/* Student Message */}
                   <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>STUDENT</div>
                      <div style={{ padding: '1.25rem', background: '#0F172A', border: '1px solid #1E293B', borderRadius: '0 1.25rem 1.25rem 1.25rem', color: '#F8FAFC', lineHeight: 1.6, fontSize: '0.95rem' }}>
                        {selectedFeedback.message}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.5rem', marginLeft: '0.5rem' }}>{new Date(selectedFeedback.created_at).toLocaleString()}</div>
                   </div>

                   {/* Admin Reply */}
                   {selectedFeedback.admin_reply && (
                     <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366F1', marginBottom: '0.5rem', textAlign: 'right', marginRight: '0.5rem' }}>ADMINISTRATOR</div>
                        <div style={{ padding: '1.25rem', background: '#6366F1', borderRadius: '1.25rem 1.25rem 0 1.25rem', color: 'white', lineHeight: 1.6, fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)' }}>
                          {selectedFeedback.admin_reply}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.5rem', textAlign: 'right', marginRight: '0.5rem' }}>System Sent</div>
                     </div>
                   )}
                </div>

                {/* Reply Input */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #1E293B', background: '#0F172A' }}>
                   <div style={{ position: 'relative' }}>
                     <textarea 
                       placeholder="Write a response to student..."
                       value={replyText}
                       onChange={(e) => setReplyText(e.target.value)}
                       style={{ width: '100%', padding: '1rem 3.5rem 1rem 1.25rem', borderRadius: '1rem', background: '#030712', border: '1px solid #1E293B', color: 'white', fontSize: '0.95rem', resize: 'none', minHeight: 100, outline: 'none' }}
                     />
                     <button 
                       onClick={handleSendReply}
                       disabled={sending || !replyText.trim()}
                       style={{ 
                         position: 'absolute', right: '0.75rem', bottom: '0.75rem', padding: '0.6rem',
                         borderRadius: '0.75rem', border: 'none', background: '#6366F1', color: 'white',
                         cursor: (sending || !replyText.trim()) ? 'not-allowed' : 'pointer', opacity: (sending || !replyText.trim()) ? 0.5 : 1, transition: 'all 0.2s'
                        }}
                     >
                       <Send size={18} />
                     </button>
                   </div>
                   <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button onClick={() => handleUpdateStatus(selectedFeedback.id, 'reviewed')} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.5rem 0.875rem', borderRadius: '0.75rem', border: '1px solid #1E293B', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}>Mark In Progress</button>
                      <button onClick={() => handleUpdateStatus(selectedFeedback.id, 'resolved')} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.5rem 0.875rem', borderRadius: '0.75rem', border: '1px solid #6366F1', background: 'rgba(99,102,241,0.05)', color: '#6366F1', cursor: 'pointer' }}>Resolve Instantly</button>
                   </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', gap: '1rem' }}>
                 <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', border: '1px solid #1E293B' }}>
                   <Mail size={32} />
                 </div>
                 <p style={{ fontWeight: 600 }}>Select a feedback thread to review.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
