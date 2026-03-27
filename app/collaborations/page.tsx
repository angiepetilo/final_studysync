'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import Link from 'next/link'
import { Users, Plus, Trash2, Lock, Globe, ArrowRight, User } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import UserNav from '@/components/UserNav'

interface Collaboration {
  id: string
  title: string
  description: string
  visibility: string
  owner_id: string
  created_at: string
  member_count?: number
}

export default function CollaborationsPage() {
  const supabase = createClient()
  const [rooms, setRooms] = useState<Collaboration[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [userProfile, setUserProfile] = useState<{ id: string, full_name: string, email: string }>({ id: '', full_name: '', email: '' })
  const [form, setForm] = useState({ title: '', description: '', visibility: 'private' })

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    setUserProfile({ id: user.id, full_name: profile?.full_name || '', email: user.email || '' })

    const { data: collabs } = await supabase.from('collaborations').select('*').order('created_at', { ascending: false })

    if (collabs) {
      const enriched = await Promise.all(
        collabs.map(async (collab: any) => {
          const { count } = await supabase.from('collaboration_members').select('*', { count: 'exact', head: true }).eq('collaboration_id', collab.id)
          return { ...collab, member_count: count || 0 }
        })
      )
      setRooms(enriched)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [supabase])

  const handleCreate = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: collab } = await supabase.from('collaborations').insert({
      title: form.title,
      description: form.description || null,
      visibility: form.visibility,
      owner_id: user.id,
    }).select().single()

    if (collab) {
      await supabase.from('collaboration_members').insert({
        collaboration_id: collab.id,
        user_id: user.id,
        role: 'owner',
      })
    }

    setSaving(false)
    setModalOpen(false)
    setForm({ title: '', description: '', visibility: 'private' })
    fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('collaborations').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchData()
  }

  if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-header flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title text-2xl font-black text-slate-900">Collaborations</h1>
          <p className="page-subtitle text-slate-500 font-bold">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn btn-primary px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-md font-bold hover:bg-indigo-700 transition flex items-center gap-2" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Create Room
          </button>
          
          <NotificationBell userId={userProfile.id} className="w-12 h-12 rounded-2xl bg-white border border-slate-100" iconSize={20} />
          <UserNav user={userProfile} />
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Users size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No collaboration rooms</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Create your first room to start collaborating with peers.</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Create Room</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }} className="stagger-children">
          {rooms.map(room => (
            <div key={room.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} color="var(--accent)" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{room.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {room.visibility === 'private' ? <Lock size={11} /> : <Globe size={11} />}
                      <span style={{ textTransform: 'capitalize' }}>{room.visibility}</span>
                    </div>
                  </div>
                </div>
                {room.owner_id === userId && (
                  <button onClick={() => setDeleteId(room.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--muted)' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {room.description && (
                <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>{room.description}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Member avatars */}
                  <div style={{ display: 'flex' }}>
                    {Array.from({ length: Math.min(room.member_count || 0, 3) }).map((_, i) => (
                      <div key={i} style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: ['#4F46E5', '#10b981', '#f59e0b'][i],
                        border: '2px solid var(--card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: i > 0 ? '-8px' : '0',
                        zIndex: 3 - i,
                      }}>
                        <User size={12} color="white" />
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{room.member_count} member{(room.member_count || 0) !== 1 ? 's' : ''}</span>
                </div>
                <Link href={`/collaborations/${room.id}`} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.78rem' }}>
                  Enter <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Room">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Room Title</label>
            <input className="input" placeholder="e.g. CS 301 Study Group" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="What's this room about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="label">Visibility</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[{ value: 'private', icon: Lock, label: 'Private' }, { value: 'public', icon: Globe, label: 'Public' }].map(v => {
                const Icon = v.icon
                return (
                  <button key={v.value} onClick={() => setForm({ ...form, visibility: v.value })} className="card" style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                    border: form.visibility === v.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                    padding: '0.75rem',
                  }}>
                    <Icon size={16} color={form.visibility === v.value ? 'var(--accent)' : 'var(--muted)'} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{v.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title || saving} style={{ marginTop: '0.5rem' }}>
            {saving ? <span className="spinner" /> : 'Create Room'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Room" message="This room and all its messages will be permanently deleted." />
    </div>
  )
}
