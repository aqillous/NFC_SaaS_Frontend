import { useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
  requireText,
}) {
  const cancelRef = useRef(null)
  const [typedText, setTypedText] = useState('')

  useEffect(() => {
    if (!open) {
      setTypedText('')
      return undefined
    }
    cancelRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-panel"
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              danger ? 'bg-rust-500/10 text-rust-500' : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            <AlertTriangle size={17} />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="font-medium text-ink-900">{title}</h3>
            <p id="confirm-dialog-message" className="mt-1 text-sm text-ink-400">{message}</p>
          </div>
        </div>
        {requireText && (
          <div className="mt-5">
            <label className="field-label" htmlFor="confirm-business-name">
              Type <strong>{requireText}</strong> to confirm
            </label>
            <input
              id="confirm-business-name"
              className="input-field"
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              autoComplete="off"
            />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelRef} className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={requireText ? typedText !== requireText : false}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
