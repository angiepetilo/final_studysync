'use client'

import React from 'react'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export default function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className={`animate-fadeIn ${className}`}>
      {children}
    </div>
  )
}
