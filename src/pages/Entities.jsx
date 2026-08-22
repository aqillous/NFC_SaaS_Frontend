import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  ExternalLink,
  UtensilsCrossed,
  BedDouble,
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../lib/api'
import Badge, { subscriptionBadgeProps } from '../components/Badge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EntityDetailDrawer from '../components/EntityDetailDrawer.jsx'

export default function Entities() {
  const [entities, setEntities] = useState([])
  const [subsByEntity, setSubsByEntity] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [detailEntity, setDetailEntity] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.listEntities({})
      setEntities(data)
      // Fetch each entity's latest subscription so the table can show
      // status + end date without a second round trip per row click.
      const { data: subs } = await api.listSubscriptions({})
      const latestByEntity = {}
      for (const sub of subs) {
        const existing = latestByEntity[sub.entity_id]
        if (!existing || new Date(sub.created_at) > new Date(existing.created_at)) {
          latestByEntity[sub.entity_id] = sub
        }
      }
      setSubsByEntity(latestByEntity)
    } catch {
      toast.error('Failed to load entities')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return entities.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [entities, search, typeFilter])

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url)
    toast.success('NFC URL copied')
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await api.deleteEntity(pendingDelete.id)
      toast.success(`${pendingDelete.name} deleted`)
      setEntities((prev) => prev.filter((e) => e.id !== pendingDelete.id))
    } catch {
      toast.error('Failed to delete entity')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Entities</h1>
          <p className="mt-1 text-sm text-ink-400">Restaurants and hotels using NFC review cards.</p>
        </div>
        <Link to="/entities/new" className="btn-primary">
          <Plus size={16} /> New entity
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            className="input-field pl-9"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-40"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          <option value="RESTAURANT">Restaurant</option>
          <option value="HOTEL">Hotel</option>
        </select>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-300">
              <th className="px-5 py-3 font-medium">Entity</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Subscription</th>
              <th className="px-5 py-3 font-medium">Ends</th>
              <th className="px-5 py-3 font-medium">NFC URL</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-300">
                  No entities found.
                </td>
              </tr>
            ) : (
              filtered.map((entity) => {
                const sub = subsByEntity[entity.id]
                const badge = subscriptionBadgeProps(sub)
                return (
                  <tr
                    key={entity.id}
                    className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50"
                  >
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setDetailEntity(entity)}
                        className="font-medium text-ink-900 hover:text-signal-600 hover:underline"
                      >
                        {entity.name}
                      </button>
                      {!entity.is_active && (
                        <span className="ml-2 text-xs text-ink-300">(inactive)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-ink-500">
                        {entity.type === 'RESTAURANT' ? (
                          <UtensilsCrossed size={14} />
                        ) : (
                          <BedDouble size={14} />
                        )}
                        {entity.type === 'RESTAURANT' ? 'Restaurant' : 'Hotel'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">
                      {sub ? new Date(sub.ends_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <code className="max-w-[180px] truncate text-xs text-ink-400">
                          /r/{entity.slug}
                        </code>
                        <button
                          onClick={() => handleCopy(entity.nfc_url)}
                          className="icon-btn"
                          title="Copy NFC URL"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/entities/${entity.id}/edit`} className="icon-btn" title="Edit">
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => setPendingDelete(entity)}
                          className="icon-btn hover:!bg-rust-500/10 hover:!text-rust-500"
                          title="Delete"
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

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete entity"
        message={`This permanently deletes "${pendingDelete?.name}" and its subscriptions. The NFC card will stop working immediately. This cannot be undone.`}
        confirmLabel="Delete entity"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <EntityDetailDrawer
        entity={detailEntity}
        subscription={detailEntity ? subsByEntity[detailEntity.id] : null}
        onClose={() => setDetailEntity(null)}
      />
    </div>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-ink-100 last:border-0">
          <td colSpan={6} className="px-5 py-4">
            <div className="h-4 w-full animate-pulse rounded bg-ink-50" />
          </td>
        </tr>
      ))}
    </>
  )
}
