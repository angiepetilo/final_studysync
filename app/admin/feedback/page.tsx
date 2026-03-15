'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, CheckCircle2, Clock, Eye, Send, Home, Mail, Settings, Search, ArrowLeft } from 'lucide-react'

interface FeedbackEntry {
  id: string
  user_id: string
  message: string
  status: string
  admin_reply: string | null
  created_at: string
  profiles?: { full_name: string; email: string }
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/admin/feedback')
      const data = await res.json()
      if (Array.isArray(data)) setFeedback(data)
    } catch (err) {
      console.error('Failed to fetch feedback:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchFeedback() }, [])

  const selected = feedback.find(f => f.id === selectedId)

  const updateStatus = async (id: string, status: string) => {
    setSaving(true)
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setFeedback(prev => prev.map(fb => fb.id === id ? { ...fb, status } : fb))
    setSaving(false)
  }

  const sendReply = async () => {
    if (!replyText.trim() || !selectedId) return
    setSaving(true)
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId, admin_reply: replyText.trim(), status: 'reviewed' }),
    })
    setFeedback(prev => prev.map(fb => fb.id === selectedId ? { ...fb, admin_reply: replyText.trim(), status: 'reviewed' } : fb))
    setReplyText('')
    setSaving(false)
  }

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: '#EEF2FF', text: '#6C63FF', label: 'NEW' },
    reviewed: { bg: '#FEF3C7', text: '#D97706', label: 'IN PROGRESS' },
    resolved: { bg: '#D1FAE5', text: '#059669', label: 'RESOLVED' },
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc' }}><div className="spinner" style={{ borderTopColor: '#6C63FF' }} /></div>

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fafbfc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Sidebar */}
      <aside style={{
        width: 220, minHeight: '100vh', background: 'white', borderRight: '1px solid #E5E7EB',
        padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40,
      }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6C63FF', letterSpacing: '-0.03em' }}>StudSync</h1>
          <p style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Admin Portal</p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {[
            { label: 'Home', icon: Home, href: '/admin/dashboard', active: false },
            { label: 'Messages', icon: Mail, href: '/admin/feedback', active: true },
            { label: 'Settings', icon: Settings, href: '/admin/dashboard', active: false },
          ].map(item => {
            const Icon = item.icon
            return (
              <Link key={item.label} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: '0.75rem', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
                color: item.active ? '#6C63FF' : '#64748B',
                background: item.active ? '#EEF2FF' : 'transparent',
              }}>
                <Icon size={18} /> {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column' }}>

        {/* Top Bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #E5E7EB',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input placeholder="Search conversations..." style={{
              width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', fontSize: '0.85rem',
              border: '1px solid #E5E7EB', borderRadius: '0.75rem', outline: 'none', background: '#F8FAFC',
              fontFamily: "'Inter', system-ui, sans-serif",
            }} />
          </div>
          <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>Messaging Dashboard</span>
        </header>

        {/* Content — Split View */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Feedback List */}
          <div style={{ width: 380, borderRight: '1px solid #E5E7EB', background: 'white', overflowY: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>Feedbacks</h2>
            </div>
            
            {feedback.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                <MessageSquare size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.85rem' }}>No feedback yet</p>
              </div>
            ) : (
              feedback.map(fb => {
                const sc = statusConfig[fb.status] || statusConfig.new
                const isSelected = selectedId === fb.id
                return (
                  <div
                    key={fb.id}
                    onClick={() => { setSelectedId(fb.id); setReplyText(fb.admin_reply || '') }}
                    style={{
                      padding: '1rem 1.5rem', cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
                      background: isSelected ? '#F8FAFC' : 'white',
                      borderLeft: isSelected ? '3px solid #6C63FF' : '3px solid transparent',
                      transition: 'all 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Status Badge */}
                      <span style={{
                        fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                        padding: '0.2rem 0.5rem', borderRadius: '0.375rem',
                        background: sc.bg, color: sc.text, whiteSpace: 'nowrap',
                      }}>{sc.label}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: 'auto' }}>{timeAgo(fb.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.625rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.8rem',
                      }}>
                        {(fb.profiles?.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>{fb.profiles?.full_name || 'Anonymous'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fb.message.slice(0, 50)}{fb.message.length > 50 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Selected Conversation */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafbfc' }}>
            {selected ? (
              <>
                {/* Header */}
                <div style={{ padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700,
                    }}>
                      {(selected.profiles?.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>{selected.profiles?.full_name || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C63FF', display: 'inline-block' }} />
                        {selected.profiles?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {selected.status !== 'resolved' && (
                      <button
                        onClick={() => updateStatus(selected.id, 'resolved')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.375rem',
                          padding: '0.4rem 0.75rem', borderRadius: '0.5rem',
                          background: '#D1FAE5', color: '#059669', border: 'none',
                          fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                          fontFamily: "'Inter', system-ui, sans-serif",
                        }}
                      >
                        <CheckCircle2 size={14} /> Resolve
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                  {/* Date */}
                  <div style={{ textAlign: 'center', margin: '0.75rem 0 1.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                      {new Date(selected.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* User Message */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '0.8rem',
                    }}>
                      {(selected.profiles?.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '0 1rem 1rem 1rem',
                        padding: '1rem 1.25rem', maxWidth: 480, fontSize: '0.88rem', lineHeight: 1.6, color: '#374151',
                      }}>
                        {selected.message}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.375rem', marginLeft: '0.25rem' }}>
                        {new Date(selected.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Admin Reply */}
                  {selected.admin_reply && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                      <div>
                        <div style={{
                          background: '#6C63FF', borderRadius: '1rem 0 1rem 1rem',
                          padding: '1rem 1.25rem', maxWidth: 480, fontSize: '0.88rem', lineHeight: 1.6, color: 'white',
                        }}>
                          {selected.admin_reply}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.375rem', textAlign: 'right', marginRight: '0.25rem' }}>
                          Admin
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Input */}
                <div style={{ padding: '1rem 1.5rem', background: 'white', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <input
                      placeholder={`Type your reply to ${selected.profiles?.full_name || 'user'}...`}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendReply()}
                      style={{
                        flex: 1, padding: '0.75rem 1rem', fontSize: '0.88rem',
                        border: '1px solid #E5E7EB', borderRadius: '0.75rem', outline: 'none',
                        background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    />
                    <button
                      onClick={sendReply}
                      disabled={saving || !replyText.trim()}
                      style={{
                        padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: 'none',
                        background: '#6C63FF', color: 'white', fontWeight: 700, fontSize: '0.85rem',
                        cursor: saving || !replyText.trim() ? 'not-allowed' : 'pointer',
                        opacity: saving || !replyText.trim() ? 0.5 : 1,
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    >
                      <Send size={14} /> Send Reply
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#CBD5E1' }}>
                <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Select a conversation to view</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
