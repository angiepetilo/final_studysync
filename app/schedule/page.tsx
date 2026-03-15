'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { format } from 'date-fns'
import { Calendar, Plus, Trash2, Clock, MapPin, BookOpen, Brain, GraduationCap, PartyPopper } from 'lucide-react'

interface ScheduleEntry {
  id: string
  title: string
  type: 'class' | 'exam' | 'study' | 'event'
  day_of_week: number | null
  event_date: string | null
  start_time: string
  end_time: string
  location: string
  course_id: string | null
}

interface Course {
  id: string
  title: string
  color: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7AM to 9PM

type TabType = 'semester' | 'exams' | 'events'

export default function SchedulePage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('semester')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'class' as string, day_of_week: '1', event_date: '', start_time: '08:00', end_time: '09:00', location: '', course_id: '' })

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [schedRes, coursesRes] = await Promise.all([
      supabase.from('schedules').select('*').eq('user_id', user.id).order('start_time'),
      supabase.from('courses').select('id, title, color').eq('user_id', user.id),
    ])
    setEntries(schedRes.data || [])
    setCourses(coursesRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [supabase])

  const getCourse = (id: string | null) => courses.find(c => c.id === id)

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('schedules').insert({
      title: form.title,
      type: form.type,
      day_of_week: form.type === 'class' ? parseInt(form.day_of_week) : null,
      event_date: form.type !== 'class' ? form.event_date || null : null,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location || null,
      course_id: form.course_id || null,
      user_id: user.id,
    })
    setSaving(false)
    setModalOpen(false)
    setForm({ title: '', type: 'class', day_of_week: '1', event_date: '', start_time: '08:00', end_time: '09:00', location: '', course_id: '' })
    fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('schedules').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchData()
  }

  const classes = entries.filter(e => e.type === 'class')
  const examsStudy = entries.filter(e => e.type === 'exam' || e.type === 'study')
  const personalEvents = entries.filter(e => e.type === 'event')

  const tabs: { key: TabType; label: string; icon: typeof Calendar }[] = [
    { key: 'semester', label: 'Semester Schedule', icon: Calendar },
    { key: 'exams', label: 'Exams & Study', icon: GraduationCap },
    { key: 'events', label: 'Personal Events', icon: PartyPopper },
  ]

  if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div className="page-container animate-fadeIn">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="page-subtitle">{entries.length} scheduled entries</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={18} /> Add Entry</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 500, border: 'none', cursor: 'pointer', borderRadius: '0.5rem',
              background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--muted)',
              transition: 'all 0.15s',
            }}>
              <Icon size={15} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Semester Schedule - Timetable Grid */}
      {activeTab === 'semester' && (
        <div className="card" style={{ overflow: 'auto', padding: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', borderBottom: '1px solid var(--border)', width: 70 }}>Time</th>
                {DAYS.slice(1).concat(DAYS.slice(0, 1)).map(day => (
                  <th key={day} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    {day.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td style={{ padding: '0.375rem 0.5rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                    {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'PM' : 'AM'}
                  </td>
                  {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
                    const entry = classes.find(e => {
                      if (e.day_of_week !== dayIdx) return false
                      const startHour = parseInt(e.start_time.split(':')[0])
                      return startHour === hour
                    })
                    const course = entry ? getCourse(entry.course_id) : null
                    return (
                      <td key={dayIdx} style={{ padding: '0.25rem', borderBottom: '1px solid var(--border)', verticalAlign: 'top', minHeight: 40, position: 'relative' }}>
                        {entry && (
                          <div style={{
                            background: course ? `${course.color}15` : 'var(--accent-bg)',
                            borderLeft: `3px solid ${course?.color || 'var(--accent)'}`,
                            borderRadius: '0.375rem',
                            padding: '0.375rem 0.5rem',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                          }}
                            onClick={() => setDeleteId(entry.id)}
                          >
                            <div style={{ fontWeight: 600, color: course?.color || 'var(--accent)' }}>{entry.title}</div>
                            <div style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>{entry.start_time}–{entry.end_time}</div>
                            {entry.location && <div style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>{entry.location}</div>}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Exams & Study */}
      {activeTab === 'exams' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {examsStudy.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <GraduationCap size={40} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No exams or study sessions scheduled yet.</p>
              </div>
            ) : (
              examsStudy.map(entry => {
                const course = getCourse(entry.course_id)
                return (
                  <div key={entry.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
                      background: entry.type === 'exam' ? 'var(--danger-bg)' : 'var(--accent-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {entry.type === 'exam' ? <GraduationCap size={20} color="var(--danger)" /> : <Brain size={20} color="var(--accent)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entry.title}</div>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                        {entry.event_date && <span>{format(new Date(entry.event_date + 'T00:00:00'), 'MMM d, yyyy')}</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {entry.start_time}–{entry.end_time}</span>
                        {entry.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} /> {entry.location}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {course && <span className="badge" style={{ background: `${course.color}15`, color: course.color }}>{course.title}</span>}
                      <span className="badge" style={{
                        background: entry.type === 'exam' ? 'var(--danger-bg)' : 'var(--accent-bg)',
                        color: entry.type === 'exam' ? 'var(--danger)' : 'var(--accent)',
                        textTransform: 'capitalize',
                      }}>{entry.type}</span>
                      <button onClick={() => setDeleteId(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Study Insights Sidebar */}
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>Study Insights</h3>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--muted)' }}>Exam Readiness</span>
                <span style={{ fontWeight: 600 }}>{examsStudy.length > 0 ? Math.round((examsStudy.filter(e => e.type === 'study').length / Math.max(examsStudy.length, 1)) * 100) : 0}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${examsStudy.length > 0 ? (examsStudy.filter(e => e.type === 'study').length / Math.max(examsStudy.length, 1)) * 100 : 0}%`, background: 'var(--accent)', borderRadius: '999px' }} />
              </div>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '0.5rem' }}>📚 <strong>Tip:</strong> Start reviewing material at least 3 days before each exam.</p>
              <p style={{ marginBottom: '0.5rem' }}>🧠 <strong>Tip:</strong> Break study sessions into 25-minute blocks (Pomodoro).</p>
              <p>✅ <strong>Tip:</strong> Create practice questions for active recall.</p>
            </div>
          </div>
        </div>
      )}

      {/* Personal Events */}
      {activeTab === 'events' && (
        <div>
          {personalEvents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <PartyPopper size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No personal events</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Add personal milestones and commitments here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }} className="stagger-children">
              {personalEvents.map(entry => (
                <div key={entry.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{entry.title}</h3>
                    <button onClick={() => setDeleteId(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><Trash2 size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {entry.event_date && <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Calendar size={13} /> {format(new Date(entry.event_date + 'T00:00:00'), 'MMMM d, yyyy')}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Clock size={13} /> {entry.start_time} – {entry.end_time}</span>
                    {entry.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><MapPin size={13} /> {entry.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Entry Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Schedule Entry">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Math 101 Lecture" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="class">Class</option>
              <option value="exam">Exam</option>
              <option value="study">Study Session</option>
              <option value="event">Personal Event</option>
            </select>
          </div>
          {form.type === 'class' ? (
            <div>
              <label className="label">Day of Week</label>
              <select className="input" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Start Time</label>
              <input className="input" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input className="input" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Location / Room</label>
            <input className="input" placeholder="e.g. Room 301" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="label">Course (optional)</label>
            <select className="input" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
              <option value="">No course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={!form.title || saving} style={{ marginTop: '0.5rem' }}>
            {saving ? <span className="spinner" /> : 'Add Entry'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Entry" message="This schedule entry will be permanently removed." />
    </div>
  )
}
