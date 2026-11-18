export default function StarRating({ value = 0, max = 5, size = 20 }) {
  const safeValue = Math.max(0, Math.min(max, Number(value) || 0));
  const percent = max > 0 ? (safeValue / max) * 100 : 0;
  return (
    <div
      role="img"
      aria-label={`${safeValue.toFixed(2)} out of ${max}`}
      className="relative inline-flex"
      style={{ height: size, width: size * max }}
    >
      <svg aria-hidden="true" viewBox={`0 0 ${24 * max} 24`} width={size * max} height={size} className="absolute inset-0 text-ink-200" fill="currentColor">
        {Array.from({ length: max }).map((_, index) => (
          <path key={index} d="M12 2.6l2.9 5.87 6.48.94-4.69 4.57 1.11 6.46L12 17.37l-5.8 3.07 1.11-6.46-4.69-4.57 6.48-.94L12 2.6z" transform={`translate(${index * 24} 0)`} />
        ))}
      </svg>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${percent}%` }}>
        <svg viewBox={`0 0 ${24 * max} 24`} width={size * max} height={size} fill="currentColor" preserveAspectRatio="none">
          {Array.from({ length: max }).map((_, index) => (
            <path key={index} d="M12 2.6l2.9 5.87 6.48.94-4.69 4.57 1.11 6.46L12 17.37l-5.8 3.07 1.11-6.46-4.69-4.57 6.48-.94L12 2.6z" transform={`translate(${index * 24} 0)`} />
          ))}
        </svg>
      </div>
    </div>
  );
}
