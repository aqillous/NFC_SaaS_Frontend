export default function StatCard({ label, value, caption, icon, tooltip, muted = false }) {
  return (
    <article className={`relative min-h-28 rounded-xl bg-ink-50 p-4 ${muted ? "text-ink-400" : "text-ink-900"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          {label}
          {tooltip && (
            <button type="button" className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-300 hover:bg-white hover:text-ink-600 focus-visible:outline-2" title={tooltip} aria-label={tooltip}>ⓘ</button>
          )}
        </p>
        {icon && <span className="shrink-0 text-signal-600">{icon}</span>}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      {caption && <p className="mt-1 text-xs text-ink-400">{caption}</p>}
    </article>
  );
}
