import { Suspense } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="flex-1">
      <Suspense fallback={
        <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      }>
        {children}
      </Suspense>
    </section>
  )
}
