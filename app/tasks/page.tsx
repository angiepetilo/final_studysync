'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { format, isBefore, startOfDay, isSameDay, addDays } from 'date-fns'
import { 
  Plus, CalendarDays, GraduationCap, 
  CheckCircle2, Circle, MoreVertical, 
  SortAsc, Clock, AlertCircle, ChevronDown, 
  Rocket, Search, Trash2, Edit3, X,
  LayoutGrid, Bell, CheckCircle
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
  const [activeTab, setActiveTab] = useState<TabType>('all')
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
    // Scroll to form on mobile
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

  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    if (activeTab === 'in progress') {
      result = result.filter(t => t.status !== 'completed')
    } else if (activeTab === 'completed') {
      result = result.filter(t => t.status === 'completed')
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
    <div className="flex-1 min-h-screen bg-[#F8FAFC] p-12 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-16">
        <div>
          <span className="text-[0.7rem] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3 block">WORKSPACE</span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Flow & Focus</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search..."
              className="bg-white border border-slate-100 rounded-full py-4 pl-12 pr-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all w-64 shadow-sm"
            />
          </div>
          <NotificationBell userId={userProfile.id} className="w-12 h-12 rounded-full bg-white border border-slate-100" iconSize={22} />
          <UserNav user={userProfile} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 items-start">
        
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-xl shadow-indigo-500/[0.03] space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">
                {editingTaskId ? 'Edit Task' : 'Create New Task'}
              </h2>
              {editingTaskId && (
                <button 
                  onClick={cancelEdit}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title Input */}
              <div className="space-y-3">
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">TITLE</label>
                <input 
                  type="text"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-8 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                />
              </div>

              {/* Course/Project Category */}
              <div className="space-y-3">
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">PROJECT CATEGORY</label>
                <div className="relative">
                  <select 
                    value={form.course_id}
                    onChange={(e) => setForm({...form, course_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-8 py-5 text-sm font-bold text-slate-900 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                  >
                    <option value="">Select Category</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" size={20} />
                </div>
              </div>

              {/* Date & Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">DUE DATE</label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({...form, due_date: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                    />
                    <CalendarDays className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30" size={16} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">PRIORITY</label>
                  <div className="flex gap-2">
                    {['medium', 'high'].map(p => (
                       <button
                         key={p}
                         type="button"
                         onClick={() => setForm({...form, priority: p})}
                         className={`flex-1 h-[60px] rounded-[1.5rem] flex items-center justify-center transition-all ${
                           form.priority === p 
                             ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-100' 
                             : 'bg-slate-50 border border-slate-100 text-slate-400'
                         }`}
                       >
                         {p === 'medium' ? <SortAsc size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
                       </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-3">
                <label className="text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">NOTES (OPTIONAL)</label>
                <textarea 
                  placeholder="Add specific requirements..."
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-8 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button 
                disabled={saving || !form.title}
                type="submit"
                className={`w-full ${editingTaskId ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50 text-white font-black py-6 rounded-[1.75rem] shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4`}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {editingTaskId ? <Edit3 size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                    <span>{editingTaskId ? 'Update Details' : 'Schedule Task'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Pro Tip Box */}
          <div className="bg-indigo-50 rounded-[2.5rem] p-10 border border-indigo-100/50 flex items-start gap-6">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
               <Rocket size={20} className="text-white fill-white" />
            </div>
            <div>
              <span className="text-[0.65rem] font-black text-indigo-600 uppercase tracking-widest block mb-2">PRO TIP</span>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                Tasks created before 9:00 AM are 40% more likely to be completed on time.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: List (8 cols) */}
        <div className="xl:col-span-8 space-y-10">
          
          {/* Tabs & Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
            <div className="flex items-center gap-10">
              {(['All Tasks', 'In Progress', 'Completed'] as const).map((tab) => {
                const id = tab.toLowerCase() as TabType
                const isActive = activeTab === id
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(id)}
                    className={`text-sm font-black transition-all relative pb-2 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">SORT BY:</span>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-100 rounded-xl px-5 py-2 text-xs font-black text-slate-900 appearance-none focus:outline-none min-w-[120px] pr-10 shadow-sm"
                >
                  <option value="deadline">Deadline</option>
                  <option value="created">Recently Added</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" size={14} />
              </div>
            </div>
          </div>

          {/* Task Grid */}
          <div className="space-y-6">
            {filteredTasks.map((task) => {
              const course = getCourse(task.course_id)
              const isCompleted = task.status === 'completed'
              const today = startOfDay(new Date())
              const deadline = task.due_date ? startOfDay(new Date(task.due_date)) : null
              
              let timeLabel = ''
              let timeColor = 'bg-slate-100 text-slate-500'
              
              if (deadline) {
                if (isSameDay(deadline, today)) {
                  timeLabel = 'Today'
                  timeColor = 'bg-red-50 text-red-600'
                } else if (isSameDay(deadline, addDays(today, 1))) {
                  timeLabel = 'Tomorrow'
                  timeColor = 'bg-slate-100 text-slate-600'
                } else if (isBefore(deadline, today)) {
                  timeLabel = 'Overdue'
                  timeColor = 'bg-red-600 text-white'
                } else {
                  timeLabel = format(deadline, 'MMM d')
                }
              }

              return (
                <div 
                  key={task.id}
                  className={`bg-white rounded-[2.5rem] p-4 flex items-center transition-all group relative overflow-hidden ring-4 ring-transparent hover:ring-indigo-600/5 ${isCompleted ? 'opacity-60' : ''}`}
                >
                  {/* Status Indicator Bar */}
                  {!isCompleted && <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-600" />}
                  
                  <div className="flex-1 flex items-center gap-8 pl-8 pr-10 py-4">
                    {/* Circle Checkbox */}
                    <button 
                      onClick={() => toggleComplete(task)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isCompleted 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-white border-slate-200 text-slate-200 group-hover:border-indigo-600'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 size={24} strokeWidth={3} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xl font-black text-slate-900 truncate mb-2 ${isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-6">
                        {course && (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                             <GraduationCap size={16} />
                             {course.title}
                          </div>
                        )}
                        {timeLabel && (
                          <div className={`px-4 py-1.5 rounded-xl text-[0.65rem] font-bold uppercase flex items-center gap-2 ${timeColor}`}>
                            <Clock size={12} strokeWidth={3} />
                            {timeLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-12 shrink-0">
                      {/* Avatars Placeholder */}
                      <div className="flex -space-x-3 items-center">
                        <div className="w-10 h-10 rounded-full border-4 border-white bg-slate-100">
                           <img src={`https://ui-avatars.com/api/?name=${task.title.charAt(0)}&background=random`} className="w-full h-full rounded-full" alt="Avatar" />
                        </div>
                        {isCompleted && (
                          <div className="bg-indigo-100 text-indigo-600 text-[0.6rem] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2 border-white shadow-sm">
                            ARCHIVED
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => startEdit(task)}
                          className="p-3 rounded-2xl text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(task.id)}
                          className="p-3 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={20} />
                        </button>
                        <button className="text-slate-300 hover:text-slate-600 transition-colors">
                          <MoreVertical size={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredTasks.length === 0 && (
              <div className="bg-white border-4 border-dashed border-slate-100 rounded-[3.5rem] p-24 text-center">
                 <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto mb-10 text-slate-300">
                   <LayoutGrid size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-2">Organize with Precision</h3>
                 <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm leading-relaxed">
                   Drag and drop tasks to prioritize or move them between your cloud categories.
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
