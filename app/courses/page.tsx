'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/ConfirmDialog'
import { 
  Plus, Search, Bell, MoreVertical, 
  BookOpen, StickyNote, CheckSquare, 
  Trash2, Edit3, X, Activity, PlusCircle, Sparkles
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import UserNav from '@/components/UserNav'

const COLORS = [
  { value: '#4338CA', name: 'Indigo' },
  { value: '#3B82F6', name: 'Blue' },
  { value: '#F97316', name: 'Orange' },
  { value: '#10B981', name: 'Emerald' },
  { value: '#D946EF', name: 'Fuchsia' },
  { value: '#94A3B8', name: 'Slate' }
]

interface Course {
  id: string
  title: string
  instructor: string
  color: string
  task_count: number
  note_count: number
}

export default function CoursesPage() {
  const supabase = createClient()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', instructor: '', color: COLORS[0].value })
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userProfile, setUserProfile] = useState<{ id: string, full_name: string, email: string }>({ id: '', full_name: '', email: '' })

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    setUserProfile({ id: user.id, full_name: profile?.full_name || '', email: user.email || '' })

    const { data: coursesData } = await supabase.from('courses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    if (coursesData) {
      const enriched = await Promise.all(
        coursesData.map(async (course: any) => {
          const [tasks, notes] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('course_id', course.id).is('deleted_at', null),
            supabase.from('notes').select('*', { count: 'exact', head: true }).eq('course_id', course.id).is('deleted_at', null),
          ])
          return { ...course, task_count: tasks.count || 0, note_count: notes.count || 0 }
        })
      )
      setCourses(enriched)
    }
    setLoading(false)
  }

  useEffect(() => { fetchCourses() }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingCourse) {
      await supabase.from('courses').update({ 
        title: form.title, 
        instructor: form.instructor, 
        color: form.color, 
        updated_at: new Date().toISOString() 
      }).eq('id', editingCourse.id)
    } else {
      await supabase.from('courses').insert({ 
        title: form.title, 
        instructor: form.instructor, 
        color: form.color, 
        user_id: user.id 
      })
    }
    
    setForm({ title: '', instructor: '', color: COLORS[0].value })
    setEditingCourse(null)
    setSaving(false)
    fetchCourses()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('courses').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchCourses()
  }

  const filteredCourses = useMemo(() => {
    return courses.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.instructor?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [courses, searchQuery])

  const summary = useMemo(() => {
    return courses.reduce((acc, c) => ({
      notes: acc.notes + (c.note_count || 0),
      tasks: acc.tasks + (c.task_count || 0)
    }), { notes: 0, tasks: 0 })
  }, [courses])

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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Courses Hub</h1>
        
        <div className="flex items-center gap-4">
          <NotificationBell userId={userProfile.id} className="w-12 h-12 rounded-2xl bg-white border border-slate-100" iconSize={20} />
          <UserNav user={userProfile} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* Left Column: Management */}
        <div className="lg:col-span-4 space-y-10">
          
          {/* Add Course Card */}
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/[0.03] border border-slate-100 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Plus size={20} strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {editingCourse ? 'Edit Course' : 'Add Course'}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Course Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Advanced Astrophysics"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Instructor</label>
                <input 
                  type="text"
                  placeholder="e.g. Dr. Sarah Miller"
                  value={form.instructor}
                  onChange={(e) => setForm({...form, instructor: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Identity Color</label>
                <div className="flex gap-3 bg-slate-50 p-3 rounded-[1.5rem] w-fit">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setForm({...form, color: c.value})}
                      className={`w-7 h-7 rounded-full transition-all ${
                        form.color === c.value ? 'ring-4 ring-indigo-500/10 scale-110 shadow-lg' : 'hover:scale-105 opacity-80'
                      }`}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving || !form.title}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{editingCourse ? 'Save Changes' : 'Create Course'}</span>
                )}
              </button>

              {editingCourse && (
                <button 
                  onClick={() => {
                    setEditingCourse(null)
                    setForm({ title: '', instructor: '', color: COLORS[0].value })
                  }}
                  className="w-full text-center text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </div>

          {/* Weekly Summary Card */}
          <div className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100 flex items-center gap-8">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
              <Activity size={28} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Weekly Summary</h4>
              <p className="text-[0.7rem] font-bold text-indigo-500/70 leading-relaxed max-w-[180px]">
                You have <span className="text-indigo-600">{summary.notes} notes</span> and <span className="text-indigo-600">{summary.tasks} pending tasks</span> across {courses.length} courses this week.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Courses Feed */}
        <div className="lg:col-span-8 space-y-12">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-transparent hover:border-indigo-100 transition-all group flex flex-col h-[320px] relative overflow-hidden"
              >
                {/* Top accent line */}
                <div 
                  className="absolute top-0 left-8 right-8 h-1.5 rounded-b-full transition-all group-hover:h-2"
                  style={{ background: course.color }}
                />

                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingCourse(course)
                        setForm({ title: course.title, instructor: course.instructor || '', color: course.color })
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteId(course.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-auto">
                  <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-[0.75rem] font-bold text-slate-400">
                    {course.instructor || 'General Subject'}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-8">
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/80 rounded-2xl">
                    <StickyNote size={14} className="text-slate-300" style={{ color: `${course.color}80` }} />
                    <span className="text-xs font-black text-slate-600">{course.note_count.toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/80 rounded-2xl">
                    <CheckSquare size={14} className="text-slate-300" style={{ color: `${course.color}80` }} />
                    <span className="text-xs font-black text-slate-600">{course.task_count.toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty Slot Card */}
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center h-[320px] group cursor-pointer hover:bg-white hover:border-indigo-100 transition-all p-8 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-all mb-6">
                <PlusCircle size={28} strokeWidth={2.5} />
              </div>
              <h5 className="text-sm font-black text-slate-900 mb-2">New Subject?</h5>
              <p className="text-[0.7rem] font-bold text-slate-400 leading-relaxed max-w-[150px]">
                Click the form on the left to add your next academic challenge.
              </p>
            </div>
          </div>

          {/* Insights Section */}
          <div className="pt-8">
            <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-indigo-500/[0.04] border border-slate-100 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden group">
              
              {/* Decorative ornament */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-indigo-50/30 -skew-x-12 translate-x-32 group-hover:translate-x-24 transition-transform duration-1000" />
              
              <div className="relative z-10 flex-1 space-y-6 text-center md:text-left">
                <span className="px-5 py-2 rounded-full bg-indigo-50 text-[0.6rem] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  Study Insights
                </span>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                  Master Your Schedule
                </h3>
                <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-lg">
                  StudSync analyzes your course load to suggest optimal study blocks. You're currently performing 15% better in your core technical subjects compared to last semester.
                </p>
                <button className="bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs px-8 py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95">
                  View Full Analytics
                </button>
              </div>

              <div className="relative z-10 w-full md:w-64 aspect-square flex items-center justify-center">
                <div className="w-full h-full bg-indigo-50 rounded-[4rem] rotate-12 flex items-center justify-center relative overflow-hidden">
                  <Sparkles size={64} className="text-indigo-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <Activity size={80} className="text-indigo-500 relative z-10 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message="This will permanently delete this course. Tasks and notes linked to it will be unlinked."
      />
    </div>
  )
}
