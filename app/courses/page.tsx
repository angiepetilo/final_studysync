'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { BookOpen, Plus, Edit3, Trash2, Users, CheckSquare, StickyNote, Calendar } from 'lucide-react'

const COLORS = ['#4F46E5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316']

interface Course {
  id: string
  title: string
  instructor: string
  color: string
  task_count?: number
  note_count?: number
  schedule_count?: number
}

export default function CoursesPage() {
  const supabase = createClient()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', instructor: '', color: COLORS[0] })
  const [saving, setSaving] = useState(false)

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: coursesData } = await supabase.from('courses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    if (coursesData) {
      // Get counts for each course
      const enriched = await Promise.all(
        coursesData.map(async (course) => {
          const [tasks, notes, schedules] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('course_id', course.id).is('deleted_at', null),
            supabase.from('notes').select('*', { count: 'exact', head: true }).eq('course_id', course.id).is('deleted_at', null),
            supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          ])
          return { ...course, task_count: tasks.count || 0, note_count: notes.count || 0, schedule_count: schedules.count || 0 }
        })
      )
      setCourses(enriched)
    }
    setLoading(false)
  }

  useEffect(() => { fetchCourses() }, [supabase])

  const openAdd = () => {
    setEditingCourse(null)
    setForm({ title: '', instructor: '', color: COLORS[0] })
    setModalOpen(true)
  }

  const openEdit = (c: Course) => {
    setEditingCourse(c)
    setForm({ title: c.title, instructor: c.instructor || '', color: c.color })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingCourse) {
      await supabase.from('courses').update({ title: form.title, instructor: form.instructor, color: form.color, updated_at: new Date().toISOString() }).eq('id', editingCourse.id)
    } else {
      await supabase.from('courses').insert({ title: form.title, instructor: form.instructor, color: form.color, user_id: user.id })
    }
    setSaving(false)
    setModalOpen(false)
    fetchCourses()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('courses').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchCourses()
  }

  if (loading) {
    return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
  }

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">Your academic subject hub — {courses.length} course{courses.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Course</button>
      </div>

      {courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <BookOpen size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No courses yet</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Add your first course to start organizing your academic life.</p>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Course</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }} className="stagger-children">
          {courses.map((c) => {
            const totalLinked = (c.task_count || 0) + (c.note_count || 0) + (c.schedule_count || 0)
            const maxLinked = Math.max(totalLinked, 1)
            const pulsePct = Math.min(Math.round((totalLinked / (maxLinked + 5)) * 100), 100)
            return (
              <div key={c.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Color strip */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: c.color }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', paddingTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={20} color={c.color} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{c.title}</h3>
                      {c.instructor && <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{c.instructor}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.5rem', color: 'var(--muted)' }}><Edit3 size={15} /></button>
                    <button onClick={() => setDeleteId(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.5rem', color: 'var(--muted)' }}><Trash2 size={15} /></button>
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                    <CheckSquare size={13} /> {c.task_count} tasks
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                    <StickyNote size={13} /> {c.note_count} notes
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                    <Calendar size={13} /> {c.schedule_count} events
                  </div>
                </div>

                {/* Course Pulse */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.375rem' }}>
                    <span>Course Pulse</span>
                    <span>{pulsePct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pulsePct}%`, background: c.color, borderRadius: '999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCourse ? 'Edit Course' : 'Add Course'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Course Title</label>
            <input className="input" placeholder="e.g. Data Structures" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Instructor</label>
            <input className="input" placeholder="e.g. Dr. Smith" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} />
          </div>
          <div>
            <label className="label">Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: color, border: form.color === color ? '3px solid var(--foreground)' : '3px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={!form.title || saving} style={{ marginTop: '0.5rem' }}>
            {saving ? <span className="spinner" /> : (editingCourse ? 'Save Changes' : 'Add Course')}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message="This will permanently delete this course. Tasks, notes, and schedules linked to it will be unlinked."
      />
    </div>
  )
}
