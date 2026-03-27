'use client'
import NextImage from 'next/image'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Send, Users, MessageSquare, Shield,
  ArrowLeft, MoreVertical, Hash, Info, Video,
  User, Paperclip, Smile, Image,
  File, Download, ExternalLink, Clipboard, FileText, CheckCircle, X,
  Link as LinkIcon, Plus, Bell, Phone, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getCollaborationMessages, sendCollaborationMessage, shareResourceToCollaboration, getFiles, getNotes, getTasks, addCollaborationMember } from '@/lib/actions/student'
import EmojiPicker from 'emoji-picker-react'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import PageLayout from '@/components/layout/PageLayout'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useData } from '@/context/DataContext'

// Resource Picker Modal Component
function ResourcePicker({
  isOpen,
  onClose,
  onSelect,
  userId,
  sharingResourceId
}: {
  isOpen: boolean,
  onClose: () => void,
  onSelect: (type: 'file' | 'note' | 'task', item: any) => void,
  userId: string,
  sharingResourceId: string | null
}) {
  const [tab, setTab] = useState<'file' | 'note' | 'task'>('file')
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['picker', tab, userId],
    queryFn: () => {
      if (tab === 'file') return getFiles(userId)
      if (tab === 'note') return getNotes(userId)
      return getTasks(userId)
    },
    enabled: isOpen
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-10 pb-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Add Resource</h2>
            <p className="text-[0.7rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select an item to share with the room</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all"><X size={20} /></button>
        </div>

        <div className="flex p-4 bg-slate-50 dark:bg-slate-800/50 gap-2 shrink-0">
          {(['file', 'note', 'task'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-4 rounded-2xl font-black text-[0.7rem] uppercase tracking-widest transition-all",
                tab === t ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {t}s
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No {tab}s found</div>
          ) : items.map((item: any) => (
            <div
              key={item.id}
              onClick={() => !sharingResourceId && onSelect(tab, item)}
              className={cn(
                "p-6 rounded-[2rem] border-2 border-slate-50 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 bg-white dark:bg-slate-900 transition-all cursor-pointer flex items-center justify-between group",
                sharingResourceId === item.id && "opacity-50 cursor-wait"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {tab === 'file' ? <File size={20} /> : tab === 'note' ? <FileText size={20} /> : <CheckCircle size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">{item.title || item.name}</p>
                  <p className="text-[0.6rem] font-bold text-slate-400 uppercase mt-0.5">{tab === 'file' ? `${Math.round(item.size / 1024)} KB` : tab === 'note' ? 'Rich Text' : item.priority || 'Medium priority'}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all">
                {sharingResourceId === item.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} strokeWidth={3} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface Message {
  id: string
  content: string
  user_id: string
  created_at: string
  file_url?: string
  file_name?: string
  file_type?: string
  message_type: 'text' | 'image' | 'file' | 'shared_note' | 'shared_task'
  metadata?: any
  profiles?: {
    full_name: string
    email: string
    avatar_url?: string
  }
}

interface Collaboration {
  id: string
  title: string
  description: string
  collaboration_members?: Array<{
    user_id: string
    role: string
    profiles?: {
      full_name: string
      email: string
      avatar_url?: string
    }
  }>
}

interface CollaborationResource {
  id: string
  collaboration_id: string
  resource_type: 'file' | 'note' | 'task' | 'url'
  resource_id?: string
  title: string
  description?: string
  url?: string
  file_size?: string
  shared_by: string
  created_at: string
}

interface Props {
  collaboration: Collaboration
  initialMessages: Message[]
  userProfile: { id: string, full_name: string, email: string }
}

// Simple debounce helper to avoid external dependency
function debounce(fn: Function, ms: number) {
  let timeoutId: any
  const debounced = (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId)
  }
  return debounced
}


export default function CollaborationRoomClient({
  collaboration,
  initialMessages,
  userProfile
}: Props) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const supabase = createClient()
  const { setHasUnreadMessages } = useData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({})
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showResourcePicker, setShowResourcePicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sharingResourceId, setSharingResourceId] = useState<string | null>(null)
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)

  const debouncedInvalidate = useMemo(() => debounce(() => {
    queryClient.invalidateQueries({ queryKey: ['messages', collaboration.id] })
  }, 100), [queryClient, collaboration.id])

  // Fetch messages with React Query
  const { data: messages = initialMessages } = useQuery({
    queryKey: ['messages', collaboration.id],
    queryFn: () => getCollaborationMessages(collaboration.id),
    initialData: initialMessages,
    staleTime: 30000,
  })

  const { data: resources = [] } = useQuery({
    queryKey: ['resources', collaboration.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaboration_resources')
        .select('*')
        .eq('collaboration_id', collaboration.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CollaborationResource[]
    },
    staleTime: 60000,
  })

  const members = collaboration.collaboration_members || []
  const onlineCount = Object.keys(onlineUsers).length || 1

  const sharedFiles = messages.filter((m: any) => m.message_type === 'file' || m.message_type === 'image')

  const isUserOnline = (userId: string) => {
    return !!onlineUsers[userId]
  }

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [messages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const channel = supabase.channel(`room:${collaboration.id}`, {
      config: {
        presence: {
          key: userProfile.id,
        },
      },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineUsers({ ...state })
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload.user_id !== userProfile.id) {
          setTypingUser(payload.name)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000)
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'collaboration_messages',
        filter: `collaboration_id=eq.${collaboration.id}`
      }, (payload: any) => {
        if (payload.new.user_id !== userProfile.id) {
          debouncedInvalidate()
        }
      })
      .subscribe(async (status: any) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userProfile.id,
            full_name: userProfile.full_name,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      debouncedInvalidate.cancel()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [collaboration.id, supabase, userProfile, queryClient])

  // Update last_read_at and clear global unread dot when entering the room
  useEffect(() => {
    if (!collaboration.id || !userProfile.id) return

    const updateReadStatus = async () => {
      await supabase
        .from('collaboration_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('collaboration_id', collaboration.id)
        .eq('user_id', userProfile.id)
      
      setHasUnreadMessages(false)
    }

    updateReadStatus()
  }, [collaboration.id, userProfile.id, supabase, setHasUnreadMessages])

  const broadcastTyping = () => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userProfile.id,
        name: userProfile.full_name
      }
    })
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    // 1. Sanitize and validate
    const trimmedMessage = newMessage.trim()
    if (!trimmedMessage || sending) return
    
    if (typeof trimmedMessage !== 'string') {
      console.error('Content is not a string')
      return
    }

    setSending(true)

    try {
      const { success, error } = await sendCollaborationMessage({
        collaborationId: collaboration.id,
        userId: userProfile.id,
        content: trimmedMessage,
        messageType: 'text'
      })

      if (success) {
        setNewMessage('')
      } else {
        toast.error(error === 'Failed to fetch' 
          ? 'Connection lost. Check your internet connection.' 
          : 'Message failed to send. Please try again.')
      }
    } catch (error) {
      console.error('Send error:', error)
      toast.error('An unexpected error occurred while sending.')
    } finally {
      setSending(false)
    }
  }

  const handleShareResource = async (type: 'file' | 'note' | 'task', item: any) => {
    setSharingResourceId(item.id)
    setSending(true)
    try {
      const result = await shareResourceToCollaboration({
        collaborationId: collaboration.id,
        userId: userProfile.id,
        resourceType: type,
        resourceId: item.id,
        title: item.title || item.name,
        description: type === 'note' ? item.content : type === 'task' ? (item.due_date || undefined) : undefined,
        url: type === 'file' ? (item.storage_path || undefined) : undefined,
        fileSize: type === 'file' ? `${Math.round(item.size / 1024)} KB` : undefined
      })

      if (result.success) {
        setShowResourcePicker(false)
        queryClient.invalidateQueries({ queryKey: ['messages', collaboration.id] })
        queryClient.invalidateQueries({ queryKey: ['resources', collaboration.id] })
      }
    } finally {
      setSharingResourceId(null)
      setSending(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)

    try {
      const result = await addCollaborationMember(collaboration.id, inviteEmail.trim())
      if (result.success) {
        setAddMemberModalOpen(false)
        setInviteEmail('')
        queryClient.invalidateQueries({ queryKey: ['messages', collaboration.id] })
        // We need to reload to get updated member list and profiles
        router.refresh()
      } else {
        setInviteError(result.error || 'Failed to add member')
      }
    } catch (err) {
      setInviteError('An unexpected error occurred')
    } finally {
      setInviting(false)
    }
  }

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `collaborations/${collaboration.id}/${Date.now()}_${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('collaboration-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('collaboration-files')
        .getPublicUrl(filePath)

      const isImage = file.type.startsWith('image/')

      // 1. Send collaboration message
      await sendCollaborationMessage({
        collaborationId: collaboration.id,
        userId: userProfile.id,
        fileUrl: publicUrl,
        fileName: file.name,
        fileType: file.type,
        messageType: isImage ? 'image' : 'file',
        content: `Shared a ${isImage ? 'photo' : 'file'}`
      })

      // 2. Mirror to public.files (Unified Vault)
      await supabase.from('files').insert({
        user_id: userProfile.id,
        name: file.name,
        storage_path: publicUrl, // Using URL as path for mirrored files
        size: file.size,
        mime_type: file.type,
        description: `Shared in ${collaboration.title}`,
        course_id: null
      })

      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['messages', collaboration.id] })
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload file. Make sure the bucket exists and is public.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <PageLayout className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] overflow-hidden bg-slate-50 dark:bg-slate-950 p-0 md:p-6 lg:p-8">
      <ResourcePicker
        isOpen={showResourcePicker}
        onClose={() => setShowResourcePicker(false)}
        onSelect={handleShareResource}
        userId={userProfile.id}
        sharingResourceId={sharingResourceId}
      />

      {/* Add Member Modal */}
      {addMemberModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden p-10">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Invite Student</h2>
            <p className="text-[0.7rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">Enter the email of the student you want to add</p>

            <div className="space-y-6">
              <div>
                <input
                  type="email"
                  className="w-full px-6 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm font-bold"
                  placeholder="student@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInviteMember()}
                />
                {inviteError && <p className="text-rose-500 text-[0.6rem] font-bold uppercase mt-2 ml-2">{inviteError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAddMemberModalOpen(false)}
                  className="flex-1 py-4 rounded-xl font-black text-[0.7rem] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim() || inviting}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black text-[0.7rem] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  {inviting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden rounded-none md:rounded-[3.5rem] bg-white dark:bg-slate-900 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800 relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUploadFile}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />

        {/* Left: Chat Area (70%) */}
        <div className="flex-[7] flex flex-col min-w-0 relative border-r border-slate-50 dark:border-slate-800/50">

          {/* Top Header */}
          <header className="px-10 py-8 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-20 border-b border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-6">
              <Link href="/collaborations" className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <ArrowLeft size={20} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <Hash size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                      Collaboration Hub
                    </h1>
                    <p className="text-[0.7rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {collaboration.title} • Room {collaboration.id.substring(0, 4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-400"><MoreVertical size={20} /></button>
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-white dark:bg-slate-900">
            <div className="flex justify-center mb-12">
              <span className="px-5 py-1.5 bg-slate-50 dark:bg-slate-800 text-[0.6rem] font-black text-slate-400 dark:text-slate-500 rounded-full uppercase tracking-[0.2em] border border-slate-100 dark:border-slate-700">Today</span>
            </div>

            {messages.map((msg: Message, i: number) => {
              const isOwn = msg.user_id === userProfile.id
              return (
                <div key={msg.id} className={cn("flex items-start gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500", isOwn ? "flex-row-reverse" : "flex-row")}>
                  {/* Avatar */}
                  {!isOwn && (
                    <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-black relative overflow-hidden bg-slate-100 dark:bg-slate-800 text-slate-400">
                      {msg.profiles?.avatar_url ? (
                        <NextImage 
                          src={msg.profiles.avatar_url} 
                          alt="" 
                          width={48}
                          height={48}
                          className="w-full h-full object-cover" 
                          unoptimized
                        />
                      ) : (
                        msg.profiles?.full_name?.charAt(0) || 'U'
                      )}
                      {isUserOnline(msg.user_id) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />}
                    </div>
                  )}

                  <div className={cn("flex flex-col gap-2 max-w-[70%]", isOwn ? "items-end" : "items-start")}>
                    {!isOwn && (
                      <div className="flex items-center gap-3 px-1">
                        <span className="text-[0.7rem] font-black text-slate-900 dark:text-white">{msg.profiles?.full_name}</span>
                        <span className="text-[0.6rem] font-bold text-slate-300 dark:text-slate-700">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    {isOwn && (
                      <div className="flex items-center gap-3 px-1">
                        <span className="text-[0.6rem] font-bold text-slate-300 dark:text-slate-700">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[0.7rem] font-black text-slate-900 dark:text-white uppercase tracking-widest">You</span>
                      </div>
                    )}

                    <div className={cn(
                      "relative py-5 px-8 rounded-[2.5rem] text-sm font-bold leading-relaxed shadow-sm transition-all",
                      isOwn
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-50 dark:shadow-none"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700/50"
                    )}>
                      {msg.message_type === 'image' && msg.file_url ? (
                        <div className="space-y-4">
                          <img src={msg.file_url} alt={msg.file_name} className="rounded-[2rem] max-h-96 w-full object-cover shadow-xl border border-white/20" />
                          {msg.content && <div>{msg.content}</div>}
                        </div>
                      ) : msg.message_type === 'file' && msg.file_url ? (
                        <div className="min-w-[280px] bg-black/5 dark:bg-white/5 p-6 rounded-[2rem] border border-white/10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white">
                              <File size={24} />
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-sm font-black truncate">{msg.file_name}</p>
                              <p className="text-[0.6rem] font-bold opacity-60 uppercase">{msg.file_type?.split('/')[1] || 'FILE'} • {Math.round((msg.metadata?.size || 0) / 1024)} KB</p>
                            </div>
                            <a href={msg.file_url} download className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><Download size={20} /></a>
                          </div>
                        </div>
                      ) : msg.message_type === 'shared_note' ? (
                        <div className="min-w-[320px] space-y-4">
                          <div className={cn("p-6 rounded-[2rem] border-2", isOwn ? "bg-white/10 border-white/10" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800")}>
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white"><FileText size={24} /></div>
                              <div className="flex-1 truncate">
                                <h4 className={cn("text-[0.6rem] font-black uppercase tracking-widest mb-0.5", isOwn ? "text-indigo-200" : "text-slate-400")}>Shared Note</h4>
                                <p className={cn("text-base font-black truncate", isOwn ? "text-white" : "text-slate-900 dark:text-white")}>{msg.metadata?.note_title}</p>
                              </div>
                            </div>
                            <p className={cn("text-xs font-medium italic line-clamp-2 mb-6", isOwn ? "text-indigo-100/60" : "text-slate-500")}>&quot;{msg.metadata?.note_preview}...&quot;</p>
                            <Link href={`/notes?id=${msg.metadata?.note_id}`} className={cn("flex items-center justify-center w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all", isOwn ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100")}>Open Note →</Link>
                          </div>
                          {msg.content && <p>{msg.content}</p>}
                        </div>
                      ) : msg.message_type === 'shared_task' ? (
                        <div className="min-w-[320px] space-y-4">
                          <div className={cn("p-6 rounded-[2rem] border-2", isOwn ? "bg-white/10 border-white/10" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800")}>
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white"><CheckCircle size={24} /></div>
                              <div className="flex-1 truncate">
                                <h4 className={cn("text-[0.6rem] font-black uppercase tracking-widest mb-0.5", isOwn ? "text-indigo-200" : "text-slate-400")}>Shared Task</h4>
                                <p className={cn("text-base font-black truncate", isOwn ? "text-white" : "text-slate-900 dark:text-white")}>{msg.metadata?.task_title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 mb-8">
                              <div className="flex flex-col gap-1">
                                <span className={cn("text-[0.5rem] font-black uppercase tracking-widest", isOwn ? "text-indigo-200/60" : "text-slate-400")}>Due Date</span>
                                <span className="text-sm font-black">{msg.metadata?.due_date || 'No date'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className={cn("text-[0.5rem] font-black uppercase tracking-widest", isOwn ? "text-indigo-200/60" : "text-slate-400")}>Priority</span>
                                <span className={cn("text-sm font-black capitalize", msg.metadata?.priority === 'high' ? "text-rose-400" : "text-emerald-400")}>{msg.metadata?.priority}</span>
                              </div>
                            </div>
                            <Link href={`/tasks?id=${msg.metadata?.task_id}`} className={cn("flex items-center justify-center w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all", isOwn ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100")}>View Task →</Link>
                          </div>
                          {msg.content && <p>{msg.content}</p>}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {typingUser && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
                <div className="flex space-x-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{typingUser} is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input Bar */}
          <div className="p-10 shrink-0">
            <div className="max-w-5xl mx-auto flex items-center gap-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner">
              <button onClick={() => setShowResourcePicker(!showResourcePicker)} className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95 shadow-sm">
                <Plus size={24} strokeWidth={3} />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    broadcastTyping()
                  }}
                  className="w-full bg-transparent border-none py-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e as any)}
                />
                <button onClick={() => setShowEmoji(!showEmoji)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  <Smile size={24} strokeWidth={2.5} />
                </button>
                {showEmoji && (
                  <div className="absolute bottom-full right-0 mb-6 z-50">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => { 
                        setNewMessage(prev => prev + emojiData.emoji)
                        setShowEmoji(false) 
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending || uploading}
                className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-100 transition-all active:scale-90"
              >
                {sending || uploading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Send size={20} strokeWidth={3} className="translate-x-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Resources & Members (30%) */}
        <aside className="flex-[3] flex flex-col min-w-0 bg-[#FBFBFE] dark:bg-slate-950/20">

          {/* Shared Resources */}
          <div className="p-10 border-b border-slate-50 dark:border-slate-800/30 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[0.7rem] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                Shared Resources
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              </h2>
              <LinkIcon size={18} className="text-slate-300" />
            </div>

            <div className="space-y-6">
              {resources.map((res: CollaborationResource) => (
                <Card key={res.id} className="p-5 hover:border-indigo-100 dark:hover:border-indigo-900 border-2 bg-white dark:bg-slate-900 transition-all cursor-pointer group/res">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                      res.resource_type === 'file' ? "bg-indigo-50 text-indigo-600" :
                        res.resource_type === 'note' ? "bg-purple-50 text-purple-600" :
                          res.resource_type === 'task' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
                    )}>
                      {res.resource_type === 'file' ? <File size={20} /> :
                        res.resource_type === 'note' ? <FileText size={20} /> :
                          res.resource_type === 'task' ? <CheckCircle size={20} /> : <ExternalLink size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate group-hover/res:text-indigo-600 transition-colors">{res.title}</h4>
                      <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {res.file_size || 'Shared Resource'} • {formatDistanceToNow(new Date(res.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}

              <button className="w-full py-5 rounded-[2rem] border-4 border-dashed border-slate-100 dark:border-slate-800 hover:border-indigo-100 hover:bg-white dark:hover:bg-slate-900 text-slate-300 dark:text-slate-700 hover:text-indigo-600 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                <Plus size={18} strokeWidth={3} />
                Add Resource
              </button>
            </div>
          </div>

          {/* Room Members */}
          <div className="p-10 flex flex-col bg-white/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[0.7rem] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                Room Members
                <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-[0.6rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400">{members.length}</span>
              </h2>
              <button
                onClick={() => setAddMemberModalOpen(true)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-300 hover:text-indigo-600 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-6 mb-10">
              {members.map((member: any) => (
                <div key={member.user_id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center relative overflow-hidden shadow-sm">
                      {member.profiles?.avatar_url ? (
                        <img src={member.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : <User size={18} className="text-slate-300" />}
                      {isUserOnline(member.user_id) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        {member.profiles?.full_name}
                        {member.user_id === userProfile.id && <span className="text-[0.55rem] font-black text-indigo-500 uppercase">You</span>}
                      </p>
                      <div className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {isUserOnline(member.user_id) ? (
                          <><div className="w-1 h-1 rounded-full bg-emerald-500" /> Online</>
                        ) : <><div className="w-1 h-1 rounded-full bg-slate-300" /> Offline</>}
                      </div>
                    </div>
                  </div>
                  <MoreVertical size={16} className="text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
              ))}
            </div>

            <button className="text-[0.7rem] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] hover:underline transition-all text-center">View All Members</button>
          </div>
        </aside>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
        .rich-editor:empty:before { content: attr(data-placeholder); color: #cbd5e1; }
      ` }} />
    </PageLayout>
  )
}

