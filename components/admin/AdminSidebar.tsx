'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  Home, 
  Mail, 
  Settings, 
  LogOut, 
  X 
} from 'lucide-react'

interface AdminProfile {
  full_name: string
  email: string
  role: string
}

interface AdminSidebarProps {
  profile: AdminProfile | null
  isMobile: boolean
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ profile, isMobile, isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [showLogoutModal, setShowLogoutModal] = React.useState(false)

  const handleSignOut = async () => {
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    localStorage.removeItem('admin_session')
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const navItems = [
    { key: 'home', label: 'Home', icon: Home, href: '/admin/dashboard' },
    { key: 'feedback', label: 'Messages', icon: Mail, href: '/admin/feedback' },
    { key: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
  ]

  return (
    <>
      {/* Global CSS for Admin Layout Stability */}
      <style jsx global>{`
        .admin-main-container {
          margin-left: 0;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
        }
        @media (min-width: 768px) {
          .admin-main-container {
            margin-left: 220px;
            width: calc(100% - 220px);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          onClick={onClose}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.6)', 
            zIndex: 45, 
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      <aside style={{
        width: 220, 
        minHeight: '100vh', 
        background: '#0F172A', // Premium Dark (Slate 900)
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.25rem',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isMobile && isOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none',
        visibility: !isMobile || isOpen ? 'visible' : 'hidden', // Extra safety for layout
      }}>
        {/* Brand */}
        <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => router.push('/admin/dashboard')}>
            <h1 style={{ fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', margin: 0 }}>
              StudSync<span style={{ color: '#6366F1' }}>.</span>
            </h1>
            <p style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0.2rem 0 0 0' }}>Admin Console</p>
          </div>
          {isMobile && (
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.125rem',
                  borderRadius: '1rem', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700,
                  color: isActive ? 'white' : '#94A3B8',
                  background: isActive ? '#6366F1' : 'transparent',
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout & Profile */}
        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '1.5rem', marginTop: 'auto' }}>
          <button 
            onClick={() => setShowLogoutModal(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.125rem',
              borderRadius: '1rem',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              color: '#FB7185',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              marginBottom: '1.5rem',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.25rem' }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: '14px', 
              background: 'linear-gradient(135deg, #6366F1, #A855F7)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'white', fontWeight: 900, fontSize: '1.1rem',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              {(profile?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'Admin User'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', background: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '100%', maxWidth: 400, background: '#0F172A',
            border: '1px solid #1E293B', borderRadius: '1.5rem',
            padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '1.25rem',
              background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <LogOut size={30} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem' }}>Sign Out?</h3>
            <p style={{ fontSize: '0.95rem', color: '#94A3B8', marginBottom: '2rem', lineHeight: 1.5 }}>
              Are you sure you want to end your administrative session?
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: '0.875rem', borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid #1E293B',
                  color: '#94A3B8', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSignOut}
                style={{
                  flex: 1, padding: '0.875rem', borderRadius: '0.75rem',
                  background: '#EF4444', border: 'none',
                  color: 'white', fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)', transition: '0.2s'
                }}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
