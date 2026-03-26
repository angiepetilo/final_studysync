'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import CollaborationClient from './CollaborationClient'
import { getCollaborations } from '@/lib/actions/student'
import { DashboardSkeleton } from '@/components/shared/LoadingSkeleton'

export default function CollaborationsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    collaborations: any[],
    userProfile: any
  } | null>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const [collaborations, profileRes] = await Promise.all([
        getCollaborations(user.id),
        supabase.from('profiles').select('full_name').eq('id', user.id).single()
      ])

      setData({
        collaborations,
        userProfile: {
          id: user.id,
          full_name: profileRes.data?.full_name || '',
          email: user.email || ''
        }
      })
      setLoading(false)
    }

    loadData()
  }, [supabase])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!data?.userProfile) {
    return <div className="p-8 text-center font-bold text-slate-500">Please log in to view collaborations.</div>
  }

  return (
    <CollaborationClient 
      initialCollaborations={data.collaborations}
      userProfile={data.userProfile}
    />
  )
}
