'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { format, isBefore, startOfDay, isSameDay, addDays } from 'date-fns'
import { 
  Plus, CalendarDays, GraduationCap, 
  CheckCircle2, Circle, MoreVertical, 
  SortAsc, Clock, AlertCircle, ChevronDown, 
  Rocket, Search, Trash2, Edit3, X,
  LayoutGrid, Bell, CheckCircle, Check
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import UserNav from '@/components/UserNav'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Task {
  id: string
  title: string
  description: string
  priority: string
  status: string
  due_date: string | null
  course_id: string | null
  created_at: string
}

interface Course {
  id: string
  title: string
  color: string
}

type TabType = 'all' | 'in progress' | 'completed'

export default function TasksPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming'>('all')
  const [sortBy, setSortBy] = useState<'deadline' | 'created'>('deadline')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ id: string, full_name: string, email: string }>({ id: '', full_name: '', email: '' })
  
  // State for Editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  
  // Form State
  const [form, setForm] = useState({ 
    title: '', 
    course_id: '', 
    priority: 'medium', 
    due_date: '',
    description: ''
  })

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    setUserProfile({ id: user.id, full_name: profile?.full_name || '', email: user.email || '' })

    const [tasksRes, coursesRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title, color').eq('user_id', user.id),
    ])
    setTasks(tasksRes.data || [])
    setCourses(coursesRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      title: form.title,
      course_id: form.course_id || null,
      priority: form.priority,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      description: form.description || null,
      status: 'pending'
    }

    if (editingTaskId) {
      await supabase.from('tasks').update(payload).eq('id', editingTaskId)
    } else {
      await supabase.from('tasks').insert({ ...payload, user_id: user.id })
    }

    setForm({ title: '', course_id: '', priority: 'medium', due_date: '', description: '' })
    setEditingTaskId(null)
    fetchData()
    setSaving(false)
  }

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setForm({
      title: task.title,
      course_id: task.course_id || '',
      priority: task.priority,
      due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
      description: task.description || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingTaskId(null)
    setForm({ title: '', course_id: '', priority: 'medium', due_date: '', description: '' })
  }

  const toggleComplete = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t))
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId)
    setDeleteId(null)
    fetchData()
  }

  const getCourse = (id: string | null) => courses.find(c => c.id === id)

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed').length
    const remaining = tasks.filter(t => t.status !== 'completed').length
    return { completed, remaining }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    let result = [...tasks]
    const today = startOfDay(new Date())

    if (activeTab === 'today') {
      result = result.filter(t => t.due_date && isSameDay(new Date(t.due_date), today))
    } else if (activeTab === 'upcoming') {
      result = result.filter(t => t.due_date && isBefore(today, startOfDay(new Date(t.due_date))) && !isSameDay(new Date(t.due_date), today))
    }

    result.sort((a, b) => {
      if (sortBy === 'deadline') {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [tasks, activeTab, sortBy])

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
      <div className="flex items-center justify-end mb-12">
        <div className="flex items-center gap-4">
          <NotificationBell userId={userProfile.id} className="w-12 h-12 rounded-2xl bg-white border border-slate-100" iconSize={20} />
          <UserNav user={userProfile} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-3">Tasks</h1>
            <p className="text-slate-400 font-bold">Manage your academic load with ease.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex p-1 bg-slate-200/50 rounded-2xl">
              {(['All Tasks', 'Today', 'Upcoming'] as const).map((tab) => {
                const id = tab.toLowerCase() as any
                const isActive = activeTab === id
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(id)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                      isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>

            <button 
              onClick={() => setSortBy(sortBy === 'deadline' ? 'created' : 'deadline')}
              className="px-6 py-3 rounded-2xl text-indigo-600 font-black text-sm flex items-center gap-2 hover:bg-white transition-all group"
            >
              <span>Sort by {sortBy === 'deadline' ? 'Date' : 'Created'}</span>
              <SortAsc size={18} className="group-hover:translate-y-[-2px] transition-transform" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Form & Stats */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-8">
              <div className="flex items-center gap-4 text-indigo-600 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Plus size={24} strokeWidth={3} />
                </div>
                <h2 className="text-xl font-black text-slate-900">{editingTaskId ? 'Edit Task' : 'New Task'}</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Task Title</label>
                  <input 
                    type="text"
                    placeholder="Enter task name..."
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Course</label>
                  <div className="relative">
                    <select 
                      value={form.course_id}
                      onChange={(e) => setForm({...form, course_id: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 appearance-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Priority</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({...form, priority: p})}
                        className={`flex-1 py-3 rounded-xl text-xs font-black capitalize transition-all border-2 ${
                          form.priority === p 
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-600' 
                            : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest pl-1">Due Date</label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({...form, due_date: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />
                    <CalendarDays className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                <button 
                  disabled={saving || !form.title}
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Rocket size={18} strokeWidth={3} />
                      <span>{editingTaskId ? 'Update Task' : 'Create Task'}</span>
                    </>
                  )}
                </button>
                {editingTaskId && (
                  <button 
                    type="button"
                    onClick={cancelEdit}
                    className="w-full text-slate-400 font-black text-xs py-2 hover:text-slate-600 transition-colors"
                  >
                    Cancel Editing
                  </button>
                )}
              </form>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 text-center space-y-2">
                <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest block">Completed</span>
                <p className="text-4xl font-black text-slate-900">{stats.completed.toString().padStart(2, '0')}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 text-center space-y-2">
                <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest block">Remaining</span>
                <p className="text-4xl font-black text-slate-900">{stats.remaining.toString().padStart(2, '0')}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Task List */}
          <div className="lg:col-span-8 space-y-6">
            {filteredTasks.map((task) => {
              const course = getCourse(task.course_id)
              const isCompleted = task.status === 'completed'
              const deadline = task.due_date ? new Date(task.due_date) : null
              
              return (
                <div 
                  key={task.id}
                  className={`bg-white rounded-[2.5rem] p-4 flex items-center transition-all group hover:shadow-xl hover:shadow-indigo-500/[0.03] border border-transparent hover:border-indigo-100 ${isCompleted ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1 flex items-center gap-8 px-6 py-4">
                    <button 
                      onClick={() => toggleComplete(task)}
                      className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${
                        isCompleted 
                          ? 'bg-indigo-500 border-indigo-500 text-white' 
                          : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-500'
                      }`}
                    >
                      {isCompleted ? <Check size={20} strokeWidth={4} /> : <div className="w-3 h-3 rounded-md bg-transparent border-2 border-slate-100" />}
                    </button>

                    <div 
                      onClick={() => startEdit(task)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <h3 className={`text-xl font-black text-slate-900 truncate mb-2 ${isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-4">
                        {course && (
                          <div className="px-4 py-1.5 rounded-xl bg-indigo-50 text-[0.65rem] font-black text-indigo-600 uppercase tracking-wider">
                             {course.title}
                          </div>
                        )}
                        {deadline && (
                          <div className="flex items-center gap-2 text-[0.7rem] font-bold text-slate-400">
                            <CalendarDays size={14} />
                            {format(deadline, 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <span className="text-[0.6rem] font-black text-slate-300 uppercase tracking-[0.2em] block mb-1">Priority</span>
                        <span className={`text-xs font-black ${
                          task.priority === 'high' ? 'text-rose-500' : 
                          task.priority === 'medium' ? 'text-indigo-600' : 'text-slate-400'
                        }`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setDeleteId(task.id)}
                          className="p-3 rounded-2xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredTasks.length === 0 && (
              <div className="bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3rem] p-24 text-center">
                 <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mx-auto mb-8 text-slate-200">
                   <LayoutGrid size={32} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">No tasks found</h3>
                 <p className="text-slate-400 font-bold text-sm max-w-xs mx-auto">
                   Looks like your schedule is clear for this category. Ready to add something new?
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="This will permanently archive the task. This action cannot be undone."
      />
    </div>
  )
}
