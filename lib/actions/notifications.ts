import { createClient } from '@/lib/supabase'

// Get user notifications (utility function)
export async function getNotifications(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  
  return data
}

// Mark notification as read
export async function markNotificationRead(notificationId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single()
  
  if (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}

// Mark all notifications as read
export async function markAllNotificationsRead(userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  
  if (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
  
  if (error) {
    console.error('Error deleting notification:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Create notification (for system use)
export async function createNotification(userId: string, notificationData: {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  related_id?: string
  related_type?: string
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      ...notificationData,
      read: false
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating notification:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}
