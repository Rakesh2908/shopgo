import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

/**
 * Modal rendered via portal to document.body. Backdrop click and ESC close.
 * Animated with opacity and translate.
 */
export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (isOpen) {
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    }
    setVisible(false)
  }, [isOpen])

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary/50 transition-opacity duration-200"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />
      {/* Panel */}
      <div
        className={clsx(
          'relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl transition-all duration-200',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="mb-4 flex items-center justify-between">
            <h2 id="modal-title" className="text-lg font-semibold text-primary">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-primary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
