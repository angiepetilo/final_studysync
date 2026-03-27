'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { format, isToday, isBefore, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import Link from 'next/link'
import { 
  CheckCircle2, 
  Rocket, Clock, MoreVertical, LayoutGrid, 
  Users, Plus, GraduationCap, BellRing, ChevronRight,
  ChevronLeft, Calendar as CalendarIcon
} from 'lucide-react'
import NotificationBell from '@/components/dashboard/NotificationBell'
import UserNav from '@/components/dashboard/UserNav'
import PomodoroWidget from '@/components/dashboard/PomodoroWidget'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  course_id: string | null
  created_at: string
}

interface Course {
  id: string
  title: string
  color: string
}

interface Collaboration {
  id: string
  title: string
  member_count?: number
}

import PageLayout from '@/components/layout/PageLayout'
import { useData } from '@/context/DataContext'
import { DashboardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'
import { Calendar } from 'lucide-react'

function DashboardCalendar({ tasks, schedules }: { tasks: any[], schedules: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const today = new Date()

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const hasEvent = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd')
    const taskMatch = tasks.some(t => t.due_date && t.due_date.startsWith(dStr))
    const schedMatch = schedules.some(s => s.event_date && s.event_date.startsWith(dStr))
    // Classes are recurring, check day of week
    const classMatch = schedules.some(s => s.type === 'class' && s.day_of_week === date.getDay())
    return taskMatch || schedMatch || classMatch
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[0.65rem]">Academic Calendar</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-black text-slate-900 dark:text-white min-w-[80px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[0.6rem] font-black text-slate-300 uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDate = isSameDay(day, today)
          const events = hasEvent(day)
          
          return (
            <div 
              key={i} 
              className={`
                aspect-square flex flex-col items-center justify-center rounded-xl text-[0.7rem] font-bold relative transition-all cursor-default
                ${isCurrentMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-200 dark:text-slate-700'}
                ${isTodayDate ? 'bg-indigo-600 !text-white shadow-lg shadow-indigo-500/20 dark:shadow-none' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
              `}
            >
              {format(day, 'd')}
              {events && !isTodayDate && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default function DashboardClient() {
  const supabase = createClient()
  const { user, tasks, courses, schedules = [], refreshData, loading: contextLoading } = useData()
  
  const [collabCount, setCollabCount] = useState(0)
  const [recentCollabs, setRecentCollabs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExtraData = async () => {
      if (!user) return
      const [collabCountRes, recentCollabRes] = await Promise.all([
        supabase.from('collaboration_members').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('collaboration_members').select('*, collaborations(*)').eq('user_id', user.id).limit(3),
      ])
      setCollabCount(collabCountRes.count || 0)
      setRecentCollabs(recentCollabRes.data || [])
      setLoading(false)
    }
    if (!contextLoading && user) fetchExtraData()
  }, [user, contextLoading, supabase])

  const stats = useMemo(() => {
    const today = startOfDay(new Date())
    const completed = tasks.filter((t: Task) => t.status === 'completed').length
    const pending = tasks.filter((t: Task) => t.status !== 'completed').length
    const overdue = tasks.filter((t: Task) => {
      if (!t.due_date || t.status === 'completed') return false
      return isBefore(new Date(t.due_date), today)
    }).length
    const todayTasks = tasks.filter((t: Task) => {
      if (!t.due_date) return false
      return isToday(new Date(t.due_date))
    }).length
    return { completed, pending, overdue, todayTasks, progressPct: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0 }
  }, [tasks])

  const recentTasks = useMemo(() => {
    return tasks
      .filter((t: Task) => t.status !== 'completed')
      .sort((a: Task, b: Task) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
      .slice(0, 5)
  }, [tasks])

  const courseStats = useMemo(() => {
    return courses.map((course: Course) => {
      const courseTasks = tasks.filter((t: Task) => t.course_id === course.id)
      const done = courseTasks.filter((t: Task) => t.status === 'completed').length
      return { ...course, pct: courseTasks.length > 0 ? Math.round((done / courseTasks.length) * 100) : 0 }
    }).filter((c: any) => c.pct > 0 || tasks.some((t: Task) => t.course_id === c.id))
  }, [courses, tasks])

  if (contextLoading) {
    return <DashboardSkeleton />
  }

  return (
    <PageLayout>
      <PageHeader 
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Student'}!`}
        subtitle={`You've completed ${stats.progressPct}% of your goals this semester. Keep it up!`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.completed}</span>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Clock size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.pending}</span>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <BellRing size={24} className="text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.overdue}</span>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overdue</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Rocket size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.todayTasks}</span>
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Due Today</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recent Tasks</h2>
              <Link 
                href="/tasks"
                className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-4 py-2 rounded-xl transition-colors"
              >
                View all
              </Link>
            </div>
            
            {recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task: Task) => {
                  const course = courses.find((c: Course) => c.id === task.course_id)
                  const isOverdue = task.due_date && isBefore(new Date(task.due_date), startOfDay(new Date()))
                  
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        task.priority === 'high' ? 'bg-rose-500 shadow-md shadow-rose-500/10 dark:shadow-none' :
                        task.priority === 'medium' ? 'bg-amber-500 shadow-md shadow-amber-500/10 dark:shadow-none' : 'bg-emerald-500 shadow-md shadow-emerald-500/10 dark:shadow-none'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{task.title}</h3>
                        <div className="flex items-center gap-3 mt-1 overflow-x-auto no-scrollbar">
                          {course && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg whitespace-nowrap">
                              {course.title}
                            </span>
                          )}
                          {task.due_date && (
                            <span className={`text-xs font-semibold whitespace-nowrap ${
                              isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid size={32} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold">No pending tasks</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">All caught up! Great job!</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          <DashboardCalendar tasks={tasks} schedules={schedules} />
          <PomodoroWidget />
          
          <Card>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/tasks"
                className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors group border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                  <CheckCircle2 size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">Add Task</span>
              </Link>
              <Link
                href="/notes"
                className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors group border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                  <Plus size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">New Note</span>
              </Link>
              <Link
                href="/collaborations"
                className="flex items-center gap-3 p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors group border border-transparent hover:border-purple-100 dark:hover:border-purple-800"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                  <Users size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-300">Join Room</span>
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Active Courses</h2>
            {courses.length > 0 ? (
              <div className="space-y-4">
                {courses.slice(0, 3).map((course: Course) => (
                  <div key={course.id} className="flex items-center gap-4 group cursor-pointer transition-transform hover:translate-x-1">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${course.color}20`, border: `1px solid ${course.color}40` }}
                    >
                      <GraduationCap size={20} style={{ color: course.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-300 truncate">{course.title}</p>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            backgroundColor: course.color,
                            width: `${courseStats.find((c: any) => c.id === course.id)?.pct || 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 dark:text-slate-500 font-bold italic text-sm">No courses yet</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
