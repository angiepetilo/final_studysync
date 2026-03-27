'use client'

import { useState, useMemo, useOptimistic } from 'react'
import { format, startOfDay, isSameDay, isBefore } from 'date-fns'
import { 
  Plus, CalendarDays, GraduationCap, 
  CheckCircle2, Circle, MoreVertical, 
  SortAsc, Clock, AlertCircle, ChevronDown, 
  Rocket, Search, Trash2, Edit3, X, Send,
  LayoutGrid, Bell, CheckCircle, Check
} from 'lucide-react'
import NotificationBell from '@/components/dashboard/NotificationBell'
import UserNav from '@/components/dashboard/UserNav'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

import { createTask, updateTask, deleteTask } from '@/lib/actions/student'
import { useRouter } from 'next/navigation'

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

import PageLayout from '@/components/layout/PageLayout'
import { useData } from '@/context/DataContext'
import { TasksSkeleton } from '@/components/shared/LoadingSkeleton'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'

export default function TaskClient() {
  const router = useRouter()
  const { user, tasks, courses, refreshData, loading: contextLoading } = useData()
  
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'deadline' | 'created'>('deadline')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  
  const [form, setForm] = useState({ 
    title: '', 
    course_id: '', 
    priority: 'medium', 
    due_date: '',
    description: ''
  })

  const [sharingTask, setSharingTask] = useState<Task | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    
    const payload = {
      title: form.title,
      course_id: form.course_id || undefined,
      priority: form.priority as 'low' | 'medium' | 'high',
      due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
      description: form.description || undefined,
    }

    let result
    if (editingTaskId) {
      result = await updateTask(editingTaskId, { ...payload, status: 'pending' })
    } else if (user) {
      result = await createTask(user.id, payload)
    } else {
      setSaving(false)
      return
    }

    if (result.success) {
      setForm({ title: '', course_id: '', priority: 'medium', due_date: '', description: '' })
      setEditingTaskId(null)
      await refreshData()
    }

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
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const cancelEdit = () => {
    setEditingTaskId(null)
    setForm({ title: '', course_id: '', priority: 'medium', due_date: '', description: '' })
  }

  const toggleComplete = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    const result = await updateTask(task.id, { status: nextStatus })
    if (result.success) {
      await refreshData()
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const result = await deleteTask(deleteId)
    if (result.success) {
      setDeleteId(null)
      await refreshData()
    }
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
      result = result.filter(t => {
        if (!t.due_date) return false
        const taskDate = startOfDay(new Date(t.due_date))
        return isBefore(today, taskDate) && !isSameDay(taskDate, today)
      })
    } else if (activeTab === 'overdue') {
      result = result.filter(t => {
        if (!t.due_date || t.status === 'completed') return false
        const taskDate = startOfDay(new Date(t.due_date))
        return isBefore(taskDate, today) && !isSameDay(taskDate, today)
      })
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

  if (contextLoading) {
    return <TasksSkeleton />
  }

  return (
    <PageLayout>
      <PageHeader 
        title="Tasks"
        subtitle="Manage your academic load with ease."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl">
              {(['all', 'today', 'upcoming', 'overdue'] as const).map((tab) => {
                const isActive = activeTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black capitalize transition-all ${
                      isActive ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>

            <button 
              onClick={() => setSortBy(sortBy === 'deadline' ? 'created' : 'deadline')}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
            >
              <span>{sortBy === 'deadline' ? 'By Deadline' : 'By Created'}</span>
              <SortAsc size={14} className="group-hover:translate-y-[-1px] transition-transform" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Stats */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="p-8">
            <div className="flex items-center gap-4 text-indigo-600 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <Plus size={24} strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{editingTaskId ? 'Edit Task' : 'New Task'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Task Title</label>
                <input 
                  type="text"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Course</label>
                  <div className="relative">
                    <select 
                      value={form.course_id}
                      onChange={(e) => setForm({...form, course_id: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white appearance-none focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                    >
                      <option value="">No Course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Due Date</label>
                  <input 
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({...form, due_date: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Priority</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({...form, priority: p})}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black capitalize transition-all border-2 ${
                        form.priority === p 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 text-indigo-600' 
                          : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-400 hover:border-indigo-100 dark:hover:border-indigo-900/40'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                disabled={saving || !form.title}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
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
                  className="w-full text-slate-400 dark:text-slate-500 font-black text-xs py-2 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Cancel Editing
                </button>
              )}
            </form>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center py-6">
              <span className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Completed</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.completed}</p>
            </Card>
            <Card className="text-center py-6">
              <span className="text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Remaining</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.remaining}</p>
            </Card>
          </div>
        </div>

        {/* Right Column: Task List */}
        <div className="xl:col-span-8 space-y-4">
          {filteredTasks.map((task) => {
            const course = getCourse(task.course_id)
            const isCompleted = task.status === 'completed'
            const deadline = task.due_date ? new Date(task.due_date) : null
            
            return (
              <Card 
                key={task.id}
                className={`p-4 flex items-center transition-all group hover:border-indigo-200 dark:hover:border-indigo-800 ${isCompleted ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : ''}`}
              >
                <div className="flex-1 flex items-center gap-6 md:gap-8 px-2">
                  <button 
                    onClick={() => toggleComplete(task)}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                      isCompleted 
                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-100 dark:shadow-none' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-indigo-500'
                    }`}
                  >
                    {isCompleted ? <Check size={20} strokeWidth={4} /> : <div className="w-3 h-3 rounded-md bg-transparent border-2 border-slate-100 dark:border-slate-800" />}
                  </button>

                  <div 
                    onClick={() => startEdit(task)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <h3 className={`text-lg md:text-xl font-black text-slate-900 dark:text-white truncate mb-1 ${isCompleted ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      {course && (
                        <span className="text-[0.65rem] font-black px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                           {course.title}
                        </span>
                      )}
                      {deadline && (
                        <div className="flex items-center gap-1.5 text-[0.7rem] font-bold text-slate-400 dark:text-slate-500">
                          <CalendarDays size={12} />
                          {format(deadline, 'MMM d')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-8 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-[0.6rem] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] block mb-0.5">Priority</span>
                      <span className={`text-[0.7rem] font-black uppercase tracking-wider ${
                        task.priority === 'high' ? 'text-rose-500' : 
                        task.priority === 'medium' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setDeleteId(task.id)}
                        className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all sm:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}

          {filteredTasks.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 md:p-24 text-center">
               <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-700">
                 <LayoutGrid size={28} />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No tasks found</h3>
               <p className="text-slate-400 dark:text-slate-500 font-bold text-sm max-w-xs mx-auto">
                 Ready to smash some deadlines? Create your first task!
               </p>
            </div>
          )}
        </div>
      </div>



      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="This will permanently archive the task. This action cannot be undone."
      />
    </PageLayout>
  )
}
