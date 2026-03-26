'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { format } from 'date-fns'
import {
  Plus, Bell, Settings, Calendar,
  MapPin, Clock, Info, ChevronLeft,
  ChevronRight, Trash2, Edit3, X,
  GraduationCap, PartyPopper, Brain,
  Star, Heart, Sparkles, Link as LinkIcon, ChevronDown, Filter, Tag, Rocket
} from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'
import { useData } from '@/context/DataContext'

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
  status?: string
}

interface Course {
  id: string
  title: string
  color: string
}

type TabType = 'semester' | 'study' | 'exams' | 'events'

export default function SchedulePage() {
  const supabase = createClient()
  const { user, courses: globalCourses, loading: contextLoading } = useData()

  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('semester')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'class' as string,
    day_of_week: 1,
    event_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:30',
    location: '',
    course_id: ''
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const courses = globalCourses
  const today = new Date()

  const fetchSchedule = async () => {
    if (!user) return
    const { data: schedRes } = await supabase.from('schedules').select('*').eq('user_id', user.id).order('event_date').order('start_time')
    setEntries(schedRes || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!contextLoading && user) {
      fetchSchedule()
    } else if (!contextLoading && !user) {
      setLoading(false)
    }
  }, [user, contextLoading])

  const handleSave = async () => {
    setSaving(true)
    if (!user) return

    const payload = {
      title: form.title || 'Untitled Entry',
      type: form.type,
      day_of_week: form.type === 'class' ? form.day_of_week : null,
      event_date: (form.type === 'exam' || form.type === 'study' || form.type === 'event') ? form.event_date || null : null,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location || null,
      course_id: form.course_id || null,
      user_id: user.id,
    }

    if (editingId) {
      await supabase.from('schedules').update(payload).eq('id', editingId)
    } else {
      await supabase.from('schedules').insert(payload)
    }

    setSaving(false)
    setForm(prev => ({ ...prev, title: '', location: '', course_id: '' }))
    setEditingId(null)
    fetchSchedule()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('schedules').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchSchedule()
  }

  const getCourse = (id: string | null) => courses.find(c => c.id === id)

  if (contextLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader
        title="Academic Schedule"
        subtitle="Manage your study sessions, exams, and personal events."
      />

      {/* Main Tabs */}
      <div className="flex items-center gap-10 mb-12 border-b border-slate-100 px-4">
        {(['semester', 'study', 'exams', 'events'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setEditingId(null)
              setForm(prev => ({ 
                ...prev, 
                type: tab === 'events' ? 'event' : tab === 'exams' ? 'exam' : tab === 'semester' ? 'class' : 'study', 
                title: '', 
                location: '',
                course_id: ''
              }))
            }}
            className={`pb-4 text-xs font-black tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab === 'semester' ? 'Semester Schedule' : tab === 'study' ? 'Exams & Study' : tab === 'exams' ? 'Exams' : 'Personal Events'}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-2px_6px_rgba(79,70,229,0.3)]" />
            )}
          </button>
        ))}
      </div>

      <div className="max-w-[1600px] mx-auto">
        {activeTab === 'semester' || activeTab === 'study' || activeTab === 'exams' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Form & Motivation */}
            <div className="lg:col-span-12 xl:col-span-4 space-y-8">
              <Card className="p-8 md:p-12">
                <div className="flex items-center gap-4 text-indigo-600 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <Calendar size={24} strokeWidth={3} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {editingId ? 'Edit Entry' : activeTab === 'semester' ? 'Add New Class' : activeTab === 'exams' ? 'Exam Focus' : 'Study Goal'}
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Title</label>
                    <input
                      type="text"
                      placeholder={activeTab === 'semester' ? "e.g. Advanced Thermodynamics" : activeTab === 'exams' ? "e.g. Physics Final Exam" : "e.g. Review Calculus Ch. 4"}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>

                  {activeTab === 'semester' && (
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Room / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Hall B, Room 402"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Course</label>
                    <div className="relative group">
                      <select
                        value={form.course_id}
                        onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 appearance-none outline-none focus:ring-4 focus:ring-indigo-500/5 cursor-pointer"
                      >
                        <option value="">No Course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-slate-400" size={16} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {activeTab === 'semester' ? (
                      <div className="space-y-2">
                        <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Day of Week</label>
                        <div className="relative group">
                          <select
                            value={form.day_of_week}
                            onChange={(e) => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 appearance-none outline-none focus:ring-4 focus:ring-indigo-500/5 cursor-pointer"
                          >
                            <option value={1}>Monday</option>
                            <option value={2}>Tuesday</option>
                            <option value={3}>Wednesday</option>
                            <option value={4}>Thursday</option>
                            <option value={5}>Friday</option>
                            <option value={6}>Saturday</option>
                            <option value={0}>Sunday</option>
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-slate-400" size={16} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Date</label>
                        <input
                          type="date"
                          value={form.event_date}
                          onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Start Time</label>
                      <input
                        type="time"
                        value={form.start_time}
                        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {activeTab === 'semester' && (
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">End Time</label>
                      <input
                        type="time"
                        value={form.end_time}
                        onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={saving || !form.title}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] mt-4 tracking-wider uppercase text-[0.7rem]"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      editingId ? 'Update Entry' : activeTab === 'semester' ? 'Save to Schedule' : 'Save Entry'
                    )}
                  </button>
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setForm(prev => ({ ...prev, title: '', location: '', course_id: '' }))
                      }}
                      className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 font-bold py-3 rounded-xl text-[0.6rem] uppercase tracking-widest"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </Card>

              <Card className="bg-indigo-600 p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:scale-110 transition-transform">
                  <Rocket size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-4 leading-tight">Crush your {activeTab === 'exams' ? 'exams' : 'study session'}.</h3>
                  <p className="text-white/60 font-medium text-sm leading-relaxed mb-6">
                    Consistency is the key to mastery. Keep up the high intensity work!
                  </p>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <Star size={14} className="text-amber-300" />
                    <span>Focus Mode Active</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: List View */}
            <div className="lg:col-span-12 xl:col-span-8 space-y-12">
              <div className="px-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  {activeTab === 'semester' ? 'Weekly Agenda' : `Upcoming ${activeTab === 'exams' ? 'Exams' : 'Sessions'}`}
                </h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {activeTab === 'semester' ? 'Recurring Classes' : 'Timeline View'}
                </p>
              </div>

              <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-8">
                {activeTab === 'semester' ? (
                  // Group by day for Semester Schedule
                  [1, 2, 3, 4, 5, 6, 0].map(day => {
                    const dayEntries = entries.filter(e => e.type === 'class' && e.day_of_week === day)
                    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
                    
                    return (
                      <div key={day} className="space-y-4">
                        <div className="flex items-center gap-4 py-2">
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{dayName}</h4>
                          <div className="h-px bg-slate-100 flex-1" />
                          <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">{dayEntries.length} Classes</span>
                        </div>
                        {dayEntries.length > 0 ? (
                          dayEntries.map(entry => (
                            <div key={entry.id} className="relative">
                              <div className="absolute -left-[41px] top-8 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 z-10" />
                              <Card className="p-8 group hover:border-indigo-200 transition-all">
                                <div className="flex flex-wrap items-center justify-between gap-6">
                                  <div className="flex items-center gap-6">
                                    <div className="w-1.5 h-12 rounded-full bg-indigo-600" />
                                    <div>
                                      <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{entry.title}</h4>
                                        <span className="px-2 py-0.5 rounded-lg text-[0.6rem] font-black uppercase tracking-tight bg-indigo-50 text-indigo-600">
                                          SCIENCE
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                        <span className="flex items-center gap-1.5 uppercase tracking-wider"><Clock size={12} strokeWidth={3} /> {entry.start_time} — {entry.end_time}</span>
                                        {entry.location && <span className="flex items-center gap-1.5 uppercase tracking-wider"><MapPin size={12} strokeWidth={3} /> {entry.location}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <button
                                      onClick={() => {
                                        setEditingId(entry.id)
                                        setForm({
                                          ...entry,
                                          type: 'class',
                                          day_of_week: entry.day_of_week || 1,
                                          event_date: entry.event_date || format(new Date(), 'yyyy-MM-dd'),
                                        } as any)
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                      }}
                                      className="p-3 rounded-xl text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      <Edit3 size={18} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteId(entry.id)}
                                      className="p-3 rounded-xl text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          ))
                        ) : (
                          dayEntries.length === 0 && day > 5 && (
                            <div className="p-10 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                              <Calendar size={24} className="text-slate-200 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weekend & Planning</p>
                              <p className="text-[0.6rem] text-slate-300 mt-1">No active classes found for the remainder of the week.</p>
                            </div>
                          )
                        )}
                      </div>
                    )
                  })
                ) : (
                  entries.filter(e => e.type === (activeTab === 'exams' ? 'exam' : 'study')).map((entry) => {
                    const date = entry.event_date ? new Date(entry.event_date) : today
                    const course = getCourse(entry.course_id)

                    return (
                      <div key={entry.id} className="relative">
                        <div className="absolute -left-[41px] top-8 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 z-10" />

                        <Card className="p-8 group hover:border-indigo-200 transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                              <div className="text-center w-16 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                <span className="text-[0.6rem] font-black text-slate-400 uppercase block leading-none mb-1">{format(date, 'MMM')}</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{format(date, 'dd')}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{entry.title}</h4>
                                  {course && (
                                    <span className="px-2 py-0.5 rounded-lg text-[0.6rem] font-black uppercase tracking-tight" style={{ backgroundColor: `${course.color}15`, color: course.color }}>
                                      {course.title}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                  <span className="flex items-center gap-1.5"><Clock size={12} /> {entry.start_time}</span>
                                  {entry.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {entry.location}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => {
                                  setEditingId(entry.id)
                                  setForm({
                                    title: entry.title,
                                    type: entry.type,
                                    day_of_week: entry.day_of_week || 1,
                                    event_date: entry.event_date || format(new Date(), 'yyyy-MM-dd'),
                                    start_time: entry.start_time,
                                    end_time: entry.end_time || '10:30',
                                    location: entry.location || '',
                                    course_id: entry.course_id || ''
                                  })
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                className="p-3 rounded-xl text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button
                                onClick={() => setDeleteId(entry.id)}
                                className="p-3 rounded-xl text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )
                  })
                )}

                {entries.filter(e => e.type === (activeTab === 'exams' ? 'exam' : 'study')).length === 0 && activeTab !== 'semester' && (
                  <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/10 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <Calendar size={40} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">Your calendar is clear. Time to relax or plan ahead!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
            <div className="xl:col-span-4 space-y-6">
              <Card className="p-10">
                <div className="flex items-center gap-4 text-emerald-600 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                    <Star size={24} strokeWidth={3} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{editingId ? 'Edit Event' : 'Next Milestone'}</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Event Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Hackathon Kickoff"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Date</label>
                      <input
                        type="date"
                        value={form.event_date}
                        onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Time</label>
                      <input
                        type="time"
                        value={form.start_time}
                        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Category & Location</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Social', 'Milestone', 'Personal'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setForm({ ...form, location: `${cat}${form.location.includes(' @ ') ? ` @ ${form.location.split(' @ ')[1]}` : ''}` })}
                          className={`py-3 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all border-2 ${form.location.startsWith(cat) ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-400'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. @ Central Park"
                      value={form.location.includes(' @ ') ? form.location.split(' @ ')[1] : ''}
                      onChange={(e) => setForm({ ...form, location: `${form.location.split(' @ ')[0]} @ ${e.target.value}` })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white mt-2 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving || !form.title}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-5 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] mt-4 tracking-wider uppercase text-[0.7rem]"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      editingId ? 'Update Event' : 'Create Event'
                    )}
                  </button>
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setForm(prev => ({ ...prev, title: '', location: '', course_id: '' }))
                      }}
                      className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 font-bold py-3 rounded-xl text-[0.6rem] uppercase tracking-widest"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </Card>
            </div>

            <div className="xl:col-span-8 space-y-12">
              <div className="px-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Life & Social</h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Personal Timeline</p>
              </div>

              <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-12">
                {entries.filter(e => e.type === 'event').length > 0 ? (
                  entries.filter(e => e.type === 'event').map((event, idx) => {
                    const date = event.event_date ? new Date(event.event_date) : today
                    const isDone = event.status === 'completed'
                    const displayTitle = event.title
                    return (
                      <div key={event.id} className="relative">
                        <div className={`absolute -left-[41px] top-8 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 z-10 ${idx === 0 ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <Card className={`p-8 group hover:border-emerald-200 transition-all ${idx === 0 ? 'border-emerald-600 ring-4 ring-emerald-500/5' : ''}`}>
                          <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                              <div className="text-center w-16 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                <span className="text-[0.6rem] font-black text-slate-400 uppercase block mb-1">{format(date, 'MMM')}</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white">{format(date, 'dd')}</span>
                              </div>
                              <div>
                                <h4 className={`text-xl font-black mb-1 ${isDone ? 'text-slate-300 line-through' : 'text-slate-900 dark:text-white'}`}>{displayTitle}</h4>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                  <span className="flex items-center gap-1.5"><Clock size={12} /> {event.start_time}</span>
                                  <span className="flex items-center gap-1.5"><Tag size={12} /> {event.location?.split(' @ ')[0] || 'Personal'}</span>
                                  {event.location?.includes(' @ ') && <span className="flex items-center gap-1.5"><MapPin size={12} /> {event.location.split(' @ ')[1]}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingId(event.id)
                                    setForm({
                                      title: displayTitle,
                                      type: 'event',
                                      day_of_week: 1,
                                      event_date: event.event_date || format(new Date(), 'yyyy-MM-dd'),
                                      start_time: event.start_time,
                                      end_time: event.end_time || '10:30',
                                      location: event.location || '',
                                      course_id: event.course_id || ''
                                    })
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                  }}
                                  className="p-3 rounded-xl text-slate-300 hover:text-emerald-600 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button onClick={() => setDeleteId(event.id)} className="p-3 rounded-xl text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 size={18} />
                                </button>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/10 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <Calendar size={40} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">Your timeline is clear. Add your first personal event to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Schedule Entry"
        message="Are you sure you want to delete this scheduled item? This action cannot be undone."
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      ` }} />
    </PageLayout>
  )
}
