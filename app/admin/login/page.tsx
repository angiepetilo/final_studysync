'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Lock, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'

// Default admin credentials — works without Supabase
const DEFAULT_ADMIN_EMAIL = 'admin@studysync.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Force sign out when landing on login page
    const clearSession = async () => {
      document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      localStorage.removeItem('admin_session')
      await supabase.auth.signOut()
    }
    clearSession()
  }, [supabase.auth])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Check default admin credentials first
    if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      document.cookie = 'admin_session=true; path=/;' // Session cookie instead of 1 day
      localStorage.setItem('admin_session', JSON.stringify({
        email: DEFAULT_ADMIN_EMAIL,
        full_name: 'System Administrator',
        role: 'admin',
        isDefault: true,
        loginAt: new Date().toISOString(),
      }))
      router.push('/admin/dashboard')
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Authentication failed.')
        setLoading(false)
        return
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        // Sign out non-admin user
        await supabase.auth.signOut()
        setError('Access denied. This portal is restricted to administrators only.')
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="animate-fadeIn" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '1.25rem',
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)',
            }}
          >
            <Shield size={30} color="white" />
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#f1f5f9',
            }}
          >
            Admin Portal
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.375rem' }}>
            Restricted access — administrators only
          </p>
        </div>

        {/* Form Card */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.5rem',
                }}
              >
                Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#64748b"
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  type="email"
                  placeholder="admin@studysync.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: '#f1f5f9',
                    background: 'rgba(15, 23, 42, 0.6)',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.5rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#64748b"
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: '#f1f5f9',
                    background: 'rgba(15, 23, 42, 0.6)',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.8rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                marginTop: '0.25rem',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(239, 68, 68, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.3)'
              }}
            >
              {loading ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  Access Admin Panel <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link
            href="/login"
            style={{
              color: '#64748b',
              fontSize: '0.8rem',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b' }}
          >
            ← Back to Student Login
          </Link>
        </div>

        {/* Security notice */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            color: '#475569',
            fontSize: '0.7rem',
          }}
        >
          <Shield size={12} />
          <span>Protected by end-to-end encryption</span>
        </div>
      </div>
    </div>
  )
}
