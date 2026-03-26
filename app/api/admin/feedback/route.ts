import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

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

    // Send email notification if it's a reply
    if (admin_reply) {
      try {
        // Fetch student email
        const { data: fb } = await supabase.from('feedback').select('user_id, message').eq('id', id).single()
        if (fb) {
          const { data: prof } = await supabase.from('profiles').select('email, full_name').eq('id', fb.user_id).single()
          if (prof?.email && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
            })

            await transporter.sendMail({
              from: `"StudySync Support" <${process.env.SMTP_EMAIL}>`,
              to: prof.email,
              subject: 'StudySync - Update on your feedback',
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                  <h2>Hello ${prof.full_name || 'Student'},</h2>
                  <p>An administrator has replied to your feedback:</p>
                  <blockquote style="background: #f4f4f4; padding: 15px; border-left: 4px solid #6C63FF; margin: 20px 0;">
                    <strong>Your Message:</strong><br/>
                    "${fb.message}"
                  </blockquote>
                  <div style="background: #EEF2FF; padding: 15px; border-radius: 8px;">
                    <strong>Admin Reply:</strong><br/>
                    "${admin_reply}"
                  </div>
                  <p style="margin-top: 20px;">Log in to StudySync for more details.</p>
                </div>
              `
            })
            console.log(`Email notification sent to ${prof.email}`)
          }
        }
      } catch (emailErr) {
        console.error('Failed to send admin-reply email notification:', emailErr)
        // We don't throw here, as the DB update was successful
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
