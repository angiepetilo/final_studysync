import { createClient } from '@/lib/supabase'

// Get all users (admin only utility)
export async function getAllUsers() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  
  return data
}

// Get feedback submissions (admin only)
export async function getFeedbackSubmissions() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('feedback')
    .select(`
      *,
      profiles(full_name, email)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching feedback:', error)
    return []
  }
  
  return data
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: 'student' | 'admin' | 'moderator') {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}

// Delete user (admin only)
export async function deleteUser(userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  
  if (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// Get system statistics (admin only)
export async function getSystemStats() {
  const supabase = createClient()
  
  const [usersCount, tasksCount, collaborationsCount] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('collaborations').select('*', { count: 'exact', head: true }),
  ])
  
  return {
    users: usersCount.count || 0,
    tasks: tasksCount.count || 0,
    collaborations: collaborationsCount.count || 0,
  }
}
