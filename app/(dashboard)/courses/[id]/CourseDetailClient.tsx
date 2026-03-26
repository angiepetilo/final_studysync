'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { 
  BookOpen, FileText, CheckSquare, Calendar, 
  ArrowLeft, Clock, MapPin, ChevronRight,
  MoreVertical, File, Download, Trash2,
  ExternalLink, Search, Filter, Plus
} from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'
import { useData } from '@/context/DataContext'
import Link from 'next/link'
import { format } from 'date-fns'

interface CourseData {
  id: string
  title: string
  code: string
  instructor: string
  color: string
}

export default function CourseDetailClient() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { user, loading: contextLoading } = useData()

  const [course, setCourse] = useState<CourseData | null>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'tasks' | 'files' | 'schedule'>('all')

  const fetchData = async () => {
    if (!user || !id) return

    try {
      // Fetch course info
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()
      
      setCourse(courseData)

      // Fetch related data
      const [notesRes, tasksRes, filesRes, schedulesRes] = await Promise.all([
        supabase.from('notes').select('*').eq('course_id', id).order('updated_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('course_id', id).order('due_date'),
        supabase.from('files').select('*').eq('course_id', id).order('created_at', { ascending: false }),
        supabase.from('schedules').select('*').eq('course_id', id).order('event_date').order('start_time')
      ])

      setNotes(notesRes.data || [])
      setTasks(tasksRes.data || [])
      setFiles(filesRes.data || [])
      setSchedules(schedulesRes.data || [])

    } catch (error) {
      console.error('Error fetching course detail:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!contextLoading && user) {
      fetchData()
    }
  }, [id, user, contextLoading])

  if (loading || contextLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </PageLayout>
    )
  }

  if (!course) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <BookOpen size={48} className="text-slate-300" />
          <h2 className="text-xl font-bold text-slate-900">Course Not Found</h2>
          <button onClick={() => router.back()} className="text-indigo-600 font-bold hover:underline flex items-center gap-2">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mb-8">
        <button 
          onClick={() => router.push('/courses')}
          className="group flex items-center gap-2 text-[0.65rem] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Course Hub
        </button>
        
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{ backgroundColor: course.color }}>
            {course.code?.substring(0, 2) || course.title.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{course.title}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{course.code}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{course.instructor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <Card className="p-6 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
              <FileText size={20} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block">{notes.length}</span>
              <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Notes</span>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
              <CheckSquare size={20} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block">{tasks.filter(t => t.status !== 'completed').length}</span>
              <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Open Tasks</span>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
              <File size={20} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block">{files.length}</span>
              <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Files</span>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block">{schedules.filter(s => s.type === 'exam').length}</span>
              <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Upcoming Exams</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-10 mb-12 border-b border-slate-100 dark:border-slate-800 px-4">
        {(['all', 'notes', 'tasks', 'files', 'schedule'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-xs font-black tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.replace('_', ' ')}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-2px_6px_rgba(79,70,229,0.3)]" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-12 pb-20">
        {(activeTab === 'all' || activeTab === 'notes') && notes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recent Notes</h2>
              <Link href="/notes" className="text-[0.6rem] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All Notes</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {notes.slice(0, activeTab === 'all' ? 3 : 20).map(note => (
                <Card key={note.id} className="p-8 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-4 line-clamp-1">{note.title}</h3>
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-600 leading-relaxed line-clamp-3 mb-6">
                    {note.content?.replace(/<[^>]*>/g, '') || 'No content provided.'}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-[0.6rem] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                      {format(new Date(note.updated_at), 'MMM dd, yyyy')}
                    </span>
                    <Link href={`/notes?id=${note.id}`} className="text-slate-300 hover:text-indigo-600">
                      <ExternalLink size={18} />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'tasks') && tasks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Tasks</h2>
              <Link href="/tasks" className="text-[0.6rem] font-black text-indigo-600 uppercase tracking-widest hover:underline">Manage Tasks</Link>
            </div>
            <div className="space-y-4">
              {tasks.filter(t => t.status !== 'completed').slice(0, activeTab === 'all' ? 5 : 50).map(task => (
                <Card key={task.id} className="p-6 flex items-center justify-between group hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-3 h-3 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                    <div>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-[0.65rem] font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> Due {format(new Date(task.due_date), 'MMM dd')}</span>
                        <span className="uppercase tracking-widest">{task.priority} Priority</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/tasks" className="p-3 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-slate-50 transition-all">
                    <ChevronRight size={20} />
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'schedule') && schedules.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Upcoming Dates</h2>
              <Link href="/schedule" className="text-[0.6rem] font-black text-indigo-600 uppercase tracking-widest hover:underline">Full Schedule</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schedules.filter(s => s.type === 'exam' || s.type === 'study').slice(0, activeTab === 'all' ? 4 : 20).map(item => (
                <Card key={item.id} className="p-8 border-l-4 group hover:border-indigo-100 transition-all" style={{ borderLeftColor: item.type === 'exam' ? '#f43f5e' : '#6366f1' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-4 py-1 rounded-full text-[0.55rem] font-black tracking-widest ${item.type === 'exam' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {item.type.toUpperCase()}
                    </span>
                    <span className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">
                      {item.event_date ? format(new Date(item.event_date), 'EEE, MMM dd') : 'Weekly'}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-4">{item.title}</h4>
                  <div className="flex items-center gap-6 text-[0.65rem] font-bold text-slate-400">
                    <span className="flex items-center gap-2"><Clock size={14} /> {item.start_time} - {item.end_time}</span>
                    {item.location && <span className="flex items-center gap-2"><MapPin size={14} /> {item.location}</span>}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'files') && files.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Course Resources</h2>
              <Link href="/files" className="text-[0.6rem] font-black text-indigo-600 uppercase tracking-widest hover:underline">All Files</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {files.slice(0, activeTab === 'all' ? 4 : 40).map(file => (
                <Card key={file.id} className="p-6 group hover:border-indigo-100 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all mb-4">
                    <File size={24} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white truncate mb-1">{file.name}</h4>
                  <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    {(file.size / 1024).toFixed(1)} KB • {file.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="text-[0.6rem] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                       <Download size={12} /> Download
                    </button>
                    <button className="text-slate-300 hover:text-rose-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {notes.length === 0 && tasks.length === 0 && schedules.length === 0 && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/10 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
             <div className="w-20 h-20 rounded-[2.5rem] bg-white dark:bg-slate-900 flex items-center justify-center text-slate-200 mb-6 shadow-sm border border-slate-100">
                <Search size={32} />
             </div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">No Content Yet</h3>
             <p className="text-sm font-bold text-slate-400 dark:text-slate-600 text-center max-w-[300px]">
               Add notes, tasks, or schedule items for this course to see them aggregated here.
             </p>
             <Link href="/notes" className="mt-8 bg-indigo-600 text-white font-black text-[0.65rem] uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
               Start Adding Content
             </Link>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
