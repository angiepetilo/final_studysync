'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { 
  Plus, Search, Bell, MoreVertical, 
  BookOpen, StickyNote, CheckSquare, 
  Trash2, Edit3, X, Activity, PlusCircle, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'
import { useData } from '@/context/DataContext'
import { CoursesSkeleton } from '@/components/shared/LoadingSkeleton'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'
import { ChevronDown } from 'lucide-react'

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
  const { user, tasks: globalTasks, courses: globalCourses, notes: globalNotes, refreshData, loading: contextLoading } = useData()
  
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', instructor: '', color: COLORS[0].value })
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Client-side enrichment using global data
  const courses = useMemo(() => {
    return globalCourses.map(course => {
      const task_count = globalTasks.filter(t => t.course_id === course.id).length
      const note_count = globalNotes.filter(n => n.course_id === course.id).length
      return { 
        ...course, 
        instructor: (course as any).instructor || '', 
        task_count, 
        note_count 
      }
    })
  }, [globalCourses, globalTasks, globalNotes])

  const handleSave = async () => {
    setSaving(true)
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
    await refreshData()
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('courses').delete().eq('id', deleteId)
    setDeleteId(null)
    await refreshData()
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

  if (contextLoading) {
    return <CoursesSkeleton />
  }

  return (
    <PageLayout>
      <PageHeader 
        title="Courses Hub"
        subtitle="Organize your curriculum and track your progress."
        action={
          <div className="relative">
            <input 
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        {/* Left Column: Management */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-8">
          <Card className="p-8 md:p-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <PlusCircle size={24} strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {editingCourse ? 'Edit Course' : 'Add Course'}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Course Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Advanced Astrophysics"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Instructor</label>
                <input 
                  type="text"
                  placeholder="e.g. Dr. Sarah Miller"
                  value={form.instructor}
                  onChange={(e) => setForm({...form, instructor: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Identity Color</label>
                <div className="flex flex-wrap gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm({...form, color: c.value})}
                      className={`w-8 h-8 rounded-xl transition-all ${
                        form.color === c.value ? 'ring-4 ring-indigo-500/20 scale-110 shadow-lg' : 'hover:scale-105 opacity-80'
                      }`}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving || !form.title}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
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
                  className="w-full text-center text-slate-400 dark:text-slate-500 font-bold text-xs hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </Card>

          <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 p-8 flex items-center gap-8">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
              <Activity size={28} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">Weekly Summary</h4>
              <p className="text-[0.7rem] font-bold text-slate-400 dark:text-slate-500 leading-relaxed max-w-[180px]">
                You have <span className="text-indigo-600 dark:text-indigo-400">{summary.notes} notes</span> and <span className="text-indigo-600 dark:text-indigo-400">{summary.tasks} tasks</span> pending across {courses.length} courses.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Courses Feed */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card 
                key={course.id}
                className="h-[320px] relative overflow-hidden group flex flex-col p-8 hover:shadow-xl transition-all"
              >
                {/* Top accent line */}
                <div 
                  className="absolute top-0 left-8 right-8 h-1.5 rounded-b-full transition-all group-hover:h-2"
                  style={{ background: course.color }}
                />

                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingCourse(course)
                        setForm({ title: course.title, instructor: course.instructor || '', color: course.color })
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="p-2 text-slate-300 dark:text-slate-700 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(course.id)
                      }}
                      className="p-2 text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <Link href={`/courses/${course.id}`} className="flex-1 flex flex-col group/link">
                  <div className="mb-auto">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors">
                      {course.title}
                    </h4>
                    <p className="text-[0.75rem] font-bold text-slate-400 dark:text-slate-500">
                      {course.instructor || 'General Subject'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-8">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl">
                      <StickyNote size={14} style={{ color: course.color }} />
                      <span className="text-xs font-black text-slate-600 dark:text-slate-400">{course.note_count.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl">
                      <CheckSquare size={14} style={{ color: course.color }} />
                      <span className="text-xs font-black text-slate-600 dark:text-slate-400">{course.task_count.toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}

            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-slate-50 dark:bg-slate-900/50 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center h-[320px] group cursor-pointer hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all p-8 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 transition-all mb-6">
                <PlusCircle size={28} strokeWidth={2.5} />
              </div>
              <h5 className="text-sm font-black text-slate-900 dark:text-white mb-2">New Subject?</h5>
              <p className="text-[0.7rem] font-bold text-slate-400 dark:text-slate-500 leading-relaxed max-w-[150px]">
                Click the form on the left to add your next academic challenge.
              </p>
            </div>
          </div>

          <Card className="p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-indigo-50/30 dark:bg-indigo-900/5 -skew-x-12 translate-x-32 group-hover:translate-x-24 transition-transform duration-1000" />
            
            <div className="relative z-10 space-y-6">
              <span className="px-5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-[0.6rem] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
                Study Insights
              </span>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Master Your Schedule
              </h3>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500 leading-relaxed max-w-lg">
                StudSync analyzes your course load to suggest optimal study blocks. You&apos;re currently performing 15% better in your core technical subjects compared to last semester.
              </p>
              <button className="bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-black text-xs px-8 py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95">
                View Full Analytics
              </button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message="This will permanently delete this course. Tasks and notes linked to it will be unlinked."
      />
    </PageLayout>
  )
}
