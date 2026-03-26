'use client'

import React, { createContext, useContext, useEffect, ReactNode, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SplashLoader } from '@/components/shared/SplashLoader'

interface UserProfile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
}

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

interface Note {
  id: string
  title: string
  content: string
  status: string
  course_id: string | null
  updated_at: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

interface ScheduleEntry {
  id: string
  title: string
  type: string
  day_of_week: number | null
  event_date: string | null
  start_time: string
  end_time: string
  location: string | null
  course_id: string | null
}

interface DataContextType {
  user: UserProfile | null
  tasks: Task[]
  courses: Course[]
  schedules: ScheduleEntry[]
  notes: Note[]
  notifications: Notification[]
  loading: boolean
  refreshData: () => Promise<void>
  profile: { full_name: string, avatar_url: string } | null
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // 1. Auth Query (Current User)
  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      if (typeof window === 'undefined') return null
      const { data: { session } } = await supabase.auth.getSession()
      return session?.user ?? null
    },
    enabled: typeof window !== 'undefined',
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const userId = authUser?.id

  // 2. Profile Query
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId || typeof window === 'undefined') return null
      const { data, error } = await supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', userId).maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!userId && typeof window !== 'undefined',
  })

  // 3. Tasks Query
  const { data: tasksData = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      if (!userId || typeof window === 'undefined') return []
      const { data, error } = await supabase.from('tasks').select('id, title, status, priority, due_date, course_id, description').eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: false })
      if (error) throw error
      return data as Task[]
    },
    enabled: !!userId && typeof window !== 'undefined',
  })

  // 4. Courses Query
  const { data: coursesData = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', userId],
    queryFn: async () => {
      if (!userId || typeof window === 'undefined') return []
      const { data, error } = await supabase.from('courses').select('id, title, color, instructor').eq('user_id', userId)
      if (error) throw error
      return data as Course[]
    },
    enabled: !!userId && typeof window !== 'undefined',
  })

  // 5. Notes Query
  const { data: notesData = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes', userId],
    queryFn: async () => {
      if (!userId || typeof window === 'undefined') return []
      const { data, error } = await supabase.from('notes').select('id, title, content, status, course_id, updated_at').eq('user_id', userId).is('deleted_at', null).order('updated_at', { ascending: false })
      if (error) throw error
      return data as Note[]
    },
    enabled: !!userId && typeof window !== 'undefined',
  })

  // 6. Notifications Query
  const { data: notifData = [], isLoading: notifLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase.from('notifications').select('id, title, message, read, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      if (error) throw error
      return data as Notification[]
    },
    enabled: !!userId,
  })

  // 7. Schedules Query
  const { data: schedulesData = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', userId],
    queryFn: async () => {
      if (!userId || typeof window === 'undefined') return []
      const { data, error } = await supabase.from('schedules').select('*').eq('user_id', userId)
      if (error) throw error
      return data as ScheduleEntry[]
    },
    enabled: !!userId && typeof window !== 'undefined',
  })

  // Real-time Invalidation
  useEffect(() => {
    if (!userId) return

    const tables = ['profiles', 'tasks', 'courses', 'schedules', 'notes', 'notifications']
    const channels = tables.map(table => {
      return supabase
        .channel(`realtime-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` }, () => {
          console.log(`Invalidating ${table} due to realtime update`)
          queryClient.invalidateQueries({ queryKey: [table, userId] })
        })
        .subscribe()
    })

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [supabase, userId, queryClient])

  // Auth State Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, _session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries()
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear()
        const isCurrentlyAdmin = window.location.pathname.startsWith('/admin')
        const target = isCurrentlyAdmin ? '/admin/login' : '/login'
        if (window.location.pathname !== target) {
          window.location.href = target
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, queryClient])

  const isInitialLoading = (typeof window === 'undefined') || authLoading || profileLoading || tasksLoading || coursesLoading || notesLoading || notifLoading || schedulesLoading

  // DataContext backward compatibility
  const value = useMemo(() => ({
    user: profileData ? {
      id: userId!,
      full_name: profileData.full_name || '',
      email: authUser?.email || '',
      avatar_url: profileData.avatar_url
    } : null,
    tasks: tasksData,
    courses: coursesData,
    schedules: schedulesData,
    notes: notesData,
    notifications: notifData,
    loading: isInitialLoading,
    refreshData: async () => { await queryClient.invalidateQueries() },
    profile: profileData ? {
      full_name: profileData.full_name || '',
      avatar_url: profileData.avatar_url || ''
    } : null
  }), [
    authUser, profileData, tasksData, coursesData, schedulesData, notesData, notifData, 
    isInitialLoading, userId, queryClient
  ])

  return (
    <DataContext.Provider value={value}>
      {isInitialLoading ? <SplashLoader /> : children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
