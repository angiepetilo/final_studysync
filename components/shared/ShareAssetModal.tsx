'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  X, 
  CheckCircle2, 
  FileText, 
  File, 
  Search,
  Plus,
  Check
} from 'lucide-react'

interface ShareAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onShare: (type: 'task' | 'note' | 'file', id: string, metadata: any) => void
  userId: string
}

export default function ShareAssetModal({ isOpen, onClose, onShare, userId }: ShareAssetModalProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'task' | 'note' | 'file'>('task')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const fetchItems = async () => {
      setLoading(true)
      let query: any
      
      if (activeTab === 'task') {
        query = supabase.from('tasks').select('*').eq('user_id', userId).is('deleted_at', null)
      } else if (activeTab === 'note') {
        query = supabase.from('notes').select('*').eq('user_id', userId).is('deleted_at', null)
      } else {
        query = supabase.from('files').select('*').eq('user_id', userId)
      }

      const { data } = await query.order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }

    fetchItems()
  }, [isOpen, activeTab, userId, supabase])

  const filteredItems = items.filter(item => 
    (item.title || item.name || '').toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Share Resource</h2>
            <p className="text-sm text-slate-400 font-bold mt-1">Select an asset to share with the group.</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'task', label: 'Tasks', icon: CheckCircle2 },
            { id: 'note', label: 'Notes', icon: FileText },
            { id: 'file', label: 'Files', icon: File }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearch(''); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all border-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-8 py-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={`Search ${activeTab}s...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400">Fetching resources...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onShare(activeTab, item.id, {
                    title: item.title || item.name,
                    description: item.description || item.content?.substring(0, 50),
                    status: item.status,
                    priority: item.priority,
                    size: item.size,
                    mime_type: item.mime_type
                  })}
                  className="bg-white border border-slate-100 p-5 rounded-3xl text-left hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/[0.05] transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-4 right-4 text-indigo-100 group-hover:text-indigo-600 transition-colors">
                     <Plus size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1 pr-6 truncate">{item.title || item.name}</h3>
                  <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest truncate">
                    {activeTab === 'task' ? (item.priority || 'Medium Priority') : activeTab === 'file' ? `${Math.round(item.size / 1024)} KB` : 'Note'}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                 {activeTab === 'task' ? <CheckCircle2 size={32} /> : activeTab === 'note' ? <FileText size={32} /> : <File size={32} />}
              </div>
              <p className="text-lg font-black text-slate-900 mb-1">No {activeTab}s found</p>
              <p className="text-sm font-bold text-slate-400">Try searching for something else or creating a new {activeTab}.</p>
            </div>
          )}
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
