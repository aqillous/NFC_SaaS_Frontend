const VARIANTS = {
  active: 'bg-signal-500/10 text-signal-600',
  expired: 'bg-rust-500/10 text-rust-500',
  cancelled: 'bg-ink-100 text-ink-500',
  warning: 'bg-amber-500/10 text-amber-500',
  neutral: 'bg-ink-100 text-ink-500',
}

export default function Badge({ variant = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${VARIANTS[variant]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

// Given a subscription (or null), decide the badge variant + label to show
// in tables. Mirrors the backend's canonical validity rule: status ACTIVE
// AND now within [starts_at, ends_at].
export function subscriptionBadgeProps(subscription) {
  if (!subscription) {
    return { variant: 'neutral', label: 'No subscription' }
  }
  if (subscription.is_currently_valid) {
    const endsAt = new Date(subscription.ends_at)
    const daysLeft = (endsAt.getTime() - Date.now()) / 86400000
    if (daysLeft <= 7) {
      return { variant: 'warning', label: 'Expiring soon' }
    }
    return { variant: 'active', label: 'Active' }
  }
  if (subscription.status === 'CANCELLED') {
    return { variant: 'cancelled', label: 'Cancelled' }
  }
  return { variant: 'expired', label: 'Expired' }
}
