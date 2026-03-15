'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/ConfirmDialog'
import { format } from 'date-fns'
import { StickyNote, Plus, Trash2, X, Bold, Italic, List, Link as LinkIcon, CheckCircle2, Eye } from 'lucide-react'

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
  const [panelOpen, setPanelOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '', status: 'review', course_id: '' })
  const editorRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
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
    setEditForm({ title: '', content: '', status: 'review', course_id: '' })
    setPanelOpen(true)
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = '' }, 50)
  }

  const openEdit = (note: Note) => {
    setIsNew(false)
    setSelectedNote(note)
    setEditForm({ title: note.title, content: note.content || '', status: note.status, course_id: note.course_id || '' })
    setPanelOpen(true)
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = note.content || '' }, 50)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const content = editorRef.current?.innerHTML || ''
    const payload = { title: editForm.title, content, status: editForm.status, course_id: editForm.course_id || null, updated_at: new Date().toISOString() }

    if (isNew) {
      await supabase.from('notes').insert({ ...payload, user_id: user.id })
    } else if (selectedNote) {
      await supabase.from('notes').update(payload).eq('id', selectedNote.id)
    }
    setSaving(false)
    setPanelOpen(false)
    fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('notes').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId)
    setDeleteId(null)
    if (selectedNote?.id === deleteId) { setPanelOpen(false); setSelectedNote(null) }
    fetchData()
  }

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }

  const getCourse = (id: string | null) => courses.find(c => c.id === id)

  if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div className="page-container animate-fadeIn" style={{ display: 'flex', gap: '1.5rem' }}>
      {/* Notes Grid */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Smart Notes</h1>
            <p className="page-subtitle">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> New Note</button>
        </div>

        {notes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <StickyNote size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No notes yet</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Start capturing your ideas and lecture notes.</p>
            <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> New Note</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }} className="stagger-children">
            {notes.map(note => {
              const course = getCourse(note.course_id)
              return (
                <div
                  key={note.id}
                  className="card"
                  style={{ cursor: 'pointer', position: 'relative' }}
                  onClick={() => openEdit(note)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', flex: 1 }}>{note.title}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(note.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Content preview */}
                  <div
                    style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5, maxHeight: 60, overflow: 'hidden', marginBottom: '0.75rem' }}
                    dangerouslySetInnerHTML={{ __html: note.content || '<em>No content</em>' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {course && (
                      <span className="badge" style={{ background: `${course.color}15`, color: course.color }}>{course.title}</span>
                    )}
                    <span className="badge" style={{
                      background: note.status === 'done' ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: note.status === 'done' ? 'var(--success)' : 'var(--warning)',
                    }}>
                      {note.status === 'done' ? <><CheckCircle2 size={10} /> Done</> : <><Eye size={10} /> Review</>}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                      {format(new Date(note.updated_at), 'MMM d')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Side Panel Editor */}
      {panelOpen && (
        <div className="animate-slideInRight" style={{
          width: 400, flexShrink: 0, background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '1.25rem', padding: '1.5rem', position: 'sticky', top: '2rem',
          maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{isNew ? 'New Note' : 'Edit Note'}</h2>
            <button onClick={() => setPanelOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Title</label>
              <input className="input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Note title" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Course</label>
                <select className="input" value={editForm.course_id} onChange={(e) => setEditForm({ ...editForm, course_id: e.target.value })}>
                  <option value="">None</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Content</label>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem', padding: '0.375rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <button onClick={() => execCmd('bold')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', color: 'var(--muted)' }}><Bold size={15} /></button>
                <button onClick={() => execCmd('italic')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', color: 'var(--muted)' }}><Italic size={15} /></button>
                <button onClick={() => execCmd('insertUnorderedList')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', color: 'var(--muted)' }}><List size={15} /></button>
                <button onClick={() => { const url = prompt('Enter URL:'); if (url) execCmd('createLink', url) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', color: 'var(--muted)' }}><LinkIcon size={15} /></button>
              </div>
              <div ref={editorRef} className="rich-editor" contentEditable suppressContentEditableWarning />
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={!editForm.title || saving}>
              {saving ? <span className="spinner" /> : 'Save Note'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        message="This note will be moved to trash. You can recover it from Settings."
      />
    </div>
  )
}
