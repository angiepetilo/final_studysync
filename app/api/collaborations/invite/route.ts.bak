import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { email, roomId, inviterName, roomTitle } = await request.json()

    if (!email || !roomId) {
      return NextResponse.json({ error: 'Missing email or roomId' }, { status: 400 })
    }

    // 1. Find user by email
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (profileErr || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'User not found with that email' }, { status: 404 })
    }

    const newMemberId = profiles[0].id

    // 2. Check if already a member
    const { data: existing } = await supabase
      .from('collaboration_members')
      .select('id')
      .eq('collaboration_id', roomId)
      .eq('user_id', newMemberId)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // 3. Add to room
    const { error: addErr } = await supabase
      .from('collaboration_members')
      .insert({
        collaboration_id: roomId,
        user_id: newMemberId,
        role: 'member',
      })

    if (addErr) throw addErr

    // 4. Create Notification
    await supabase.from('notifications').insert({
      user_id: newMemberId,
      title: 'New Collaboration Invite',
      message: `${inviterName || 'Someone'} invited you to join "${roomTitle || 'a room'}".`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Invite Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
