'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/shared/Modal'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Link from 'next/link'
import { Users, Plus, Trash2, Lock, Globe, ArrowRight, User, Loader2 } from 'lucide-react'
import NotificationBell from '@/components/dashboard/NotificationBell'
import UserNav from '@/components/dashboard/UserNav'
import { createCollaboration, getDiscoverableCollaborations, joinCollaboration } from '@/lib/actions/student'
import { useRouter } from 'next/navigation'

interface Collaboration {
  id: string
  title: string
  description: string
  visibility: string
  owner_id: string
  created_at: string
  collaboration_members?: Array<{
    user_id: string
    profiles?: {
      full_name: string
      email: string
    }
  }>
}

interface Props {
  initialCollaborations: Collaboration[]
  userProfile: { id: string, full_name: string, email: string }
}

import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/shared/Card'
import PageLayout from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { CollaborationsSkeleton } from '@/components/shared/LoadingSkeleton'

export default function CollaborationClient({ initialCollaborations, userProfile }: Props) {
  const router = useRouter()
  const [rooms, setRooms] = useState(initialCollaborations)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [enteringId, setEnteringId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'discover'>('my-rooms')
  const [discoverableRooms, setDiscoverableRooms] = useState<Collaboration[]>([])
  const [loadingDiscoverable, setLoadingDiscoverable] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', visibility: 'private', type: 'study_group' as const })

  const handleCreate = async () => {
    setSaving(true)
    
    const result = await createCollaboration(userProfile.id, {
      title: form.title,
      description: form.description,
      type: form.type,
      visibility: form.visibility as any
    })

    if (result.success) {
      setSaving(false)
      setModalOpen(false)
      setForm({ title: '', description: '', visibility: 'private', type: 'study_group' })
      router.refresh()
    } else {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteId(null)
    router.refresh()
  }

  const getMemberCount = (room: Collaboration) => {
    return room.collaboration_members?.length || 0
  }

  const fetchDiscoverable = async () => {
    setLoadingDiscoverable(true)
    const result = await getDiscoverableCollaborations(userProfile.id)
    setDiscoverableRooms(result as any)
    setLoadingDiscoverable(false)
  }

  const handleJoinRoom = async (roomId: string) => {
    setJoiningId(roomId)
    const result = await joinCollaboration(roomId, userProfile.id)
    if (result.success) {
      router.refresh()
      setActiveTab('my-rooms')
    }
    setJoiningId(null)
  }

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscoverable()
    }
  }, [activeTab])

  if (!userProfile) return <CollaborationsSkeleton />

  return (
    <PageLayout>
      <PageHeader 
        title="Collaborations"
        subtitle="Connect and collaborate with your peers."
        action={
          <button 
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-3 active:scale-[0.98] uppercase text-[0.7rem] tracking-widest"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={18} strokeWidth={3} />
            Create Room
          </button>
        }
      />

      <div className="max-w-[1600px] mx-auto">
        <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-2xl w-fit mb-12 border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('my-rooms')}
            className={cn(
              "px-8 py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-widest transition-all",
              activeTab === 'my-rooms' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            My Rooms
          </button>
          <button 
            onClick={() => {
              setActiveTab('discover')
              fetchDiscoverable()
            }}
            className={cn(
              "px-8 py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-widest transition-all",
              activeTab === 'discover' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Discover
          </button>
        </div>

        {activeTab === 'my-rooms' ? (
          rooms.length === 0 ? (
          <div className="bg-slate-50/50 dark:bg-slate-900/10 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] p-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center mx-auto mb-8 text-slate-200 dark:text-slate-800">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No collaboration rooms</h3>
            <p className="text-slate-400 dark:text-slate-600 font-bold text-sm max-w-xs mx-auto mb-8">
              Create your first room to start collaborating with peers.
            </p>
            <button 
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 mx-auto uppercase text-[0.65rem] tracking-widest"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={16} strokeWidth={3} />
              Create Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map(room => {
              const memberCount = getMemberCount(room)
              const isOwner = room.owner_id === userProfile.id
              
              return (
                <Card key={room.id} className="p-8 group hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center">
                        <Users size={24} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{room.title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600">
                          {room.visibility === 'private' ? <Lock size={14} /> : <Globe size={14} />}
                          <span className="text-[0.65rem] font-black uppercase tracking-widest">{room.visibility}</span>
                        </div>
                      </div>
                    </div>
                    {isOwner && (
                      <button 
                        onClick={() => setDeleteId(room.id)}
                        className="p-2 rounded-xl text-slate-200 dark:text-slate-800 hover:text-rose-500 dark:hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {room.description && (
                    <p className="text-slate-500 dark:text-slate-500 font-bold text-xs mb-8 leading-relaxed line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800/50 mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(memberCount, 3) }).map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                            <User size={14} className="text-white" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[0.65rem] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tight">
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setEnteringId(room.id);
                        router.push(`/collaborations/${room.id}`);
                      }}
                      disabled={enteringId === room.id}
                      className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-[0.65rem] rounded-xl transition-all flex items-center gap-2 uppercase tracking-widest disabled:opacity-70"
                    >
                      {enteringId === room.id ? <Loader2 size={14} className="animate-spin" /> : null}
                      Enter
                      <ArrowRight size={14} strokeWidth={3} />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) ) : (
          /* Discover Tab Content */
          loadingDiscoverable ? (
            <div className="py-24 text-center">
              <Loader2 size={40} className="animate-spin mx-auto text-indigo-600 mb-4" />
              <p className="text-slate-400 font-bold uppercase text-[0.7rem] tracking-widest">Finding public rooms...</p>
            </div>
          ) : discoverableRooms.length === 0 ? (
            <div className="bg-slate-50/50 dark:bg-slate-900/10 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] p-24 text-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No public rooms found</h3>
              <p className="text-slate-400 dark:text-slate-600 font-bold text-sm max-w-xs mx-auto">
                Be the first to create a public study group!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {discoverableRooms.map(room => {
                const isMember = room.collaboration_members?.some((m: any) => m.user_id === userProfile.id)
                
                return (
                  <Card key={room.id} className="p-8 group hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all border-dashed">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center">
                        <Globe size={24} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{room.title}</h3>
                        <p className="text-[0.6rem] font-black text-indigo-500 uppercase tracking-widest">Public Room</p>
                      </div>
                    </div>
                    
                    <p className="text-slate-500 dark:text-slate-500 font-bold text-xs mb-8 leading-relaxed line-clamp-2">
                      {room.description || 'No description provided.'}
                    </p>

                    {isMember ? (
                      <button 
                        onClick={() => {
                          setEnteringId(room.id);
                          router.push(`/collaborations/${room.id}`);
                        }}
                        disabled={enteringId === room.id}
                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-[0.7rem] tracking-widest"
                      >
                        {enteringId === room.id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={3} />}
                        Enter Room
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={joiningId === room.id}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-[0.7rem] tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none"
                      >
                        {joiningId === room.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
                        Join Room
                      </button>
                    )}
                  </Card>
                )
              })}
            </div>
          )
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Room" maxWidth="500px">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-3">Room Title</label>
            <input 
              className="w-full px-6 py-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 focus:outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300"
              placeholder="e.g. CS 301 Study Group"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-3">Description</label>
            <textarea 
              className="w-full px-6 py-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 focus:outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300 resize-none"
              rows={3}
              placeholder="What's this room about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-3">Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'study_group', label: 'Study Group' },
                { value: 'project', label: 'Project' },
                { value: 'notes_sharing', label: 'Notes' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.value as any })}
                  className={`px-4 py-3 rounded-xl text-xs font-black capitalize transition-all border-2 ${
                    form.type === type.value 
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-600' 
                      : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-3">Visibility</label>
            <div className="flex gap-3">
              {[
                { value: 'private', icon: Lock, label: 'Private' }, 
                { value: 'public', icon: Globe, label: 'Public' }
              ].map(v => {
                const Icon = v.icon
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setForm({ ...form, visibility: v.value })}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border-2 ${
                      form.visibility === v.value 
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-600' 
                        : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100'
                    }`}
                  >
                    <Icon size={16} />
                    {v.label}
                  </button>
                )
              })}
            </div>
          </div>
          
          <button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            onClick={handleCreate}
            disabled={!form.title || saving}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={18} />
                Create Room
              </>
            )}
          </button>
        </div>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Delete Room" 
        message="This room and all its messages will be permanently deleted." 
      />
    </PageLayout>
  )
}
