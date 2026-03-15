'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Send, Users, User, Lock, Globe, UserPlus, Paperclip, Plus, FileText, CheckCircle2, File, ChevronRight, Check } from 'lucide-react'
import ShareAssetModal from '@/components/ShareAssetModal'

interface Message {
  id: string
  user_id: string
  message: string
  created_at: string
  shared_item_type?: 'task' | 'note' | 'file' | null
  shared_item_id?: string | null
  metadata?: any | null
  profiles?: { full_name: string }
}

interface Room {
  id: string
  title: string
  description: string
  visibility: string
  owner_id: string
}

interface Member {
  id: string
  user_id: string
  role: string
  profiles?: { full_name: string; email: string }
}

export default function CollaborationRoomPage() {
  const supabase = createClient()
  const params = useParams()
  const roomId = params.id as string
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState('')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      setUserName(profile?.full_name || user.email || 'Unknown')

      const [roomRes, membersRes, messagesRes] = await Promise.all([
        supabase.from('collaborations').select('*').eq('id', roomId).single(),
        supabase.from('collaboration_members').select('*, profiles!user_id(full_name, email)').eq('collaboration_id', roomId),
        supabase.from('chat_messages').select('*, profiles!user_id(full_name)').eq('collaboration_id', roomId).order('created_at', { ascending: true }),
      ])

      setRoom(roomRes.data)
      setMembers(membersRes.data || [])
      setMessages(messagesRes.data || [])
      setLoading(false)
    }

    init()

    // Real-time chat subscription
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `collaboration_id=eq.${roomId}`,
      }, async (payload: any) => {
        // When a new message arrives, we need the profile data too
        const { data: msgWithProfile } = await supabase
          .from('chat_messages')
          .select('*, profiles!user_id(full_name)')
          .eq('id', payload.new.id)
          .single()
        
        if (msgWithProfile) {
          setMessages(prev => {
            // Prevent duplicates
            if (prev.some(m => m.id === msgWithProfile.id)) return prev
            return [...prev, msgWithProfile]
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (sharedData?: { type: string, id: string, metadata: any }) => {
    if (!newMessage.trim() && !sharedData) return
    
    await supabase.from('chat_messages').insert({
      collaboration_id: roomId,
      user_id: userId,
      message: newMessage.trim() || (sharedData ? `Shared a ${sharedData.type}: ${sharedData.metadata.title}` : ''),
      shared_item_type: sharedData?.type || null,
      shared_item_id: sharedData?.id || null,
      metadata: sharedData?.metadata || {}
    })
    
    setNewMessage('')
    setIsShareModalOpen(false)

    // Trigger notification to other members
    try {
      await fetch('/api/collaborations/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          senderId: userId,
          senderName: userName,
          roomTitle: room?.title,
        }),
      })
    } catch (e) { /* silent fail for notification */ }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviteStatus('Sending...')
    try {
      const res = await fetch('/api/collaborations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          roomId,
          inviterName: userName,
          roomTitle: room?.title,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setInviteStatus('Invited successfully!')
        setInviteEmail('')
        // Refresh members
        const { data: m } = await supabase.from('collaboration_members').select('*, profiles!user_id(full_name, email)').eq('collaboration_id', roomId)
        setMembers(m || [])
      } else {
        setInviteStatus(data.error || 'Failed to invite')
      }
    } catch {
      setInviteStatus('Network error')
    }
    setTimeout(() => setInviteStatus(''), 3000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
  if (!room) return <div className="page-container"><p>Room not found.</p></div>

  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <Link href="/collaborations" className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{room.title}</h1>
                <div className={`px-2 py-0.5 rounded-lg text-[0.6rem] font-black uppercase tracking-widest ${room.visibility === 'private' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                   {room.visibility}
                </div>
              </div>
              <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <Users size={12} className="text-indigo-600" />
                {members.length} Active Member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex -space-x-3 mr-2">
                {members.slice(0, 3).map(m => (
                  <div key={m.id} className="w-9 h-9 rounded-xl border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shadow-sm overflow-hidden">
                    {m.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                ))}
                {members.length > 3 && (
                  <div className="w-9 h-9 rounded-xl border-4 border-white bg-indigo-600 flex items-center justify-center text-[0.65rem] font-black text-white shadow-md">
                    +{members.length - 3}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-400 mb-6 animate-pulse">
                 <Send size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Begin the sync</h3>
              <p className="text-sm font-bold text-slate-400 max-w-xs">Start a conversation or share a resource with your collaborators.</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isOwn = msg.user_id === userId
              const showAvatar = !isOwn && (i === 0 || messages[i-1].user_id !== msg.user_id)
              
              return (
                <div key={msg.id} className={`flex gap-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && (
                    <div className="w-10 flex flex-col justify-end pb-1">
                      {showAvatar && (
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm border border-white">
                          {msg.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[80%] sm:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {showAvatar && (
                      <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        {msg.profiles?.full_name || 'Member'}
                      </span>
                    )}

                    <div className={`p-5 rounded-[2rem] shadow-sm relative group transition-all ${isOwn ? 'bg-indigo-600 text-white rounded-tr-md shadow-indigo-200' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-md'}`}>
                      {msg.shared_item_type ? (
                        <div className={`space-y-4 ${isOwn ? 'text-indigo-50' : 'text-slate-500'}`}>
                          <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${isOwn ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOwn ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>
                               {msg.shared_item_type === 'task' ? <CheckCircle2 size={24} /> : msg.shared_item_type === 'note' ? <FileText size={24} /> : <File size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>{msg.shared_item_type}</p>
                               <h4 className={`text-base font-black truncate ${isOwn ? 'text-white' : 'text-slate-900'}`}>{msg.metadata?.title}</h4>
                               <p className="text-[0.65rem] font-bold opacity-80 mt-1 line-clamp-1">{msg.metadata?.description}</p>
                            </div>
                            <button className={`p-2 rounded-lg transition-colors ${isOwn ? 'hover:bg-white/10 text-white' : 'hover:bg-white text-indigo-600 shadow-sm'}`}>
                               <ChevronRight size={18} />
                            </button>
                          </div>
                          <p className="text-sm px-1 italic opacity-90">{msg.message.split(': ')[1] || msg.message}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold leading-relaxed">{msg.message}</p>
                      )}
                    </div>
                    
                    <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-tighter mt-2 px-2 flex items-center gap-2">
                       {format(new Date(msg.created_at), 'h:mm a')}
                       {isOwn && <Check size={10} className="text-indigo-500" />}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-8 bg-white/50 backdrop-blur-md border-t border-slate-50">
          <div className="max-w-4xl mx-auto flex items-end gap-4">
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="w-14 h-14 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/[0.05] transition-all group shrink-0"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <div className="flex-1 relative group">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message your team..."
                className="w-full bg-white border border-slate-100 rounded-[2rem] py-4 px-6 pr-16 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all shadow-sm placeholder:text-slate-300 resize-none min-h-[56px] max-h-32 custom-scrollbar"
                rows={1}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!newMessage.trim()}
                className="absolute right-2 bottom-2 w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-30 disabled:grayscale transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Sidebar (Optimized) */}
      <div className="hidden lg:flex w-80 border-l border-slate-50 bg-white flex-col p-10 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
             <Users size={20} />
          </div>
          <h2 className="text-xl font-black text-slate-900">Sync Squad</h2>
        </div>

        <div className="space-y-6 flex-1">
          <div className="space-y-4">
            <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Members ({members.length})</h3>
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="group p-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border border-white ${member.role === 'owner' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                       {member.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-none mb-1">{member.profiles?.full_name || 'Member'}</p>
                      <p className="text-[0.65rem] font-bold text-indigo-500 uppercase tracking-widest">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50">
             <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.2em] px-1 mb-4">Actions</h3>
             <div className="space-y-3">
                <div className="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100/30 group">
                   <p className="text-xs font-black text-indigo-600 mb-2 flex items-center gap-2">
                     <UserPlus size={14} /> Invite New Member
                   </p>
                   <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                        placeholder="email@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <button 
                        onClick={handleInvite}
                        className="p-2 rounded-xl bg-indigo-600 text-white shadow-md active:scale-95 transition-all"
                      >
                         <Plus size={16} />
                      </button>
                   </div>
                   {inviteStatus && <p className="text-[0.65rem] font-bold mt-2 text-indigo-500">{inviteStatus}</p>}
                </div>
             </div>
          </div>
        </div>

        {room.description && (
          <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
             <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2">Project Brief</h3>
             <p className="text-xs font-bold text-slate-500 leading-relaxed italic">&quot;{room.description}&quot;</p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareAssetModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={(type, id, metadata) => sendMessage({ type, id, metadata })}
        userId={userId}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>

    </div>
  )
}
