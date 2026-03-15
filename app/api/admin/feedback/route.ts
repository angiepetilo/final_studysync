import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: Fetch all feedback (admin use)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
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
