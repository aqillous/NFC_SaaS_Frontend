import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Star, CheckCircle2, Heart, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import * as api from '../lib/api'

const CATEGORIES = [
  { key: 'quality', label: 'Quality', hint: 'Food & products' },
  { key: 'service', label: 'Service', hint: 'Staff & hospitality' },
  { key: 'taste', label: 'Taste', hint: 'Flavor & freshness' },
]

export default function PublicReview() {
  const { slug } = useParams()
  const [entity, setEntity] = useState(null)
  const [googleUrl, setGoogleUrl] = useState('')
  const [values, setValues] = useState({ quality: 0, service: 0, taste: 0 })
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    let active = true
    api.getPublicReview(slug)
      .then(({ data }) => {
        if (!active) return
        setEntity(data.entity)
        setGoogleUrl(data.google_review_url || '')
      })
      .catch((err) => {
        if (!active) return
        if (err.response?.status === 404) setError('This review link could not be found.')
        else if (err.response?.status === 403) setError('This review link is currently unavailable.')
        else setError('We could not load this review page. Please try again.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [slug])

  const total = useMemo(() => {
    if (!values.quality || !values.service || !values.taste) return 0
    return Number(((values.quality + values.service + values.taste) / 3).toFixed(2))
  }, [values])

  const complete = values.quality > 0 && values.service > 0 && values.taste > 0

  const submit = async (event) => {
    event.preventDefault()
    if (!complete || submitting) return
    setSubmitting(true)
    setError('')

    try {
      const { data } = await api.submitFeedback(slug, {
        quality: values.quality,
        service: values.service,
        taste: values.taste,
        comment: comment.trim() || null,
      })

      setResult({
        score: Number(data.feedback?.overall_score ?? total),
        shouldRedirect: Number(data.feedback?.overall_score ?? total) > 4,
      })

      // IMPORTANT: the submission is saved by the API before this line runs.
      // The frontend, not the backend, owns the Google redirect decision.
      if (Number(data.feedback?.overall_score ?? total) > 4 && (data.google_review_url || googleUrl)) {
        window.setTimeout(() => {
          window.location.assign(data.google_review_url || googleUrl)
        }, 650)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'We could not save your feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PublicShell><LoadingState /></PublicShell>
  if (error && !entity) return <PublicShell><UnavailableState message={error} /></PublicShell>
  if (result) return (
    <PublicShell>
      <ThankYou score={result.score} redirecting={result.shouldRedirect} />
    </PublicShell>
  )

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-white shadow-panel">
            <Heart size={25} fill="currentColor" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-signal-600">Quick feedback</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            How was your experience?
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-400">
            Your feedback helps <span className="font-semibold text-ink-700">{entity?.name}</span> improve.
            It only takes a few seconds.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-ink-100 bg-white p-4 shadow-panel sm:p-6">
          <div className="space-y-2">
            {CATEGORIES.map((category) => (
              <RatingRow
                key={category.key}
                category={category}
                value={values[category.key]}
                onChange={(value) => setValues((current) => ({ ...current, [category.key]: value }))}
              />
            ))}
          </div>

          <div className="my-5 flex items-center justify-between rounded-2xl bg-ink-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Overall score</p>
              <p className="text-xs text-ink-300">{complete ? 'Average of your 3 ratings' : 'Rate all 3 categories'}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={21} className={total ? 'fill-amber-500 text-amber-500' : 'text-ink-200'} />
              <span className="font-display text-2xl font-semibold text-ink-900">{total ? total.toFixed(2) : '—'}</span>
              <span className="text-sm text-ink-300">/ 5</span>
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="field-label">Anything else? <span className="font-normal text-ink-300">(optional)</span></label>
            <textarea
              id="comment"
              className="input-field min-h-28 resize-none"
              maxLength={2000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell us what went well or what we could improve…"
            />
            <div className="mt-1 text-right text-[11px] text-ink-300">{comment.length}/2000</div>
          </div>

          {error && (
            <div className="mt-4 flex gap-2 rounded-xl bg-rust-500/5 p-3 text-sm text-rust-500">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!complete || submitting}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 text-sm font-bold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <><Loader2 size={17} className="animate-spin" /> Saving feedback…</> : 'Submit feedback'}
          </button>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-300">
            <ShieldCheck size={14} /> Your feedback is securely recorded
          </div>
        </form>

        <p className="mt-5 text-center text-[11px] leading-5 text-ink-300">
          Your ratings are saved first. If your overall score is above 4, you’ll be invited to continue to Google.
        </p>
      </div>
    </PublicShell>
  )
}

function RatingRow({ category, value, onChange }) {
  return (
    <div className="rounded-2xl border border-ink-100 p-4 transition focus-within:border-signal-500/40">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink-900">{category.label}</p>
          <p className="text-xs text-ink-300">{category.hint}</p>
        </div>
        <span className={`min-w-7 text-right text-sm font-bold ${value ? 'text-ink-900' : 'text-ink-300'}`}>
          {value || '—'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1 sm:justify-start sm:gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= value
          return (
            <button
              key={star}
              type="button"
              aria-label={`${star} out of 5 for ${category.label}`}
              aria-pressed={active}
              onClick={() => onChange(star)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-200 transition hover:bg-amber-500/10 hover:text-amber-500 sm:h-10 sm:w-12"
            >
              <Star size={27} strokeWidth={1.7} className={active ? 'fill-amber-500 text-amber-500' : ''} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PublicShell({ children }) {
  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_#ffffff_0,_#f3f6f8_58%,_#e9eef1_100%)] px-4 py-6 sm:flex sm:items-center sm:justify-center sm:py-10">
      <div className="w-full">{children}</div>
    </main>
  )
}

function ThankYou({ score, redirecting }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-ink-100 bg-white p-7 text-center shadow-panel sm:p-9">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-signal-500/10 text-signal-600">
        {redirecting ? <Loader2 size={30} className="animate-spin" /> : <CheckCircle2 size={30} />}
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-signal-600">
        {redirecting ? 'One more step' : 'Feedback received'}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">
        {redirecting ? 'Thank you!' : 'Thanks for your feedback.'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-ink-400">
        Your overall score was <strong className="text-ink-700">{score.toFixed(2)} / 5</strong>.
        {redirecting ? ' Opening Google so you can share your experience there.' : ' Your comments have been saved.'}
      </p>
      {!redirecting && <div className="mt-5 rounded-2xl bg-ink-50 p-4 text-xs leading-5 text-ink-400">We appreciate you taking the time to help us improve.</div>}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-ink-100 bg-white p-10 text-center shadow-panel">
      <Loader2 size={28} className="mx-auto animate-spin text-signal-500" />
      <p className="mt-4 text-sm font-medium text-ink-600">Loading your review page…</p>
    </div>
  )
}

function UnavailableState({ message }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-panel">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-50 text-ink-500"><AlertCircle size={26} /></div>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">Review link unavailable</h1>
      <p className="mt-2 text-sm leading-6 text-ink-400">{message}</p>
    </div>
  )
}
