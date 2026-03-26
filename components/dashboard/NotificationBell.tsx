'use client'

import NotificationDropdown from '@/components/shared/NotificationDropdown'
import { useData } from '@/context/DataContext'

interface NotificationBellProps {
  userId: string
  className?: string
}

export default function NotificationBell({ userId, className }: NotificationBellProps) {
  const { notifications, refreshData } = useData()

  return (
    <NotificationDropdown
      userId={userId}
      notifications={notifications}
      onRefresh={refreshData}
    />
  )
}
