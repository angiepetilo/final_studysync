import React from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
)

interface PageSkeletonProps {
  children: React.ReactNode
  className?: string
}

export const PageSkeleton = ({ children, className = "space-y-12" }: PageSkeletonProps) => (
  <div className={`flex-1 min-h-screen bg-[#F8FAFC] p-8 md:p-12 ${className}`}>
    {children}
  </div>
)

export const DashboardSkeleton = () => (
  <PageSkeleton>
    <div className="flex justify-end gap-4">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <Skeleton className="w-12 h-12 rounded-2xl" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-6 w-1/2" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Skeleton className="lg:col-span-2 h-96 rounded-3xl" />
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    </div>
  </PageSkeleton>
)

export const CoursesSkeleton = () => (
  <PageSkeleton>
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-48" />
      <div className="flex gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-12 h-12 rounded-2xl" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
      <div className="lg:col-span-4 space-y-10">
        <Skeleton className="h-[400px] rounded-[3rem]" />
        <Skeleton className="h-32 rounded-[2.5rem]" />
      </div>
      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[320px] rounded-[2.5rem]" />)}
      </div>
    </div>
  </PageSkeleton>
)

export const NotesSkeleton = () => (
  <PageSkeleton className="space-y-0">
    <div className="flex justify-between mb-12">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="w-48 h-12 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
       <div className="lg:col-span-1 space-y-4">
         {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
       </div>
       <div className="lg:col-span-3">
         <Skeleton className="h-[600px] rounded-[3rem]" />
       </div>
    </div>
  </PageSkeleton>
)

export const TasksSkeleton = () => (
  <PageSkeleton>
     <div className="flex justify-between items-center">
       <Skeleton className="h-10 w-48" />
       <Skeleton className="w-48 h-12 rounded-2xl" />
     </div>
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-8 w-32" />
            {[1, 2, 3].map(j => <Skeleton key={j} className="h-32 rounded-3xl" />)}
          </div>
        ))}
     </div>
  </PageSkeleton>
)

export const ProfileSkeleton = () => (
  <PageSkeleton>
    <div className="flex justify-between items-center">
      <Skeleton className="h-12 w-64" />
      <div className="flex gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-12 h-12 rounded-2xl" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-4 space-y-8">
        <Skeleton className="h-[400px] rounded-[3rem]" />
        <Skeleton className="h-[200px] rounded-[2.5rem]" />
      </div>
      <div className="lg:col-span-8">
        <Skeleton className="h-[600px] rounded-[3rem]" />
      </div>
    </div>
  </PageSkeleton>
)

export const SettingsSkeleton = () => (
  <PageSkeleton>
    <div className="flex justify-between items-center">
      <Skeleton className="h-12 w-64" />
      <div className="flex gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-12 h-12 rounded-2xl" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-8 space-y-8">
        <Skeleton className="h-[300px] rounded-[3rem]" />
        <Skeleton className="h-[300px] rounded-[3rem]" />
      </div>
      <div className="lg:col-span-4 space-y-8">
        <Skeleton className="h-[400px] rounded-[2.5rem]" />
        <Skeleton className="h-[200px] rounded-[2.5rem]" />
      </div>
    </div>
  </PageSkeleton>
)

export const CollaborationsSkeleton = () => (
  <PageSkeleton>
    <div className="flex justify-between items-center mb-12">
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-96" />
      </div>
      <Skeleton className="w-48 h-16 rounded-2xl" />
    </div>
    
    <div className="flex gap-2 mb-12">
      <Skeleton className="w-32 h-12 rounded-xl" />
      <Skeleton className="w-32 h-12 rounded-xl" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} className="h-[300px] rounded-[3rem]" />
      ))}
    </div>
  </PageSkeleton>
)
