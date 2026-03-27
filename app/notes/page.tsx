'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/ConfirmDialog'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Plus, Search, Bell, Settings, Bold, Italic, 
  List, Link as LinkIcon, Image as ImageIcon, 
  Save, MoreVertical, Trash2, X, Check, Cloud,
  Clock, FileText
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import UserNav from '@/components/UserNav'

interface Note {
  id: string
  title: string
  content: string
  status: string
  course_id: string | null
  updated_at: string
}

interface Course {
  id: string
  title: string
  color: string
}

export default function NotesPage() {
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(true)
  const [editForm, setEditForm] = useState({ title: '', status: 'review', course_id: '' })
  const editorRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userProfile, setUserProfile] = useState<{ id: string, full_name: string, email: string }>({ id: '', full_name: '', email: '' })

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    setUserProfile({ id: user.id, full_name: profile?.full_name || '', email: user.email || '' })

    const [notesRes, coursesRes] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', user.id).is('deleted_at', null).order('updated_at', { ascending: false }),
      supabase.from('courses').select('id, title, color').eq('user_id', user.id),
    ])
    setNotes(notesRes.data || [])
    setCourses(coursesRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [supabase])

  const openNew = () => {
    setIsNew(true)
    setSelectedNote(null)
    setEditForm({ title: '', status: 'review', course_id: '' })
    if (editorRef.current) editorRef.current.innerHTML = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (note: Note) => {
    setIsNew(false)
    setSelectedNote(note)
    setEditForm({ title: note.title, status: note.status, course_id: note.course_id || '' })
    if (editorRef.current) editorRef.current.innerHTML = note.content || ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const content = editorRef.current?.innerHTML || ''
    const payload = { 
      title: editForm.title || 'Untitled Note', 
      content, 
      status: editForm.status, 
      course_id: editForm.course_id || null, 
      updated_at: new Date().toISOString() 
    }

    if (isNew) {
      await supabase.from('notes').insert({ ...payload, user_id: user.id })
    } else if (selectedNote) {
      await supabase.from('notes').update(payload).eq('id', selectedNote.id)
    }
    
    setSaving(false)
    if (isNew) openNew()
    fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('notes').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId)
    setDeleteId(null)
    if (selectedNote?.id === deleteId) openNew()
    fetchData()
  }

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }

  const getCourse = (id: string | null) => courses.find(c => c.id === id)

  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [notes, searchQuery])

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-[#F8FAFC] p-8 md:p-12 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notes Studio</h1>
        
        <div className="flex items-center gap-4">
          <NotificationBell userId={userProfile.id} className="w-12 h-12 rounded-2xl bg-white border border-slate-100" iconSize={20} />
          <UserNav user={userProfile} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* Left Column: Create Note */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-indigo-500/[0.03] border border-slate-100 space-y-10 sticky top-12">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
                {isNew ? 'Create Note' : 'Edit Note'}
              </h2>
              <p className="text-slate-400 font-bold leading-relaxed max-w-xs">
                Draft your thoughts and link them to your curriculum.
              </p>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Note Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Quantum Physics Introduction"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-8 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Course</label>
                  <select 
                    value={editForm.course_id}
                    onChange={(e) => setEditForm({...editForm, course_id: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 appearance-none focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer"
                  >
                    <option value="">None</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1 text-center block">Status</label>
                  <div className="flex p-1 bg-slate-50 rounded-2xl h-[52px]">
                    {(['review', 'done'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setEditForm({...editForm, status: s})}
                        className={`flex-1 rounded-xl text-xs font-black capitalize transition-all ${
                          editForm.status === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Content</label>
                <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100">
                  <div className="flex items-center gap-1 p-3 bg-slate-100/50 border-b border-slate-100">
                    <button onClick={() => execCmd('bold')} className="p-2 rounded-lg hover:bg-white text-slate-500 transition-all"><Bold size={16} /></button>
                    <button onClick={() => execCmd('italic')} className="p-2 rounded-lg hover:bg-white text-slate-500 transition-all"><Italic size={16} /></button>
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-2 rounded-lg hover:bg-white text-slate-500 transition-all"><List size={16} /></button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button onClick={() => { const url = prompt('Enter URL:'); if (url) execCmd('createLink', url) }} className="p-2 rounded-lg hover:bg-white text-slate-500 transition-all"><LinkIcon size={16} /></button>
                    <button className="p-2 rounded-lg hover:bg-white text-slate-500 transition-all"><ImageIcon size={16} /></button>
                  </div>
                  <div 
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Start typing your brilliance..."
                    className="min-h-[300px] p-8 text-sm font-medium text-slate-600 focus:outline-none rich-editor bg-white m-4 rounded-[1.5rem]"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving || !editForm.title}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-6 rounded-[1.75rem] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-4 mt-8"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} strokeWidth={3} />
                    <span>Save Note</span>
                  </>
                )}
              </button>
              
              {!isNew && (
                <button 
                  onClick={openNew}
                  className="w-full text-center text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
                >
                  Discard Changes & Start New
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notes Feed */}
        <div className="lg:col-span-7 space-y-10">
          <div className="flex items-center justify-between px-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your Notes</h3>
              <p className="text-sm font-bold text-slate-400 mt-1">Recent activity in all courses</p>
            </div>
            <button className="text-sm font-black text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-2">
              View All <Plus size={16} className="rotate-45" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredNotes.map((note) => {
              const course = getCourse(note.course_id)
              return (
                <div 
                  key={note.id}
                  onClick={() => openEdit(note)}
                  className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-transparent hover:border-indigo-100 transition-all group flex flex-col h-[280px] cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-6">
                    {course ? (
                      <span className="px-4 py-1.5 rounded-xl bg-indigo-50 text-[0.6rem] font-black text-indigo-600 uppercase tracking-widest">
                        {course.title}
                      </span>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                        <FileText size={18} />
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteId(note.id) }}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  <h4 className="text-xl font-black text-slate-900 mb-3 truncate group-hover:text-indigo-600 transition-colors">
                    {note.title}
                  </h4>
                  <div 
                    className="text-sm font-medium text-slate-400 line-clamp-3 mb-auto leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: note.content || 'Start writing...' }}
                  />

                  <div className="flex items-center gap-2 mt-6 text-[0.7rem] font-bold text-slate-300 group-hover:text-slate-500 transition-colors">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                  </div>
                </div>
              )
            })}

            {/* Empty Slot Card */}
            <div 
              onClick={openNew}
              className="bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center h-[280px] group cursor-pointer hover:bg-white hover:border-indigo-100 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-all mb-4">
                <Plus size={24} strokeWidth={3} />
              </div>
              <span className="text-sm font-black text-slate-400 group-hover:text-slate-900 transition-all uppercase tracking-widest">New Note Folder</span>
            </div>
          </div>

          <div className="flex justify-end pt-12">
            <div className="bg-indigo-50 rounded-[2rem] px-8 py-10 border border-indigo-100 flex items-center gap-10 max-w-md w-full">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Cloud size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-1">Cloud Sync Active</h4>
                <p className="text-[0.7rem] font-bold text-slate-400 leading-relaxed">
                  Your notes are automatically backed up to the StudSync cloud.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        message="This note will be moved to trash. You can recover it from Settings."
      />

      <style jsx global>{`
        .rich-editor:empty:before {
          content: attr(data-placeholder);
          color: #cbd5e1;
        }
        .rich-editor p { margin-bottom: 0.5rem; }
        .rich-editor ul { list-style: disc; margin-left: 1.5rem; margin-bottom: 0.5rem; }
        .rich-editor ol { list-style: decimal; margin-left: 1.5rem; margin-bottom: 0.5rem; }
      `}</style>
    </div>
  )
}
