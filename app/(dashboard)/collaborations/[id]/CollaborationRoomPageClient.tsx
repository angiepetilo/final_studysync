'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getCollaborationDetails, getCollaborationMessages } from '@/lib/actions/student'
import CollaborationRoomClient from './CollaborationRoomClient'

interface CollaborationRoomPageClientProps {
  id: string
}

export default function CollaborationRoomPageClient({ id }: CollaborationRoomPageClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    collaboration: any,
    messages: any[],
    userProfile: any
  } | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!id || id === 'room') return
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const [collaboration, messages] = await Promise.all([
          getCollaborationDetails(id, user.id),
          getCollaborationMessages(id)
        ])

        if (!collaboration) {
          router.push('/collaborations')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .maybeSingle()

        setData({
          collaboration,
          messages,
          userProfile: {
            id: user.id,
            full_name: profile?.full_name || '',
            email: profile?.email || ''
          }
        })
      } catch (error) {
        console.error('Failed to load room:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, supabase, router])

  if (loading || !data) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <CollaborationRoomClient
      collaboration={data.collaboration}
      initialMessages={data.messages}
      userProfile={data.userProfile}
    />
  )
}
