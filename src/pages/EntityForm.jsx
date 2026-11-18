import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../lib/api'

const todayInputValue = () => new Date().toISOString().slice(0, 10)
const inOneYearInputValue = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export default function EntityForm({ mode }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [createdEntity, setCreatedEntity] = useState(null) // success screen after create
  const [existingSubscription, setExistingSubscription] = useState(null)

  const [form, setForm] = useState({
    name: '',
    type: 'RESTAURANT',
    google_review_url: '',
    is_active: true,
    starts_at: todayInputValue(),
    ends_at: inOneYearInputValue(),
    status: 'ACTIVE',
  })

  useEffect(() => {
    if (!isEdit) return
    let mounted = true
    ;(async () => {
      try {
        const { data: entity } = await api.getEntity(id)
        const { data: subs } = await api.listSubscriptions({ entity_id: id })
        const latest = subs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
        if (!mounted) return
        setExistingSubscription(latest)
        setForm({
          name: entity.name,
          type: entity.type,
          google_review_url: entity.google_review_url,
          is_active: entity.is_active,
          starts_at: latest ? latest.starts_at.slice(0, 10) : todayInputValue(),
          ends_at: latest ? latest.ends_at.slice(0, 10) : inOneYearInputValue(),
          status: latest ? latest.status : 'ACTIVE',
        })
      } catch {
        toast.error('Failed to load entity')
        navigate('/entities')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [isEdit, id, navigate])

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.google_review_url.trim()) e.google_review_url = 'Google Review URL is required'
    if (new Date(form.ends_at) <= new Date(form.starts_at)) {
      e.ends_at = 'End date must be after start date'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (isEdit) {
        await api.updateEntity(id, {
          name: form.name,
          type: form.type,
          google_review_url: form.google_review_url,
          is_active: form.is_active,
        })

        const subPayload = {
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
          status: form.status,
        }
        if (existingSubscription) {
          await api.updateSubscription(existingSubscription.id, subPayload)
        } else {
          await api.createSubscription({ entity_id: id, ...subPayload })
        }

        toast.success('Entity updated')
        navigate('/entities')
      } else {
        const { data: entity } = await api.createEntity({
          name: form.name,
          type: form.type,
          google_review_url: form.google_review_url,
        })
        await api.createSubscription({
          entity_id: entity.id,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
          status: 'ACTIVE',
        })
        setCreatedEntity(entity)
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail[0]?.msg || 'Validation error')
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Something went wrong')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl space-y-4" aria-busy="true" aria-label="Loading entity">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-ink-100" />
        <div className="h-5 w-80 max-w-full animate-pulse rounded-lg bg-ink-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
      </div>
    )
  }

  if (createdEntity) {
    return <CreatedSuccess entity={createdEntity} />
  }

  return (
    <div>
      <Link to="/entities" className="mb-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft size={15} /> Back to entities
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
        {isEdit ? 'Edit entity' : 'New entity'}
      </h1>
      <p className="mt-1 mb-6 text-sm text-ink-400">
        {isEdit
          ? 'Update entity details and subscription. The NFC URL never changes.'
          : 'Create a restaurant or hotel and issue its permanent NFC review link.'}
      </p>

      <form onSubmit={handleSubmit} className="panel grid gap-0 p-0 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5 p-5 sm:p-6">
        <div>
          <label className="field-label" htmlFor="entity-name">Name</label>
          <input
            id="entity-name"
            className="input-field"
            type="text"
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'entity-name-error' : undefined}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Hilton Baku"
          />
          {errors.name && <p id="entity-name-error" role="alert" className="mt-1 text-xs text-rust-500">{errors.name}</p>}
        </div>

        <div>
          <label className="field-label">Type</label>
          <div className="flex gap-2">
            {['RESTAURANT', 'HOTEL'].map((t) => (
              <button
                type="button"
                key={t}
                aria-pressed={form.type === t}
                onClick={() => update('type', t)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  form.type === t
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-100 bg-white text-ink-500 hover:bg-ink-50'
                }`}
              >
                {t === 'RESTAURANT' ? 'Restaurant' : 'Hotel'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="google-review-url">Google Review URL</label>
          <input
            id="google-review-url"
            className="input-field"
            type="url"
            inputMode="url"
            required
            aria-invalid={Boolean(errors.google_review_url)}
            aria-describedby={errors.google_review_url ? 'google-url-error' : undefined}
            value={form.google_review_url}
            onChange={(e) => update('google_review_url', e.target.value)}
            placeholder="https://g.page/r/xxxxxxxxxxxx/review"
          />
          {errors.google_review_url && (
            <p id="google-url-error" role="alert" className="mt-1 text-xs text-rust-500">{errors.google_review_url}</p>
          )}
        </div>

        {isEdit && (
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-ink-200 text-signal-500 focus:ring-signal-500/30"
            />
            Entity is active (uncheck to disable NFC redirect immediately)
          </label>
        )}

        <div className="border-t border-ink-100 pt-5">
          <p className="mb-3 text-sm font-medium text-ink-900">Subscription</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="subscription-start">Start date</label>
              <input
                id="subscription-start"
                type="date"
                className="input-field"
                value={form.starts_at}
                onChange={(e) => update('starts_at', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="subscription-end">End date</label>
              <input
                id="subscription-end"
                type="date"
                className="input-field"
                aria-invalid={Boolean(errors.ends_at)}
                aria-describedby={errors.ends_at ? 'subscription-end-error' : undefined}
                value={form.ends_at}
                onChange={(e) => update('ends_at', e.target.value)}
              />
              {errors.ends_at && <p id="subscription-end-error" role="alert" className="mt-1 text-xs text-rust-500">{errors.ends_at}</p>}
            </div>
          </div>

          {isEdit && (
            <div className="mt-3">
              <label className="field-label">Subscription status</label>
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
          )}
        </div>

        </div>
        <aside className="border-t border-ink-100 bg-ink-50/40 p-5 lg:border-l lg:border-t-0 lg:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">Review setup</p>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            The subscription period controls whether the NFC link can open the public review experience.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create entity'}
            </button>
            <button type="button" className="btn-secondary w-full" onClick={() => navigate('/entities')}>
              Cancel
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}

function CreatedSuccess({ entity }) {
  const navigate = useNavigate()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entity.nfc_url)
      toast.success('NFC URL copied')
    } catch {
      toast.error('Could not copy automatically')
    }
  }
  return (
    <div className="max-w-md">
      <div className="panel p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal-500/10 text-signal-600">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="font-display text-xl font-semibold text-ink-900">Entity created successfully</h2>
        <p className="mt-1 text-sm text-ink-400">{entity.name} is ready to receive its NFC card.</p>

        <div className="mt-5 rounded-lg bg-ink-50 p-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-300">NFC URL</p>
          <code className="block break-all text-sm text-ink-800">{entity.nfc_url}</code>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={copy} className="btn-secondary flex-1">
            <Copy size={15} /> Copy URL
          </button>
          <button onClick={() => navigate('/entities')} className="btn-primary flex-1">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
