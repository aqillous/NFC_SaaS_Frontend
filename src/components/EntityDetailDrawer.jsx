import { X, Copy, ExternalLink, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Badge, { subscriptionBadgeProps } from './Badge.jsx'

export default function EntityDetailDrawer({ entity, subscription, onClose }) {
  if (!entity) return null
  const badge = subscriptionBadgeProps(subscription)

  const copy = () => {
    navigator.clipboard.writeText(entity.nfc_url)
    toast.success('NFC URL copied')
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink-950/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">{entity.name}</h2>
          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <dl className="space-y-4 text-sm">
            <Row label="Type">{entity.type === 'RESTAURANT' ? 'Restaurant' : 'Hotel'}</Row>
            <Row label="Status">
              <Badge variant={entity.is_active ? 'active' : 'cancelled'}>
                {entity.is_active ? 'Active entity' : 'Inactive entity'}
              </Badge>
            </Row>
            <Row label="Subscription">
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </Row>
            {subscription && (
              <>
                <Row label="Subscription period">
                  {new Date(subscription.starts_at).toLocaleDateString()} –{' '}
                  {new Date(subscription.ends_at).toLocaleDateString()}
                </Row>
              </>
            )}
            <Row label="Google Review URL">
              <a
                href={entity.google_review_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-signal-600 hover:underline"
              >
                <span className="max-w-[260px] truncate">{entity.google_review_url}</span>
                <ExternalLink size={12} />
              </a>
            </Row>
            <Row label="NFC URL">
              <div className="flex items-center gap-2">
                <code className="rounded-md bg-ink-50 px-2 py-1 text-xs text-ink-700">
                  {entity.nfc_url}
                </code>
                <button onClick={copy} className="icon-btn" title="Copy">
                  <Copy size={14} />
                </button>
              </div>
            </Row>
            <Row label="Created">{new Date(entity.created_at).toLocaleString()}</Row>
          </dl>
        </div>

        <div className="border-t border-ink-100 px-5 py-4">
          <Link to={`/entities/${entity.id}/edit`} className="btn-primary w-full">
            <Pencil size={15} /> Edit entity
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-300">{label}</dt>
      <dd className="text-ink-800">{children}</dd>
    </div>
  )
}
