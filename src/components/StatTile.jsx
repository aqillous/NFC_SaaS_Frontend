import { Link } from "react-router-dom";

export default function StatTile({ label, value, icon: Icon, accent = 'ink', to, viewLabel = "View", muted = false }) {
  const accentClasses = {
    ink: 'bg-ink-900/5 text-ink-700',
    signal: 'bg-signal-500/10 text-signal-600',
    rust: 'bg-rust-500/10 text-rust-500',
    amber: 'bg-amber-500/10 text-amber-500',
  }
  const content = (
    <div className={`panel flex min-h-28 items-center justify-between p-5 ${muted ? "opacity-60" : ""}`}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-300">{label}</p>
        <p className="mt-2 font-display text-[1.85rem] font-semibold leading-none text-ink-900">
          {value}
        </p>
      </div>
      {Icon && (
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
          <Icon size={19} strokeWidth={2} />
        </div>
      )}
    </div>
  );

  if (!to) return content;
  return (
    <Link
      to={to}
      className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label={`${viewLabel}: ${label}`}
    >
      {content}
      <span className="mt-1 hidden px-1 text-xs font-semibold text-signal-600 group-hover:inline-block">
        {viewLabel}
      </span>
    </Link>
  );
}
