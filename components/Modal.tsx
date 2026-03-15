'use client'

import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = '500px' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content" style={{ maxWidth }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)' }}>{title}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.375rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'transparent' }}>
            <X size={20} color="var(--muted)" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
