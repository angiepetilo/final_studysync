'use client'

import { useEffect } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel',
  loading,
  variant = 'danger'
}: ConfirmDialogProps) {
  
  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 w-screen h-screen bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
            variant === 'danger' ? "bg-rose-50 text-rose-500 shadow-rose-100 dark:bg-rose-500/10 dark:shadow-none" :
            variant === 'warning' ? "bg-amber-50 text-amber-500 shadow-amber-100 dark:bg-amber-500/10 dark:shadow-none" :
            "bg-indigo-50 text-indigo-500 shadow-indigo-100 dark:bg-indigo-500/10 dark:shadow-none"
          )}>
            <AlertTriangle size={32} strokeWidth={2.5} />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {title}
          </h2>
          <p className="text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex gap-4 w-full">
            <button 
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button 
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex-1 px-6 py-4 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2",
                variant === 'danger' ? "bg-rose-600 hover:bg-rose-500 shadow-rose-200 dark:shadow-none" :
                variant === 'warning' ? "bg-amber-600 hover:bg-amber-500 shadow-amber-200 dark:shadow-none" :
                "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200 dark:shadow-none"
              )}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
