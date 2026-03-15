import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    const [usersRes, coursesRes, tasksRes, feedbackRes, collabRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
      supabase.from('feedback').select('id, status', { count: 'exact' }),
      supabase.from('collaborations').select('id', { count: 'exact', head: true }),
    ])

    const feedbackData = feedbackRes.data || []
    const newFeedback = feedbackData.filter((f: any) => f.status === 'new').length

    return NextResponse.json({
      totalUsers: usersRes.count || 0,
      totalCourses: coursesRes.count || 0,
      totalTasks: tasksRes.count || 0,
      totalFeedback: feedbackRes.count || 0,
      newFeedback,
      totalCollabs: collabRes.count || 0,
    })
  } catch (error: any) {
    return NextResponse.json({
      totalUsers: 0, totalCourses: 0, totalTasks: 0,
      totalFeedback: 0, newFeedback: 0, totalCollabs: 0,
      error: error.message,
    })
  }
}
