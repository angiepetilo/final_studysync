import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { roomId, senderId, senderName, roomTitle } = await request.json()

    if (!roomId || !senderId) {
      return NextResponse.json({ error: 'Missing roomId or senderId' }, { status: 400 })
    }

    // Get all members of the room except the sender
    const { data: members, error } = await supabase
      .from('collaboration_members')
      .select('user_id')
      .eq('collaboration_id', roomId)
      .neq('user_id', senderId)

    if (error) throw error
    if (!members || members.length === 0) return NextResponse.json({ success: true, notified: 0 })

    // Create notifications for each member
    const notifications = members.map(m => ({
      user_id: m.user_id,
      title: `New message in ${roomTitle || 'a room'}`,
      message: `${senderName || 'Someone'} sent a message.`,
    }))

    const { error: insertErr } = await supabase.from('notifications').insert(notifications)
    if (insertErr) throw insertErr

    return NextResponse.json({ success: true, notified: members.length })
  } catch (error: any) {
    console.error('Chat Notify Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
