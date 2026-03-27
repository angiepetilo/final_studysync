'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Bell,
  MessageSquare,
  Home,
  Search,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Skeletons for inline loading
  const StatSkeleton = () => (
    <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '1.5rem', padding: '1.5rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#1E293B', marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
      <div style={{ width: '60%', height: '1.5rem', background: '#1E293B', borderRadius: '4px', marginBottom: '0.5rem', animation: 'pulse 2s infinite' }} />
      <div style={{ width: '40%', height: '1rem', background: '#1E293B', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
    </div>
  )

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    } catch { /* stats fail silently */ }
  }, [setStats]) // Dependency on setStats

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feedback')
      const data = await res.json()
      if (Array.isArray(data)) setRecentFeedback(data.slice(0, 3))
    } catch { /* feedback fail silently */ }
  }, [setRecentFeedback]) // Dependency on setRecentFeedback

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
    }
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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, role')
          .eq('id', user.id)
          .single()
        if (profileData?.role === 'admin') {
          setProfile(profileData)
          localStorage.setItem('admin_session', JSON.stringify(profileData))
        }
      }
      // Trigger data fetches
      await Promise.all([fetchStats(), fetchFeedback()])
      setLoading(false)
    }
    fetchAdmin()
  }, [fetchStats, fetchFeedback, supabase.auth, profile])


  const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366F1', label: 'NEW' },
    reviewed: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', label: 'IN PROGRESS' },
    resolved: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', label: 'RESOLVED' },
  }

  const timeAgo = (dateStr: string) => {
    const now = Date.now()
    const diff = now - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

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
        background: '#030712',
        display: 'flex',
        flexDirection: 'column',
      }}>

        <AdminHeader 
          isMobile={isMobile} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        <div style={{ padding: isMobile ? '1.5rem 1rem' : '2.5rem 3rem', maxWidth: 1200 }}>
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '2.25rem', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', margin: 0 }}>
              Welcome back, <span style={{ color: '#6366F1' }}>{profile?.full_name?.split(' ')[0] || 'Admin'}</span>
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748B', fontWeight: 600, marginTop: '0.5rem' }}>Management Overview for global operations.</p>
          </div>

          {/* Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem', 
            marginBottom: '3rem' 
          }}>
            {loading ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                {/* Total Users */}
                <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '1.5rem', padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                      <Users size={24} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Total Platform Users</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.04em' }}>{stats.totalUsers.toLocaleString()}</div>
                </div>

                {/* Platform Activity */}
                <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '1.5rem', padding: '2rem' }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>Platform Activity</div>
                   <div style={{ display: 'flex', gap: '2rem' }}>
                      <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white' }}>{stats.totalTasks}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>TASKS</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#6366F1' }}>{stats.totalCourses}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>COURSES</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981' }}>{stats.totalCollabs}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>ROOMS</div>
                      </div>
                   </div>
                </div>

                {/* Fast Access */}
                <div style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: '1.5rem', padding: '2rem', color: 'white' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '1rem' }}>Pending Messages</div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, margin: '0.5rem 0' }}>{stats.totalFeedback}</div>
                  <Link href="/admin/feedback" style={{
                    display: 'inline-block', padding: '0.6rem 1.25rem', background: 'white', color: '#6366F1',
                    borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none',
                    marginTop: '1rem'
                  }}>
                    Respond Now
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Activity Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: 0 }}>Recent Student Requests</h3>
            <Link href="/admin/feedback" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6366F1', textDecoration: 'none' }}>View Thread →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} style={{ padding: '1.5rem', background: '#0F172A', borderRadius: '1.25rem', border: '1px solid #1E293B', height: 100, animation: 'pulse 2s infinite' }}>
                   <div style={{ width: '40%', height: '1.25rem', background: '#1E293B', borderRadius: '4px', marginBottom: '0.5rem' }} />
                   <div style={{ width: '80%', height: '1rem', background: '#1E293B', borderRadius: '4px' }} />
                </div>
              ))
            ) : recentFeedback.length > 0 ? (
              recentFeedback.map(fb => {
                const s = statusStyle[fb.status] || statusStyle.new
                return (
                  <div key={fb.id} style={{
                    padding: '1.5rem', background: '#0F172A', borderRadius: '1.25rem', border: '1px solid #1E293B',
                    display: 'flex', alignItems: 'center', gap: '1.25rem'
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #334155, #1E293B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, flexShrink: 0 }}>
                      {(fb.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, color: 'white' }}>{fb.profiles?.full_name || 'Anonymous Student'}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{timeAgo(fb.created_at)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: s.bg, color: s.text, fontSize: '0.65rem', fontWeight: 800 }}>{s.label}</div>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#94A3B8', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>&ldquo;{fb.message}&rdquo;</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center', background: '#0F172A', borderRadius: '1.5rem', border: '1px dashed #1E293B' }}>
                <p style={{ color: '#64748B', fontWeight: 600 }}>All requests currently handled.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto', padding: '2.5rem', borderTop: '1px solid #1E293B', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: '#334155', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            StudSync Operations Console © 2026 • Secure Admin Layer
          </p>
        </div>
      </main>
    </div>
  )
}
