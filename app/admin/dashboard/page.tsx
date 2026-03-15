'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft,
  Bell,
  MessageSquare,
  Home,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  Mail,
} from 'lucide-react'

interface AdminProfile {
  full_name: string
  email: string
  role: string
}

interface Stats {
  totalUsers: number
  totalCourses: number
  totalTasks: number
  totalFeedback: number
  newFeedback: number
  totalCollabs: number
}

interface FeedbackItem {
  id: string
  message: string
  status: string
  created_at: string
  profiles?: { full_name: string; email: string }
}

export default function AdminDashboardPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCourses: 0, totalTasks: 0, totalFeedback: 0, newFeedback: 0, totalCollabs: 0 })
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('home')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchAdmin = async () => {
      const localSession = localStorage.getItem('admin_session')
      if (localSession) {
        try {
          const session = JSON.parse(localSession)
          if (session.role === 'admin') {
            setProfile(session)
          }
        } catch {
          localStorage.removeItem('admin_session')
        }
      }

      if (!profile) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, role')
            .eq('id', user.id)
            .single()
          if (profileData?.role === 'admin') setProfile(profileData)
        }
      }

      // Fetch real stats
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        setStats(data)
      } catch { /* stats fail silently */ }

      // Fetch recent feedback
      try {
        const res = await fetch('/api/admin/feedback')
        const data = await res.json()
        if (Array.isArray(data)) setRecentFeedback(data.slice(0, 3))
      } catch { /* feedback fail silently */ }

      setLoading(false)
    }
    fetchAdmin()
  }, [supabase, router])

  const handleSignOut = async () => {
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.removeItem('admin_session')
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc' }}>
        <div className="spinner" style={{ borderTopColor: '#6C63FF' }} />
      </div>
    )
  }

  const statusColor: Record<string, { bg: string; text: string; label: string }> = {
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fafbfc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Sidebar */}
      <aside style={{
        width: 220, minHeight: '100vh', background: 'white', borderRight: '1px solid #E5E7EB',
        padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40,
      }}>
        {/* Brand */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6C63FF', letterSpacing: '-0.03em' }}>StudSync</h1>
          <p style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.02em' }}>Admin Dashboard</p>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {[
            { key: 'home', label: 'Home', icon: Home, href: '/admin/dashboard' },
            { key: 'feedback', label: 'Messages', icon: Mail, href: '/admin/feedback' },
            { key: 'settings', label: 'Settings', icon: Settings, href: '/admin/dashboard' },
          ].map(item => {
            const Icon = item.icon
            const isActive = item.key === activeNav
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setActiveNav(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: '0.75rem', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
                  color: isActive ? '#6C63FF' : '#64748B',
                  background: isActive ? '#EEF2FF' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Admin Profile */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
            {(profile?.full_name || 'A').charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>{profile?.full_name || 'Admin'}</div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>System Admin</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 220, padding: '0' }}>

        {/* Top Bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2.5rem', background: 'white', borderBottom: '1px solid #E5E7EB',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              placeholder="Search analytics or users..."
              style={{
                width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', fontSize: '0.85rem',
                border: '1px solid #E5E7EB', borderRadius: '0.75rem', outline: 'none',
                background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif",
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748B', fontSize: '0.8rem',
              textDecoration: 'none', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB',
            }}>
              <ArrowLeft size={14} /> Student View
            </Link>
            <button onClick={handleSignOut} style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748B', fontSize: '0.8rem',
              background: 'transparent', border: '1px solid #E5E7EB', padding: '0.4rem 0.75rem',
              borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: '2rem 2.5rem', maxWidth: 1100 }}>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>

            {/* Total Users */}
            <div style={{
              background: 'white', border: '1px solid #E5E7EB', borderRadius: '1.25rem',
              padding: '1.75rem', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '1rem', background: '#EEF2FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem',
              }}>
                <Users size={22} color="#6C63FF" />
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Total Users
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {stats.totalUsers.toLocaleString()}
              </div>
            </div>

            {/* Active Courses */}
            <div style={{
              background: 'white', border: '1px solid #E5E7EB', borderRadius: '1.25rem',
              padding: '1.75rem',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                Platform Activity
              </div>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em' }}>
                    {stats.totalTasks.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Total Tasks</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6C63FF' }}>
                    {stats.totalCourses}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Courses</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>
                    {stats.totalCollabs}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Collabs</div>
                </div>
              </div>
            </div>

            {/* Feedback Tickets */}
            <div style={{
              background: 'linear-gradient(135deg, #6C63FF, #A78BFA)', borderRadius: '1.25rem',
              padding: '1.75rem', color: 'white', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
                Feedback Tickets
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, margin: '0.75rem 0' }}>
                {stats.totalFeedback}
              </div>
              {stats.newFeedback > 0 && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>
                  {stats.newFeedback} new ticket{stats.newFeedback !== 1 ? 's' : ''}
                </div>
              )}
              <Link href="/admin/feedback" style={{
                marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: 'white', color: '#6C63FF',
                fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', width: 'fit-content',
                transition: 'all 0.15s',
              }}>
                Review Tickets
              </Link>
            </div>
          </div>

          {/* Student Feedback Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B' }}>Student Feedback</h2>
              <Link href="/admin/feedback" style={{ color: '#6C63FF', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View All →
              </Link>
            </div>

            {recentFeedback.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentFeedback.map(fb => {
                  const sc = statusColor[fb.status] || statusColor.new
                  return (
                    <div key={fb.id} style={{
                      background: 'white', border: '1px solid #E5E7EB', borderRadius: '1rem',
                      padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem',
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.9rem',
                      }}>
                        {(fb.profiles?.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>
                            {fb.profiles?.full_name || 'Anonymous'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 500 }}>
                            {timeAgo(fb.created_at)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                            padding: '0.15rem 0.5rem', borderRadius: '0.375rem',
                            background: sc.bg, color: sc.text,
                          }}>
                            {sc.label}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                          &ldquo;{fb.message.length > 120 ? fb.message.slice(0, 120) + '...' : fb.message}&rdquo;
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{
                background: 'white', border: '1px solid #E5E7EB', borderRadius: '1rem',
                padding: '3rem', textAlign: 'center', color: '#94A3B8',
              }}>
                <MessageSquare size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No feedback yet. Users can submit feedback from Settings.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '2rem', color: '#CBD5E1', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          StudSync Administrative Console v2.4.0
        </div>
      </main>
    </div>
  )
}
