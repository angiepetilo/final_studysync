'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setPrompt(e)
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      if (!dismissed) {
        setIsVisible(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-2xl z-[200] flex items-center justify-between gap-6 animate-in slide-in-from-bottom-12 duration-700">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none shrink-0">
          <Download size={24} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none">Install StudSync</h3>
          <p className="text-[0.65rem] text-slate-400 font-bold mt-2 uppercase tracking-widest italic">Experience native power</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstall}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-[0.65rem] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap"
        >
          Install Now
        </button>
        <button 
          onClick={handleDismiss}
          className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:text-rose-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
