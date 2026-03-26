'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Shield,
  Mail,
  MessageSquare,
  Database,
  RefreshCcw,
  Save,
  Bell,
  Zap
} from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

interface AdminProfile {
  full_name: string
  email: string
  role: string
}

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, role')
          .eq('id', user.id)
          .single()
        if (profileData?.role === 'admin') setProfile(profileData)
      }
      setLoading(false)
    }
    fetchAdmin()
  }, []) // Removed dependency on supabase to prevent redundant calls

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 800)
  }


  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 800,
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '0.75rem'
  }

  const cardStyle: React.CSSProperties = {
    background: '#0F172A',
    border: '1px solid #1E293B',
    borderRadius: '1.5rem',
    padding: '2rem',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
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
        display: 'flex',
        flexDirection: 'column',
      }}>

        <AdminHeader
          isMobile={isMobile}
          onMenuClick={() => setIsSidebarOpen(true)}
          searchPlaceholder="Search settings..."
        />

        <div style={{ padding: isMobile ? '1.5rem 1rem' : '2.5rem 3.5rem', maxWidth: 1000 }}>

          {/* Core Infrastructure */}
          <div style={sectionHeaderStyle}>Infrastructure</div>
          {loading ? (
            <div style={{ ...cardStyle, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 1.1s linear infinite' }} />
            </div>
          ) : (
            <div style={cardStyle}>
              {/* Card content for settings... */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} color="#6366F1" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0 }}>Workspace Configuration</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>Manage core environment variables.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Organization Name</label>
                  <input
                    defaultValue="StudSync Global"
                    style={{ width: '100%', padding: '0.875rem 1.125rem', borderRadius: '0.875rem', border: '1px solid #1E293B', background: '#030712', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Workspace URL</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ padding: '0.875rem 1.125rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.875rem', fontSize: '0.95rem', color: '#6366F1', fontWeight: 800 }}>studysync.io/</div>
                    <input
                      defaultValue="global-hq"
                      style={{ flex: 1, padding: '0.875rem 1.125rem', borderRadius: '0.875rem', border: '1px solid #1E293B', background: '#030712', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Communication Channels */}
          <div style={sectionHeaderStyle}>Connectivity</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* SMTP Status */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={18} color="#94A3B8" />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0 }}>SMTP Relay</h3>
                </div>
                <div style={{ padding: '0.25rem 0.625rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900 }}>ACTIVE</div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1.5rem' }}>Primary channel for transactional student alerts and feedback notifications.</p>
              <button style={{ width: '100%', padding: '0.75rem', borderRadius: '0.875rem', border: '1px solid #1E293B', background: 'transparent', fontSize: '0.85rem', fontWeight: 700, color: 'white', cursor: 'pointer' }}>Manage Transport</button>
            </div>

            {/* SMS Status */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={18} color="#94A3B8" />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0 }}>SMS Gateway</h3>
                </div>
                <div style={{ padding: '0.25rem 0.625rem', background: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900 }}>STANDBY</div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1.5rem' }}>Fall-back protocol for critical campus notifications and auth codes via SMS.</p>
              <button style={{ width: '100%', padding: '0.75rem', borderRadius: '0.875rem', border: '1px solid #1E293B', background: 'transparent', fontSize: '0.85rem', fontWeight: 700, color: 'white', cursor: 'pointer' }}>Configure API</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '1.5rem' }}>
            {/* System Health / Recovery */}
            <div>
              <div style={sectionHeaderStyle}>Recovery</div>
              <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #0F172A, #111827)', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.75rem' }}>
                  <Database size={22} color="#6366F1" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Data Backups</h3>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '1.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6 }}>Last Automatic Snapshot</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981' }}>SUCCESSFUL</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>2 hours ago</div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button style={{ flex: 1, padding: '0.875rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem' }}>
                    <RefreshCcw size={16} /> Audit Log
                  </button>
                  <button style={{ flex: 1, padding: '0.875rem', borderRadius: '1rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>Restore Point</button>
                </div>
              </div>
            </div>

            {/* AI Optimization */}
            <div>
              <div style={sectionHeaderStyle}>Optimization</div>
              <div style={cardStyle}>
                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Zap size={32} color="#6366F1" />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>AI Smart Sync</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '2rem', lineHeight: 1.5 }}>Database indexing auto-optimization is currently offline.</p>
                  <button style={{ width: '100%', padding: '0.875rem', borderRadius: '1rem', border: 'none', background: '#6366F1', color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>Enable Optimizer</button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Branding */}
        <div style={{ marginTop: 'auto', padding: '2.5rem', textAlign: 'center', color: '#1E293B', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          StudSync Core Engine v4.0.1 • Dark Ops Edition
        </div>
      </main>
    </div>
  )
}
