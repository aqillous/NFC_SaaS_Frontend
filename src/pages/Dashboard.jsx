import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  UtensilsCrossed,
  BedDouble,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  CalendarDays,
  Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../lib/api'
import StatTile from '../components/StatTile.jsx'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    api
      .getDashboardStats()
      .then(({ data }) => mounted && setStats(data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-400">Overview of entities, subscriptions, and scans.</p>
        </div>
        <Link to="/entities/new" className="btn-primary">
          <Plus size={16} /> New entity
        </Link>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatTile label="Total entities" value={stats.total_entities} icon={Building2} accent="ink" />
            <StatTile label="Restaurants" value={stats.total_restaurants} icon={UtensilsCrossed} accent="ink" />
            <StatTile label="Hotels" value={stats.total_hotels} icon={BedDouble} accent="ink" />
            <StatTile label="Active subscriptions" value={stats.active_subscriptions} icon={CheckCircle2} accent="signal" />
            <StatTile label="Expired subscriptions" value={stats.expired_subscriptions} icon={XCircle} accent="rust" />
            <StatTile label="Expiring soon (7d)" value={stats.expiring_soon} icon={AlertTriangle} accent="amber" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <StatTile label="NFC scans today" value={stats.scans_today} icon={Radio} accent="signal" />
            <StatTile label="NFC scans this month" value={stats.scans_this_month} icon={CalendarDays} accent="signal" />
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-400">Couldn't load dashboard data.</p>
      )}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="panel h-[92px] animate-pulse bg-ink-50" />
      ))}
    </div>
  )
}
