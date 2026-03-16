import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Fetch all feedback (admin use)
export async function GET() {
  try {
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (feedbackError) throw feedbackError

    if (!feedbackData || feedbackData.length === 0) {
      return NextResponse.json([])
    }

    const userIds = [...new Set(feedbackData.map((f: any) => f.user_id))]
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles for feedback:', profilesError)
      // Continue anyway, just without profile info
    }

    const profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
      acc[p.id] = p
      return acc
    }, {})

    const finalData = feedbackData.map((f: any) => ({
      ...f,
      profiles: profilesMap[f.user_id] || null
    }))

    return NextResponse.json(finalData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Update feedback status or reply (admin use)
export async function PATCH(request: Request) {
  try {
    const { id, status, admin_reply } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing feedback id' }, { status: 400 })

    const updates: any = {}
    if (status) updates.status = status
    if (admin_reply !== undefined) updates.admin_reply = admin_reply

    const { error } = await supabase.from('feedback').update(updates).eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
