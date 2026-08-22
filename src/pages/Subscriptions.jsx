import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../lib/api'
import Badge, { subscriptionBadgeProps } from '../components/Badge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import SubscriptionModal from '../components/SubscriptionModal.jsx'

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [modalState, setModalState] = useState({ open: false, subscription: null })
  const [pendingDelete, setPendingDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [subsRes, entitiesRes] = await Promise.all([
        api.listSubscriptions({}),
        api.listEntities({}),
      ])
      setSubscriptions(subsRes.data)
      setEntities(entitiesRes.data)
    } catch {
      toast.error('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const entityById = useMemo(() => {
    const map = {}
    for (const e of entities) map[e.id] = e
    return map
  }, [entities])

  const filtered = useMemo(() => {
    if (!statusFilter) return subscriptions
    if (statusFilter === 'VALID') return subscriptions.filter((s) => s.is_currently_valid)
    if (statusFilter === 'INVALID') return subscriptions.filter((s) => !s.is_currently_valid)
    return subscriptions.filter((s) => s.status === statusFilter)
  }, [subscriptions, statusFilter])

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await api.deleteSubscription(pendingDelete.id)
      toast.success('Subscription deleted')
      setSubscriptions((prev) => prev.filter((s) => s.id !== pendingDelete.id))
    } catch {
      toast.error('Failed to delete subscription')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Subscriptions</h1>
          <p className="mt-1 text-sm text-ink-400">Manually manage access periods for each entity.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setModalState({ open: true, subscription: null })}
          disabled={entities.length === 0}
        >
          <Plus size={16} /> New subscription
        </button>
      </div>

      <div className="mb-4">
        <select
          className="input-field w-56"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All subscriptions</option>
          <option value="VALID">Currently valid</option>
          <option value="INVALID">Not valid</option>
          <option value="ACTIVE">Status: Active</option>
          <option value="EXPIRED">Status: Expired</option>
          <option value="CANCELLED">Status: Cancelled</option>
        </select>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-300">
              <th className="px-5 py-3 font-medium">Entity</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Live validity</th>
              <th className="px-5 py-3 font-medium">Start date</th>
              <th className="px-5 py-3 font-medium">End date</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-300">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-300">
                  No subscriptions found.
                </td>
              </tr>
            ) : (
              filtered.map((sub) => {
                const badge = subscriptionBadgeProps(sub)
                const entity = entityById[sub.entity_id]
                return (
                  <tr key={sub.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50">
                    <td className="px-5 py-3.5 font-medium text-ink-900">
                      {entity ? entity.name : 'Unknown entity'}
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">{formatStatus(sub.status)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">
                      {new Date(sub.starts_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">
                      {new Date(sub.ends_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="icon-btn"
                          title="Edit"
                          onClick={() => setModalState({ open: true, subscription: sub })}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-btn hover:!bg-rust-500/10 hover:!text-rust-500"
                          title="Delete"
                          onClick={() => setPendingDelete(sub)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <SubscriptionModal
        open={modalState.open}
        entities={entities}
        subscription={modalState.subscription}
        onClose={() => setModalState({ open: false, subscription: null })}
        onSaved={() => {
          setModalState({ open: false, subscription: null })
          load()
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete subscription"
        message="This removes the subscription record. The entity will show as having no subscription until a new one is created."
        confirmLabel="Delete subscription"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function formatStatus(status) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}
