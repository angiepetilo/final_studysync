'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/ConfirmDialog'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { 
  Plus, Bell, Settings, Calendar, 
  MapPin, Clock, Info, ChevronLeft, 
  ChevronRight, Trash2, Edit3, X,
  GraduationCap, PartyPopper, Brain,
  Star, Heart, Sparkles, Link as LinkIcon, ChevronDown, Filter, Tag
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import UserNav from '@/components/UserNav'

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

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAYS_FULL = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 7
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h
  return { value: `${h.toString().padStart(2, '0')}:00`, label: `${displayH.toString().padStart(2, '0')}:00 ${ampm}` }
})

type TabType = 'semester' | 'exams' | 'events'

export default function SchedulePage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ id: string, full_name: string, email: string }>({ id: '', full_name: '', email: '' })

  // Calendar state for mobile/specific views if needed, though mockup is week-based
  const today = new Date()
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }) // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    setUserProfile({ id: user.id, full_name: profile?.full_name || '', email: user.email || '' })

    const [schedRes, coursesRes] = await Promise.all([
      supabase.from('schedules').select('*').eq('user_id', user.id).order('start_time'),
      supabase.from('courses').select('id, title, color').eq('user_id', user.id),
    ])
    setEntries(schedRes.data || [])
    setCourses(coursesRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingId) {
      await supabase.from('schedules').update({
        title: form.title || 'Untitled Entry',
        type: form.type,
        day_of_week: form.type === 'class' ? form.day_of_week : null,
        event_date: (form.type === 'exam' || form.type === 'study' || form.type === 'event') ? form.event_date || null : null,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location || null,
        course_id: form.course_id || null,
      }).eq('id', editingId)
    } else {
      await supabase.from('schedules').insert({
        title: form.title || 'Untitled Entry',
        type: form.type,
        day_of_week: form.type === 'class' ? form.day_of_week : null,
        event_date: (form.type === 'exam' || form.type === 'study' || form.type === 'event') ? form.event_date || null : null,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location || null,
        course_id: form.course_id || null,
        user_id: user.id,
      })
    }
    
    setSaving(false)
    setForm(prev => ({ ...prev, title: '', location: '' }))
    setIsModalOpen(false)
    setEditingId(null)
    fetchData()
  }

  const toggleComplete = async (entry: ScheduleEntry) => {
    const isDone = entry.title.startsWith('[DONE] ')
    const newTitle = isDone ? entry.title.replace('[DONE] ', '') : `[DONE] ${entry.title}`
    await supabase.from('schedules').update({ title: newTitle }).eq('id', entry.id)
    fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('schedules').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchData()
  }

  const getCourse = (id: string | null) => courses.find(c => c.id === id)

  const classesByDay = useMemo(() => {
    const map: Record<number, ScheduleEntry[]> = {}
    entries.filter(e => e.type === 'class').forEach(e => {
      const day = e.day_of_week ?? 0
      if (!map[day]) map[day] = []
      map[day].push(e)
    })
    return map
  }, [entries])

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
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 text-center">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Semester Schedule</h1>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell userId={userProfile.id} className="w-12 h-12 rounded-2xl bg-white border border-slate-100" iconSize={20} />
          <UserNav user={userProfile} />
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-10 mb-12 border-b border-slate-100 px-4">
        {(['semester', 'exams', 'events'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-xs font-black tracking-widest uppercase transition-all relative ${
              activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'semester' ? 'Semester Schedule' : tab === 'exams' ? 'Exams & Study' : 'Personal Events'}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-2px_6px_rgba(79,70,229,0.3)]" />
            )}
          </button>
        ))}
      </div>

      <div className="max-w-[1600px] mx-auto">
        {activeTab === 'semester' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Form & Help */}
            <div className="lg:col-span-3 space-y-10">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/[0.03] border border-slate-100 space-y-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add New Class</h2>

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Class Title</label>
                    <input 
                      type="text"
                      placeholder="e.g. Quantum Physics"
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Course Selection</label>
                    <div className="relative group">
                      <select 
                        value={form.course_id}
                        onChange={(e) => setForm({...form, course_id: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-xs font-bold text-slate-600 appearance-none focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer"
                      >
                        <option value="">Select a course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-slate-400 transition-colors" size={16} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Day of Week</label>
                    <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-xl">
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                        <button
                          key={d}
                          onClick={() => setForm({...form, day_of_week: d})}
                          className={`w-9 h-9 rounded-lg text-[0.65rem] font-black transition-all ${
                            form.day_of_week === d 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                        >
                          {DAYS_SHORT[d]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Room / Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input 
                        type="text"
                        placeholder="Building 4, Room 202"
                        value={form.location}
                        onChange={(e) => setForm({...form, location: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-6 py-4 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Start Time</label>
                      <div className="relative">
                        <input 
                          type="time"
                          value={form.start_time}
                          onChange={(e) => setForm({...form, start_time: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-[0.65rem] font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">End Time</label>
                      <div className="relative">
                        <input 
                          type="time"
                          value={form.end_time}
                          onChange={(e) => setForm({...form, end_time: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-[0.65rem] font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={saving || !form.title}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] mt-4 tracking-wider uppercase text-[0.7rem]"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      'Create Entry'
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                  <Info size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 mb-1">Schedule Tip</h4>
                  <p className="text-[0.65rem] font-bold text-slate-400 leading-relaxed">
                    Classes that overlap will be highlighted in red automatically. You can drag and drop existing blocks to reschedule them.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Calendar Grid */}
            <div className="lg:col-span-9 bg-white rounded-[3rem] p-4 md:p-10 shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-8 gap-0 border-b border-slate-50 mb-4">
                <div className="p-4" /> {/* Spacer for time column */}
                {weekDays.map((day, idx) => {
                  const isToday = isSameDay(day, today)
                  const dayIdx = day.getDay()
                  return (
                    <div key={idx} className={`flex flex-col items-center py-4 px-2 rounded-t-[2rem] transition-colors ${isToday ? 'bg-indigo-50/50' : ''}`}>
                      <span className={`text-[0.65rem] font-black tracking-widest ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {DAYS_FULL[dayIdx]}
                      </span>
                      <span className={`text-xl font-black mt-1 ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="relative h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Hour markers & background grid */}
                {HOURS.map((hour, idx) => (
                  <div key={idx} className="grid grid-cols-8 h-16 border-t border-slate-50/80 group">
                    <div className="text-[0.6rem] font-black text-slate-300 text-right pr-6 pt-1 transition-colors group-hover:text-slate-500">
                      {hour.label}
                    </div>
                    {weekDays.map((day, dayIdx) => (
                      <div key={dayIdx} className={`border-l border-slate-50/80 last:border-r ${isSameDay(day, today) ? 'bg-indigo-50/10' : ''}`} />
                    ))}
                  </div>
                ))}

                {/* Event layer */}
                <div className="absolute top-0 left-0 right-0 h-full grid grid-cols-8 pointer-events-none">
                  <div className="col-span-1" /> {/* Spacer */}
                  {weekDays.map((day, dayIdx) => {
                    const dayValue = day.getDay()
                    const dayClasses = classesByDay[dayValue] || []
                    return (
                      <div key={dayIdx} className="relative h-full pointer-events-auto">
                        {dayClasses.map((entry) => {
                          const course = getCourse(entry.course_id)
                          const startH = parseInt(entry.start_time.split(':')[0])
                          const startM = parseInt(entry.start_time.split(':')[1])
                          const endH = parseInt(entry.end_time.split(':')[0])
                          const endM = parseInt(entry.end_time.split(':')[1])
                          
                          const top = (startH - 7) * 64 + (startM / 60) * 64
                          const height = ((endH - startH) * 60 + (endM - startM)) / 60 * 64

                          return (
                            <div 
                              key={entry.id}
                              onClick={() => setDeleteId(entry.id)}
                              className="absolute left-2 right-2 rounded-2xl p-4 shadow-xl shadow-slate-200/20 border-l-4 transition-all hover:scale-[1.02] cursor-pointer group flex flex-col"
                              style={{ 
                                top: `${top}px`, 
                                height: `${height}px`,
                                backgroundColor: course ? `${course.color}10` : '#F1F5F9',
                                borderColor: course?.color || '#94A3B8'
                              }}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[0.6rem] font-black text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-tight">
                                  {entry.start_time} - {entry.end_time}
                                </span>
                                <MoreVertical size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                              <h4 className="text-[0.85rem] font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors truncate">
                                {entry.title}
                              </h4>
                              {entry.location && (
                                <div className="mt-auto flex items-center gap-1.5 text-slate-400 text-[0.65rem] font-bold truncate">
                                  <MapPin size={10} />
                                  {entry.location}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>

                {/* Current time line */}
                <div 
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  style={{ 
                    top: `${((today.getHours() - 7) * 64) + (today.getMinutes() / 60 * 64)}px`
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-lg shadow-indigo-300 ring-4 ring-white shrink-0 ml-[66px] -translate-x-1.5" />
                  <div className="flex-1 h-0.5 bg-indigo-600/40 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-indigo-600/20 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'exams' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Left Column: Form & Motivation */}
            <div className="lg:col-span-4 space-y-10">
              <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/[0.03] border border-slate-100 space-y-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Create New Session</h3>
                
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Session Title</label>
                    <input 
                      type="text"
                      placeholder="e.g. Algorithms Review"
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Date</label>
                      <div className="relative">
                        <input 
                          type="date"
                          value={form.event_date || ''}
                          onChange={(e) => setForm({...form, event_date: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl px-4 py-5 text-[0.65rem] font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                         <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Type</label>
                      <div className="relative group">
                        <select 
                          value={form.type}
                          onChange={(e) => setForm({...form, type: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-5 text-[0.65rem] font-black text-slate-600 appearance-none focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer"
                        >
                          <option value="study">Study Session</option>
                          <option value="exam">Exam</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-slate-400 transition-colors pointer-events-none" size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Notes</label>
                    <textarea 
                      placeholder="What do you want to focus on?"
                      rows={4}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
                    />
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={saving || !form.title}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] mt-4 tracking-widest uppercase text-[0.7rem] flex items-center justify-center gap-3"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus size={16} strokeWidth={3} />
                        Create Milestone
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Study Tip Card */}
              <div className="bg-indigo-600 rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/20 text-white space-y-8 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white relative z-10">
                  <Brain size={24} />
                </div>
                <div className="relative z-10 space-y-4">
                  <h4 className="text-lg font-black tracking-tight flex items-center gap-3">
                    Study Tip
                  </h4>
                  <p className="text-[0.7rem] font-bold text-indigo-50/80 leading-relaxed">
                    "The Feynman Technique: Try explaining your subject to someone with no background in it. If you struggle, you've found a gap in your knowledge."
                  </p>
                </div>
                <button className="bg-white text-indigo-600 font-black text-[0.65rem] px-8 py-3.5 rounded-full transition-all hover:bg-indigo-50 active:scale-95 relative z-10">
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Column: Milestones & Readiness */}
            <div className="lg:col-span-8 space-y-12">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upcoming Milestones</h2>
                <div className="flex items-center gap-2 text-[0.65rem] font-bold text-slate-400">
                  Sorting by: <span className="text-slate-900 flex items-center gap-1 cursor-pointer">Date <ChevronDown size={14} /></span>
                </div>
              </div>

              <div className="space-y-6">
                {entries.filter(e => e.type === 'exam' || e.type === 'study').slice(0, 2).map((entry) => {
                  const date = entry.event_date ? new Date(entry.event_date) : today
                  const daysAway = Math.max(0, Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
                  
                  return (
                    <div key={entry.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 flex items-center gap-8 group hover:border-indigo-100 transition-all">
                      <div className="flex flex-col items-center justify-center w-20 h-20 rounded-[2rem] bg-slate-50 group-hover:bg-indigo-50 transition-colors shrink-0">
                        <span className="text-[0.55rem] font-black text-slate-400 group-hover:text-indigo-400 tracking-widest uppercase">{format(date, 'MMM')}</span>
                        <span className="text-2xl font-black text-slate-900 group-hover:text-indigo-600">{format(date, 'dd')}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight truncate mb-1">
                          {entry.title}
                        </h4>
                        <div className="flex items-center gap-4 text-[0.65rem] font-bold text-slate-400">
                           <span>{entry.start_time} — {entry.location || 'Hall 4B'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[0.55rem] font-black text-indigo-600 uppercase tracking-widest block mb-1">{entry.type === 'exam' ? 'EXAM' : 'STUDY'}</span>
                        <span className="text-[0.65rem] font-black text-slate-400">
                          {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} Days`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="bg-slate-50/50 rounded-[3rem] p-10 border border-slate-100 space-y-10">
                <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">Readiness Overview</h3>
                <div className="flex items-center justify-start gap-12 overflow-x-auto pb-4 custom-scrollbar">
                  {courses.slice(0, 3).map((course, idx) => {
                    const progress = 80 - (idx * 20)
                    return (
                      <div key={course.id} className="flex flex-col items-center gap-4 min-w-[120px]">
                        <div className="relative w-20 h-20">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="40" cy="40" r="34" fill="transparent" stroke="#E2E8F0" strokeWidth="5" />
                            <circle 
                              cx="40" cy="40" r="34" fill="transparent" stroke={course.color} strokeWidth="5" strokeDasharray={213} 
                              strokeDashoffset={213 - (213 * progress / 100)} strokeLinecap="round" 
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-black text-slate-900">{progress}%</span>
                        </div>
                        <span className="text-[0.65rem] font-black text-slate-600 text-center uppercase tracking-tight">{course.title.split(' ')[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                    <GraduationCap size={22} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Course Material</span>
                    <h4 className="text-sm font-black text-slate-800">Review Guide.pdf</h4>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-slate-600 transition-colors">
                   <ChevronRight size={20} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Left Column: Form & Pro Tip */}
            <div className="lg:col-span-4 space-y-10">
              <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/[0.03] border border-slate-100 space-y-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Add New Event</h3>
                  <p className="text-[0.7rem] font-bold text-slate-400">Organize your personal milestones and social life.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Title</label>
                    <input 
                      type="text"
                      placeholder="Weekend Hike"
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Type</label>
                    <div className="relative group">
                      <select 
                        value={form.location.split(' @ ')[0]}
                        onChange={(e) => setForm({...form, location: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-xs font-bold text-slate-600 appearance-none focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer"
                      >
                        <option value="Milestone">Milestone</option>
                        <option value="Personal">Personal</option>
                        <option value="Social">Social</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-slate-400 transition-colors pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Location (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Central Park"
                      value={form.location.includes(' @ ') ? form.location.split(' @ ')[1] : ''}
                      onChange={(e) => {
                        const type = form.location.split(' @ ')[0] || 'Personal'
                        setForm({...form, location: e.target.value ? `${type} @ ${e.target.value}` : type})
                      }}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Date</label>
                      <div className="relative">
                        <input 
                          type="date"
                          value={form.event_date || ''}
                          onChange={(e) => setForm({...form, event_date: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl px-4 py-5 text-[0.65rem] font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                         <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Time</label>
                      <div className="relative">
                        <input 
                          type="time"
                          value={form.start_time}
                          onChange={(e) => setForm({...form, start_time: e.target.value})}
                          className="w-full bg-slate-50 border-none rounded-2xl px-4 py-5 text-[0.65rem] font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                        />
                         <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!form.title) return
                      setForm(prev => ({ ...prev, type: 'event' }))
                      handleSave()
                    }}
                    disabled={saving || !form.title}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] mt-4 tracking-widest uppercase text-[0.7rem] flex items-center justify-center gap-3"
                  >
                    {saving ? <Sparkles size={16} className="animate-pulse" /> : <Plus size={16} strokeWidth={3} />}
                    {editingId ? 'Update Event' : 'Create Event'}
                  </button>

                  {editingId && (
                    <button 
                      onClick={() => {
                        setEditingId(null)
                        setForm(prev => ({ ...prev, title: '', location: '' }))
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-3 rounded-xl text-[0.6rem] uppercase tracking-widest transition-all"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Pro Tip Card */}
              <div className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100 flex gap-5 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1">
                  <Brain size={20} />
                </div>
                <p className="text-[0.65rem] font-black text-indigo-900/40 leading-relaxed">
                  <span className="text-indigo-600 block mb-1">Pro tip:</span>
                  Sync your personal events with your Google Calendar for better visibility.
                </p>
              </div>
            </div>

            {/* Right Column: Your Timeline */}
            <div className="lg:col-span-8 space-y-10 relative">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Timeline</h2>
                <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <Filter size={18} />
                </button>
              </div>

              <div className="relative pl-12 space-y-12">
                {/* Vertical Line */}
                <div className="absolute left-[1.15rem] top-2 bottom-2 w-0.5 bg-slate-100" />

                {entries.filter(e => e.type === 'event').length > 0 ? (
                  entries.filter(e => e.type === 'event').map((event, idx) => {
                    const date = event.event_date ? new Date(event.event_date) : today
                    const isDone = event.title.startsWith('[DONE] ')
                    const displayTitle = isDone ? event.title.replace('[DONE] ', '') : event.title
                    
                    return (
                      <div key={event.id} className="relative">
                        {/* Node */}
                        <div className={`absolute -left-[12.5px] top-8 w-6 h-6 rounded-full border-4 border-white z-10 transition-colors ${
                          idx === 0 ? 'bg-indigo-600' : 'bg-slate-200'
                        }`} />

                        <div className={`bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border transition-all group ${
                          idx === 0 ? 'border-indigo-600 ring-4 ring-indigo-500/5' : 'border-slate-100 hover:border-indigo-200'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`px-4 py-1.5 rounded-full text-[0.55rem] font-black tracking-widest ${
                              idx === 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {idx === 0 ? 'NEAREST' : 'UPCOMING'}
                            </span>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[0.65rem] font-black text-slate-900 block">{format(date, 'MMM dd')}</span>
                                <span className="text-[0.55rem] font-bold text-slate-400 uppercase">{event.start_time}</span>
                              </div>
                              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => setDeleteId(event.id)}
                                  className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingId(event.id)
                                    setForm({
                                      ...form,
                                      title: displayTitle,
                                      type: 'event',
                                      event_date: event.event_date || format(new Date(), 'yyyy-MM-dd'),
                                      start_time: event.start_time,
                                      location: event.location || ''
                                    })
                                  }}
                                  className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"
                                >
                                  <Edit3 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-6">
                            <button 
                              onClick={() => toggleComplete(event)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              {isDone && <Sparkles size={12} className="text-white" />}
                            </button>
                            <h4 className={`text-xl font-black transition-all ${
                              isDone ? 'text-slate-300 line-through' : 'text-slate-900 group-hover:text-indigo-600'
                            }`}>
                              {displayTitle}
                            </h4>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-[0.65rem] font-bold text-slate-400">
                              {(event.location?.split(' @ ')[0] || 'Personal') === 'Social' ? <Tag size={12} /> : (event.location?.split(' @ ')[0] || 'Personal') === 'Milestone' ? <Star size={12} /> : <Heart size={12} />}
                              {event.location?.split(' @ ')[0] || 'Personal'}
                            </div>
                            {event.location?.includes(' @ ') && (
                              <div className="flex items-center gap-2 text-[0.65rem] font-bold text-slate-400">
                                <MapPin size={12} />
                                {event.location.split(' @ ')[1]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="bg-slate-50/50 rounded-[3rem] p-12 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="text-slate-200">
                      <Calendar size={48} strokeWidth={1} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-2">No Events Yet</h4>
                      <p className="text-[0.7rem] font-bold text-slate-300 max-w-[200px] leading-relaxed">
                        Your timeline is clear. Add your first personal event to get started.
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary Card */}
                <div className="bg-slate-50/50 rounded-[3rem] p-12 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="text-slate-300">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <p className="text-[0.7rem] font-bold text-slate-400 max-w-[200px] leading-relaxed">
                      Looking ahead... you have 4 more events in November.
                    </p>
                  </div>
                  <button className="text-indigo-600 font-black text-[0.65rem] hover:underline uppercase tracking-widest">
                    View Full Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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
    </div>
  )
}

function MoreVertical({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}
