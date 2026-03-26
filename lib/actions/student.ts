import { createClient } from '@/lib/supabase'

// Task-related utility functions (converted from server actions for static export)
export async function getTasks(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
  
  return data
}

export async function getFiles(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching files:', error)
    return []
  }
  
  return data
}

export async function createTask(userId: string, taskData: {
  title: string
  description?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  course_id?: string
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user_id: userId,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating task:', error)
    return { success: false, error: error.message }
  }
  

  return { success: true, data }
}

export async function updateTask(taskId: string, updates: {
  title?: string
  description?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'in_progress' | 'completed'
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating task:', error)
    return { success: false, error: error.message }
  }
  

  return { success: true, data }
}

export async function deleteTask(taskId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
  
  if (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: error.message }
  }
  

  return { success: true }
}

// Collaboration-related server actions
export async function getCollaborations(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collaboration_members')
    .select(`
      role,
      collaborations (
        *,
        collaboration_members (
          user_id,
          profiles (full_name, email)
        )
      )
    `)
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error fetching collaborations:', error)
    return []
  }
  
  // Flatten the result to return collaboration objects
  return data.map((item: any) => item.collaborations).filter(Boolean)
}

export async function createCollaboration(userId: string, collaborationData: {
  title: string
  description?: string
  type: 'study_group' | 'project' | 'notes_sharing',
  visibility?: 'private' | 'public'
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collaborations')
    .insert({
      ...collaborationData,
      owner_id: userId
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating collaboration:', error)
    return { success: false, error: error.message }
  }
  
  // Add owner as member
  await supabase
    .from('collaboration_members')
    .insert({
      collaboration_id: data.id,
      user_id: userId,
      role: 'owner'
    })
  

  return { success: true, data }
}

export async function joinCollaboration(collaborationId: string, userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('collaboration_members')
    .insert({
      collaboration_id: collaborationId,
      user_id: userId,
      role: 'member'
    })
  
  if (error) {
    console.error('Error joining collaboration:', error)
    return { success: false, error: error.message }
  }
  

  return { success: true }
}

export async function leaveCollaboration(collaborationId: string, userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('collaboration_members')
    .delete()
    .eq('collaboration_id', collaborationId)
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error leaving collaboration:', error)
    return { success: false, error: error.message }
  }
  

  return { success: true }
}

export async function addCollaborationMember(collaborationId: string, email: string) {
  const supabase = createClient()
  
  // 1. Find user by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .single()
  
  if (profileError || !profile) {
    return { success: false, error: 'User not found with this email' }
  }
  
  // 2. Check if already a member
  const { data: existing, error: existingError } = await supabase
    .from('collaboration_members')
    .select('id')
    .eq('collaboration_id', collaborationId)
    .eq('user_id', profile.id)
    .single()
  
  if (existing) {
    return { success: false, error: 'User is already a member of this room' }
  }
  
  // 3. Add as member
  const { error: joinError } = await supabase
    .from('collaboration_members')
    .insert({
      collaboration_id: collaborationId,
      user_id: profile.id,
      role: 'member'
    })
  
  if (joinError) {
    return { success: false, error: joinError.message }
  }
  
  return { success: true, profile }
}

export async function getDiscoverableCollaborations(userId: string) {
  const supabase = createClient()
  
  // Get all public collaborations
  const { data, error } = await supabase
    .from('collaborations')
    .select(`
      *,
      collaboration_members (
        user_id
      )
    `)
    .eq('visibility', 'public')
  
  if (error) {
    console.error('Error fetching discoverable collaborations:', error)
    return []
  }
  
  return data
}

// Get collaboration messages
export async function getCollaborationMessages(collaborationId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collaboration_messages')
    .select(`
      *,
      profiles(full_name, email, avatar_url)
    `)
    .eq('collaboration_id', collaborationId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching collaboration messages:', error)
    return []
  }
  
  return data
}

// Send collaboration message
export async function sendCollaborationMessage(params: {
  collaborationId: string,
  userId: string,
  content?: string,
  fileUrl?: string | null,
  fileName?: string | null,
  fileType?: string | null,
  messageType?: 'text' | 'image' | 'file' | 'shared_note' | 'shared_task',
  metadata?: any
}) {
  const {
    collaborationId,
    userId,
    content,
    fileUrl = null,
    fileName = null,
    fileType = null,
    messageType = 'text',
    metadata = null
  } = params

  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('collaboration_messages')
    .insert({
      collaboration_id: collaborationId,
      user_id: userId,
      content: content || '',
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      message_type: messageType,
      metadata: metadata,
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      profiles(full_name, email, avatar_url)
    `)
    .single()
  
  if (error) {
    console.error('Error sending message:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}

// Share a resource (Note, Task, File) to a collaboration
export async function shareResourceToCollaboration(params: {
  collaborationId: string,
  userId: string,
  resourceType: 'file' | 'note' | 'task' | 'url',
  resourceId?: string,
  title: string,
  description?: string,
  url?: string,
  fileSize?: string,
  messageContent?: string
}) {
  const supabase = createClient()
  
  // 1. Insert into collaboration_resources
  const { data: resource, error: resourceError } = await supabase
    .from('collaboration_resources')
    .insert({
      collaboration_id: params.collaborationId,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      title: params.title,
      description: params.description,
      url: params.url,
      file_size: params.fileSize,
      shared_by: params.userId
    })
    .select()
    .single()

  if (resourceError) {
    console.error('Error adding resource:', resourceError)
    return { success: false, error: resourceError.message }
  }

  // 2. Insert into collaboration_messages (to show in chat)
  let messageType: 'file' | 'shared_note' | 'shared_task' = 'file'
  let metadata = {}

  if (params.resourceType === 'note') {
    messageType = 'shared_note'
    metadata = {
      note_id: params.resourceId,
      note_title: params.title,
      note_preview: params.description?.substring(0, 100) || ''
    }
  } else if (params.resourceType === 'task') {
    messageType = 'shared_task'
    metadata = {
      task_id: params.resourceId,
      task_title: params.title,
      due_date: params.description // Using description for due date as simple metadata for now
    }
  } else {
    messageType = 'file'
    metadata = {
      size: params.fileSize
    }
  }

  const { error: messageError } = await supabase
    .from('collaboration_messages')
    .insert({
      collaboration_id: params.collaborationId,
      user_id: params.userId,
      content: params.messageContent || `Shared a ${params.resourceType}: ${params.title}`,
      message_type: messageType,
      file_url: params.url,
      file_name: params.resourceType === 'file' ? params.title : null,
      metadata: metadata,
      created_at: new Date().toISOString()
    })

  if (messageError) {
    console.error('Error sending share message:', messageError)
  }

  return { success: true, data: resource }
}

// Get collaboration details
export async function getCollaborationDetails(collaborationId: string, userId: string) {
  const supabase = createClient()
  
  const { data: collaboration, error: collabError } = await supabase
    .from('collaborations')
    .select(`
      *,
      collaboration_members(
        user_id,
        profiles(full_name, email, avatar_url)
      )
    `)
    .eq('id', collaborationId)
    .single()
  
  if (collabError) {
    console.error('Error fetching collaboration:', collabError)
    return null
  }
  
  // Check if user is a member
  const isMember = collaboration?.collaboration_members?.some((m: any) => m.user_id === userId)
  
  if (!isMember) {
    return null
  }
  
  return collaboration
}

// Course-related server actions
export async function getCourses(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }
  
  return data
}

export async function createCourse(userId: string, courseData: {
  name: string
  code?: string
  instructor?: string
  schedule?: string
  credits?: number
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .insert({
      ...courseData,
      user_id: userId
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating course:', error)
    return { success: false, error: error.message }
  }
  

  return { success: true, data }
}

// Note-related server actions
export async function getNotes(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      courses(title, code)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching notes:', error)
    return []
  }
  
  return data
}

export async function createNote(userId: string, noteData: {
  title: string
  content: string
  course_id?: string
  tags?: string[]
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notes')
    .insert({
      ...noteData,
      user_id: userId
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating note:', error)
    return { success: false, error: error.message }
  }
  

  return { success: true, data }
}

// Schedule-related server actions
export async function getScheduleEvents(userId: string, startDate?: string, endDate?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('schedule_events')
    .select('*')
    .eq('user_id', userId)
  
  if (startDate && endDate) {
    query = query
      .gte('start_time', startDate)
      .lte('end_time', endDate)
  }
  
  const { data, error } = await query.order('start_time', { ascending: true })
  
  if (error) {
    console.error('Error fetching schedule events:', error)
    return []
  }
  
  return data
}

export async function createScheduleEvent(userId: string, eventData: {
  title: string
  description?: string
  start_time: string
  end_time: string
  type: 'class' | 'study_session' | 'exam' | 'meeting' | 'other'
  location?: string
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('schedule_events')
    .insert({
      ...eventData,
      user_id: userId
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating schedule event:', error)
    return { success: false, error: error.message }
  }
  

  return { success: true, data }
}
