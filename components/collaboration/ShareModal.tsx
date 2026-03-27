'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCollaborations, sendCollaborationMessage } from '@/lib/actions/student'
import Modal from '@/components/shared/Modal'
import { Button } from '@/components/ui/button'
import { Search, Users, MessageSquare, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  itemType: 'note' | 'task'
  itemData: {
    id: string
    title: string
    preview?: string
    dueDate?: string
    priority?: string
    status?: string
  }
}

export function ShareModal({
  isOpen,
  onClose,
  userId,
  userName,
  itemType,
  itemData
}: ShareModalProps) {
  const [loading, setLoading] = useState(false)
  const [collaborations, setCollaborations] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadCollaborations()
    }
  }, [isOpen])

  async function loadCollaborations() {
    setLoading(true)
    const data = await getCollaborations(userId)
    setCollaborations(data)
    setLoading(false)
  }

  const filteredCollaborations = collaborations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleShare = async () => {
    if (!selectedCollabId) return
    setLoading(true)

    try {
      const messageType = itemType === 'note' ? 'shared_note' : 'shared_task'
      const metadata = itemType === 'note' 
        ? {
            note_id: itemData.id,
            note_title: itemData.title,
            note_preview: itemData.preview?.substring(0, 100) || '',
            shared_by: userName
          }
        : {
            task_id: itemData.id,
            task_title: itemData.title,
            due_date: itemData.dueDate,
            priority: itemData.priority,
            status: itemData.status,
            shared_by: userName
          }

      await sendCollaborationMessage({
        collaborationId: selectedCollabId,
        userId,
        content: message || `Shared a ${itemType}: ${itemData.title}`,
        messageType,
        metadata
      })

      toast.success(`Successfully shared to collaboration!`)
      onClose()
      setMessage('')
      setSelectedCollabId(null)
    } catch (error) {
      console.error('Share failed:', error)
      toast.error('Failed to share. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share ${itemType === 'note' ? 'Note' : 'Task'}`}>
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search collaborations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Collab List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filteredCollaborations.length > 0 ? (
            filteredCollaborations.map((collab) => (
              <button
                key={collab.id}
                onClick={() => setSelectedCollabId(collab.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                  selectedCollabId === collab.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-500/10"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  selectedCollabId === collab.id ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  <Users size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{collab.title}</p>
                  <p className="text-[0.7rem] text-slate-400 uppercase font-black tracking-widest">{collab.type.replace('_', ' ')}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Users className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No collaborations found</p>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest px-1">Optional Message</label>
          <textarea
            placeholder="Add a comment..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
          />
        </div>

        {/* Action */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-[0.7rem]">
            Cancel
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={!selectedCollabId || loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold uppercase tracking-widest text-[0.7rem] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Share to Collaboration
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
