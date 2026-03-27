'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { format, isToday, isBefore, startOfDay } from 'date-fns'
import Link from 'next/link'
import { 
  Search, Bell, Settings, CheckCircle2, 
  Rocket, Clock, MoreVertical, LayoutGrid, 
  Users, Sparkles, Plus, GraduationCap, BellRing, ChevronRight
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import UserNav from '@/components/UserNav'

// Types
interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  course_id: string | null
}

interface Course {
  id: string
  title: string
  color: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<{ id: string, full_name: string, email: string } | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [collabCount, setCollabCount] = useState(0)
  const [recentCollabs, setRecentCollabs] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, tasksRes, coursesRes, collabCountRes, recentCollabRes, notifyRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('id', user.id).single(),
        supabase.from('tasks').select('*').eq('user_id', user.id).is('deleted_at', null).order('due_date', { ascending: true }),
        supabase.from('courses').select('*').eq('user_id', user.id),
        supabase.from('collaboration_members').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('collaboration_members').select('*, collaborations(*)').eq('user_id', user.id).limit(3),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      ])
      
      setProfile(profileRes.data ? { ...profileRes.data, email: user.email || '' } : null)
      setTasks(tasksRes.data || [])
      setCourses(coursesRes.data || [])
      setCollabCount(collabCountRes.count || 0)
      setRecentCollabs(recentCollabRes.data || [])
      setNotifications(notifyRes.data || [])
      setLoading(false)
    }
    
    fetchData()
  }, [supabase])

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const inProgressTasksCount = tasks.filter(t => t.status === 'in_progress').length
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length
  const progressPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0

  const courseStats = courses.map(course => {
    const courseTasks = tasks.filter(t => t.course_id === course.id)
    const done = courseTasks.filter(t => t.status === 'completed').length
    const pct = courseTasks.length > 0 ? Math.round((done / courseTasks.length) * 100) : 0
    return { ...course, pct }
  }).filter(c => c.pct > 0 || tasks.some(t => t.course_id === c.id))

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Student'

  return (
    <div className="flex-1 min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-10 overflow-y-auto selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-end mb-16 gap-8">
        <div className="flex items-center gap-4">
          <NotificationBell userId={profile?.id || ''} className="w-12 h-12 rounded-2xl bg-white border border-slate-100" iconSize={20} />
          <UserNav user={{ id: profile?.id || '', email: profile?.email || '', full_name: profile?.full_name || '' }} />
        </div>
      </div>

      {/* Welcome Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-4 animate-fadeIn">Welcome back, {firstName}!</h1>
        <p className="text-lg text-slate-500 font-medium italic opacity-80 leading-relaxed mb-2">
          &quot;The beautiful thing about learning is that no one can take it away from you.&quot;
        </p>
        <p className="text-base font-bold text-slate-600">You&apos;re <span className="text-indigo-600">{progressPct}%</span> through this semester&apos;s goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Feed Section (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#EEF2FF] rounded-[2rem] p-8 border border-indigo-100/50 shadow-sm hover:shadow-indigo-100 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <CheckCircle2 size={20} className="text-indigo-600" />
              </div>
              <div className="text-4xl font-black text-slate-900 mb-1">{completedTasksCount}</div>
              <div className="text-[0.65rem] font-bold text-indigo-600 uppercase tracking-widest opacity-70">Tasks Completed</div>
            </div>
            
            <div className="bg-[#E0F2FE] rounded-[2rem] p-8 border border-blue-100/50 shadow-sm hover:shadow-blue-100 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Rocket size={20} className="text-blue-500" />
              </div>
              <div className="text-4xl font-black text-slate-900 mb-1">{inProgressTasksCount.toString().padStart(2, '0')}</div>
              <div className="text-[0.65rem] font-bold text-blue-500 uppercase tracking-widest opacity-70">In-Progress Tasks</div>
            </div>

            <div className="bg-[#F5F3FF] rounded-[2rem] p-8 border border-purple-100/50 shadow-sm hover:shadow-purple-100 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <LayoutGrid size={20} className="text-purple-500" />
              </div>
              <div className="text-4xl font-black text-slate-900 mb-1">{pendingTasks.length.toString().padStart(2, '0')}</div>
              <div className="text-[0.65rem] font-bold text-purple-500 uppercase tracking-widest opacity-70">Total Pending</div>
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
               Upcoming Milestones
            </h2>
            <div className="flex flex-col gap-4">
              {pendingTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                    <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-tighter">OCT</span>
                    <span className="text-xl font-black text-slate-900">{task.due_date ? format(new Date(task.due_date), "d") : '??'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-slate-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-sm font-bold text-slate-400">
                      {task.due_date ? `Due in ${Math.round((new Date(task.due_date).getTime() - Date.now()) / (1000 * 3600 * 24))} days` : 'No set deadline'} • Project
                    </p>
                  </div>
                  <button className="p-3 rounded-full hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-all">
                    <MoreVertical size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Study Groups Preview Card */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-125" />
            <h2 className="text-2xl font-black mb-1 relative z-10">Study Groups</h2>
            <p className="text-indigo-100 font-bold mb-8 relative z-10 opacity-80 uppercase tracking-widest text-[0.7rem]">{collabCount} Active Collaborations</p>
            
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="flex -space-x-4">
                {[1,2,3].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-indigo-600 bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs ring-2 ring-white/10 overflow-hidden">
                    <Users size={20} />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-indigo-600 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-xs">
                  +12
                </div>
              </div>
            </div>

            <button className="bg-white text-indigo-600 font-bold px-8 py-3.5 rounded-2xl relative z-10 hover:shadow-xl hover:scale-105 transition-all active:scale-95">
              Enter Study Room
            </button>
          </div>

        </div>

        {/* Right Sidebar Section (1 Column) */}
        <div className="space-y-12">
          
          {/* Academic Pulse Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-indigo-500/[0.03]">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl font-black text-slate-900 leading-tight">Academic Pulse</h2>
              <button className="text-slate-300 hover:text-slate-600 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="space-y-10">
              {courseStats.slice(0, 3).map(course => (
                <div key={course.id}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-900">{course.title}</span>
                    <span className="text-sm font-black text-indigo-600">{course.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                    <div 
                      className="h-full bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/20" 
                      style={{ width: `${course.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
              {courseStats.length === 0 && (
                <p className="text-sm font-bold text-slate-400 text-center py-4 italic">No course progress data yet.</p>
              )}
            </div>
          </div>

          {/* Insights Stream */}
          <div>
            <div className="flex items-center justify-between mb-8 px-4">
              <h2 className="text-xl font-black text-slate-900">Insights Stream</h2>
              <button className="text-[0.65rem] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
            </div>
            
            <div className="space-y-8 pl-4">
              {notifications.map((item, i) => (
                <div key={item.id} className="relative pl-10 group">
                  {i !== notifications.length - 1 && <div className="absolute left-4 top-10 bottom-[-32px] w-[2px] bg-slate-100" />}
                  
                  <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center z-10 shadow-sm border border-white`}>
                    <BellRing size={14} className='text-indigo-600' />
                  </div>
                  
                  <div>
                    <h4 className="text-[0.95rem] font-black text-slate-900 mb-1 leading-none">{item.title}</h4>
                    <p className="text-sm font-medium text-slate-500 mb-2 leading-relaxed opacity-80">{item.message}</p>
                    <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                      {item.created_at ? format(new Date(item.created_at), "MMM d, h:mm a") : ''}
                    </span>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm font-bold text-slate-300 italic">No recent activities.</p>
                </div>
              )}
            </div>
          </div>

          {/* Shared Research Canvas Placeholder */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-indigo-500/[0.03]">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-900 leading-tight">Sync Squads</h3>
                <Link href="/collaborations" className="text-[0.65rem] font-black text-indigo-600 uppercase tracking-widest hover:underline">Manage</Link>
             </div>
             
             <div className="space-y-4 mb-8">
                {recentCollabs.map(item => (
                  <Link 
                    key={item.id} 
                    href={`/collaborations/${item.collaborations?.id}`}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 font-black shadow-sm group-hover:scale-105 transition-transform">
                       {item.collaborations?.title?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-xs font-black text-slate-900 truncate">{item.collaborations?.title}</h4>
                       <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">{item.role}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </Link>
                ))}
                {recentCollabs.length === 0 && (
                  <div className="border-2 border-dashed border-slate-100 rounded-3xl p-8 text-center">
                     <p className="text-xs font-bold text-slate-300 italic">No active squads yet.</p>
                  </div>
                )}
             </div>

             <Link href="/collaborations">
              <button className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95 text-sm flex items-center justify-center gap-2">
                  <Users size={16} />
                  Join New Sync
              </button>
             </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
