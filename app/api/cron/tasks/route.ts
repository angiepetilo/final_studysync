import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { isBefore, addDays, startOfDay } from 'date-fns'

// Use service role key to bypass RLS for background jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  // Setup Nodemailer transporter
  // Note: Expects SMTP_USER and SMTP_PASS in env
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  try {
    // 1. Fetch all active users with task notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, notify_tasks')
      .eq('notify_tasks', true)

    if (usersError) throw usersError
    if (!users || users.length === 0) return NextResponse.json({ message: 'No users to notify' })

    const notificationsSent = []

    // 2. Process tasks for each user
    for (const user of users) {
      if (!user.email) continue

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .not('due_date', 'is', null)

      if (tasksError || !tasks || tasks.length === 0) continue

      const today = startOfDay(new Date())
      const next7Days = addDays(today, 7)

      const overdueTasks = tasks.filter(t => isBefore(new Date(t.due_date), today))
      const upcomingTasks = tasks.filter(t => isBefore(new Date(t.due_date), next7Days) && !isBefore(new Date(t.due_date), today))

      if (overdueTasks.length === 0 && upcomingTasks.length === 0) continue

      // 3. Construct Email content
      let emailHtml = `<h2>Hello ${user.full_name || 'Student'},</h2>`
      emailHtml += `<p>Here is your task summary from StudySync.</p>`

      if (overdueTasks.length > 0) {
        emailHtml += `<h3 style="color: red;">Overdue Tasks (${overdueTasks.length})</h3><ul>`
        overdueTasks.forEach(t => {
          emailHtml += `<li><strong>${t.title}</strong> - Due: ${new Date(t.due_date).toLocaleDateString()}</li>`
        })
        emailHtml += `</ul>`
      }

      if (upcomingTasks.length > 0) {
        emailHtml += `<h3 style="color: blue;">Upcoming Tasks in 7 Days (${upcomingTasks.length})</h3><ul>`
        upcomingTasks.forEach(t => {
          emailHtml += `<li><strong>${t.title}</strong> - Due: ${new Date(t.due_date).toLocaleDateString()}</li>`
        })
        emailHtml += `</ul>`
      }

      emailHtml += `<p>Log in to StudySync to manage your tasks!</p>`

      // 4. Send Email if credentials are provided
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        try {
           await transporter.sendMail({
            from: `"StudySync" <${process.env.SMTP_EMAIL}>`,
            to: user.email,
            subject: 'StudySync - Task Reminders',
            html: emailHtml,
          })
          notificationsSent.push(user.email)
        } catch (emailErr) {
          console.error(`Failed to send email to ${user.email}:`, emailErr)
        }
      } else {
        console.warn(`SMTP credentials missing, would have sent email to ${user.email}`)
        notificationsSent.push(`${user.email} (Simulated)`)
      }
    }

    return NextResponse.json({ success: true, notificationsSent })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
