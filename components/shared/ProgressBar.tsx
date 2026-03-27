'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

export default function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Configure NProgress
    NProgress.configure({ 
      showSpinner: false,
      easing: 'ease',
      speed: 500,
      minimum: 0.3
    })
  }, [])

  useEffect(() => {
    // When the pathname or searchParams change, it means the navigation is complete
    NProgress.done()
  }, [pathname, searchParams])

  return (
    <style jsx global>{`
      #nprogress .bar {
        background: #4f46e5 !important;
        height: 3px !important;
        box-shadow: 0 0 10px #4f46e5, 0 0 5px #4f46e5 !important;
      }
      #nprogress .peg {
        box-shadow: 0 0 10px #4f46e5, 0 0 5px #4f46e5 !important;
      }
    `}</style>
  )
}
