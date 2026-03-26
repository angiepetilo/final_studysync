'use client'

import React, { useEffect, useState, useRef, useMemo, memo } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Plus, Search, Bell, Settings, Bold, Italic, 
  List, Link as LinkIcon, Image as ImageIcon, 
  Save, MoreVertical, Trash2, X, Check, Cloud,
  Clock, FileText, ChevronDown, Send
} from 'lucide-react'

import PageLayout from '@/components/layout/PageLayout'
import { useData } from '@/context/DataContext'
import { NotesSkeleton } from '@/components/shared/LoadingSkeleton'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'

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

const NoteCard = memo(({ note, course, onEdit, onDelete }: { 
  note: Note, 
  course?: Course, 
  onEdit: (n: Note) => void, 
  onDelete: (id: string) => void 
}) => (
  <Card 
    className="h-[280px] cursor-pointer flex flex-col group p-8"
  >
    <div onClick={() => onEdit(note)} className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        {course ? (
          <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-[0.6rem] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            {course.title}
          </span>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
            <FileText size={18} />
          </div>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
            className="text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {note.title}
      </h4>
      <div 
        className="text-sm font-medium text-slate-400 dark:text-slate-500 line-clamp-3 mb-auto leading-relaxed"
        dangerouslySetInnerHTML={{ __html: note.content || 'Start writing...' }}
      />

      <div className="flex items-center gap-2 mt-6 text-[0.7rem] font-bold text-slate-300 dark:text-slate-700 group-hover:text-slate-500 dark:group-hover:text-slate-500 transition-colors">
        <Clock size={12} />
        {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
      </div>
    </div>
  </Card>
))

NoteCard.displayName = 'NoteCard'

export default function NotesPage() {
  const supabase = createClient()
  const { user, notes: globalNotes, courses: globalCourses, refreshData, loading: contextLoading } = useData()
  
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(true)
  const [editForm, setEditForm] = useState({ title: '', status: 'review', course_id: '' })
  const editorRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')


  const notes = globalNotes
  const courses = globalCourses

  const openNew = () => {
    setIsNew(true)
    setSelectedNote(null)
    setEditForm({ title: '', status: 'review', course_id: '' })
    if (editorRef.current) editorRef.current.innerHTML = ''
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  const openEdit = (note: Note) => {
    setIsNew(false)
    setSelectedNote(note)
    setEditForm({ title: note.title, status: note.status, course_id: note.course_id || '' })
    if (editorRef.current) editorRef.current.innerHTML = note.content || ''
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  const handleSave = async () => {
    setSaving(true)
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
    
    await refreshData()
    setSaving(false)
    if (isNew) openNew()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('notes').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId)
    setDeleteId(null)
    if (selectedNote?.id === deleteId) openNew()
    await refreshData()
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

  if (contextLoading) {
    return <NotesSkeleton />
  }

  return (
    <PageLayout>
      <PageHeader 
        title="Notes Studio"
        subtitle="Capture thoughts, concepts, and breakthroughs."
        action={
          <div className="relative">
            <input 
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Create Note */}
        <div className="lg:col-span-12 xl:col-span-5">
          <Card className="p-8 md:p-12 sticky top-24">
            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                {isNew ? 'Create Note' : 'Edit Note'}
              </h2>
              <p className="text-slate-400 dark:text-slate-500 font-bold leading-relaxed max-w-xs">
                Draft your thoughts and link them to your curriculum.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Note Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Quantum Physics Introduction"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Course</label>
                  <div className="relative">
                    <select 
                      value={editForm.course_id}
                      onChange={(e) => setEditForm({...editForm, course_id: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white appearance-none focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                    >
                      <option value="">None</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 text-center block">Status</label>
                  <div className="flex p-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl h-[48px]">
                    {(['review', 'done'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setEditForm({...editForm, status: s})}
                        className={`flex-1 rounded-lg text-xs font-black capitalize transition-all ${
                          editForm.status === s ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Content</label>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1 p-2 bg-slate-100/50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                    <button onClick={() => execCmd('bold')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-all"><Bold size={14} /></button>
                    <button onClick={() => execCmd('italic')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-all"><Italic size={14} /></button>
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-all"><List size={14} /></button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <button onClick={() => { const url = prompt('Enter URL:'); if (url) execCmd('createLink', url) }} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 transition-all"><LinkIcon size={14} /></button>
                  </div>
                  <div 
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Start typing your brilliance..."
                    className="min-h-[250px] p-6 text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none rich-editor bg-white dark:bg-slate-900 m-3 rounded-xl"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving || !editForm.title}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-4 mt-6"
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
                  className="w-full text-center text-slate-400 dark:text-slate-500 font-bold text-xs hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Discard Changes & Start New
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Notes Feed */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Your Notes</h3>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1">Recent activity in all courses</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard 
                key={note.id}
                note={note}
                course={getCourse(note.course_id)}
                onEdit={openEdit}
                onDelete={setDeleteId}
              />
            ))}

            {/* Empty Slot Card */}
            <div 
              onClick={openNew}
              className="bg-slate-50 dark:bg-slate-900/50 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center h-[280px] group cursor-pointer hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 transition-all mb-4">
                <Plus size={24} strokeWidth={3} />
              </div>
              <span className="text-sm font-black text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-all uppercase tracking-widest">New Note</span>
            </div>
          </div>

          <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 p-8 flex items-center gap-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Cloud size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">Cloud Sync Active</h4>
              <p className="text-[0.7rem] font-bold text-slate-400 dark:text-slate-500 leading-relaxed">
                Your notes are automatically backed up to the StudSync cloud.
              </p>
            </div>
          </Card>
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
        .dark .rich-editor:empty:before {
          color: #475569;
        }
        .rich-editor p { margin-bottom: 0.5rem; }
        .rich-editor ul { list-style: disc; margin-left: 1.5rem; margin-bottom: 0.5rem; }
        .rich-editor ol { list-style: decimal; margin-left: 1.5rem; margin-bottom: 0.5rem; }
      `}</style>
    </PageLayout>
  )
}
