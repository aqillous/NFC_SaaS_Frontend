import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../lib/api'

const toInputDate = (iso) => (iso ? iso.slice(0, 10) : '')

export default function SubscriptionModal({ open, entities, subscription, onClose, onSaved }) {
  const isEdit = !!subscription
  const [form, setForm] = useState({
    entity_id: '',
    starts_at: '',
    ends_at: '',
    status: 'ACTIVE',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (subscription) {
      setForm({
        entity_id: subscription.entity_id,
        starts_at: toInputDate(subscription.starts_at),
        ends_at: toInputDate(subscription.ends_at),
        status: subscription.status,
      })
    } else {
      const today = new Date().toISOString().slice(0, 10)
      const nextYear = new Date()
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      setForm({
        entity_id: entities[0]?.id || '',
        starts_at: today,
        ends_at: nextYear.toISOString().slice(0, 10),
        status: 'ACTIVE',
      })
    }
    setError('')
  }, [subscription, entities, open])

  if (!open) return null

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (new Date(form.ends_at) <= new Date(form.starts_at)) {
      setError('End date must be after start date')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        status: form.status,
      }
      if (isEdit) {
        await api.updateSubscription(subscription.id, payload)
        toast.success('Subscription updated')
      } else {
        await api.createSubscription({ entity_id: form.entity_id, ...payload })
        toast.success('Subscription created')
      }
      onSaved()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-panel">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink-900">
            {isEdit ? 'Edit subscription' : 'New subscription'}
          </h3>
          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rust-500/8 px-3.5 py-2.5 text-sm text-rust-500">{error}</div>
          )}

          <div>
            <label className="field-label">Entity</label>
            <select
              className="input-field"
              value={form.entity_id}
              onChange={(e) => update('entity_id', e.target.value)}
              disabled={isEdit}
              required
            >
              {!isEdit && <option value="">Select an entity…</option>}
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Start date</label>
              <input
                type="date"
                className="input-field"
                value={form.starts_at}
                onChange={(e) => update('starts_at', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">End date</label>
              <input
                type="date"
                className="input-field"
                value={form.ends_at}
                onChange={(e) => update('ends_at', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label">Status</label>
            <select
              className="input-field"
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
