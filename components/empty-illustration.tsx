/**
 * EmptyIllustration — minimal SVG illustration for empty states.
 * Uses currentColor so it picks up text-muted-foreground/40 etc.
 *
 * Variants:
 *  - "eye"     ホルスの眼を抽象化した線画。記憶/観察のメタファー
 *  - "tome"    閉じた書物。記録のメタファー
 *  - "moon"    三日月と星。静寂のメタファー
 */
export function EmptyIllustration({
  variant = 'eye',
  className,
}: {
  variant?: 'eye' | 'tome' | 'moon'
  className?: string
}) {
  if (variant === 'tome') {
    return (
      <svg
        viewBox="0 0 96 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
      >
        <path d="M20 24c0-2 1.5-4 4-4h44c2.5 0 4 2 4 4v52c0 2-1.5 4-4 4H24c-2.5 0-4-2-4-4z" />
        <path d="M20 24c4 2 12 4 24 4s20-2 24-4" opacity="0.4" />
        <path d="M30 38h28M30 46h22M30 54h26" opacity="0.5" />
        <circle cx="48" cy="68" r="2" />
      </svg>
    )
  }
  if (variant === 'moon') {
    return (
      <svg
        viewBox="0 0 96 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
      >
        <path d="M62 24a26 26 0 1 0 10 36A20 20 0 0 1 62 24z" />
        <circle cx="22" cy="22" r="0.8" fill="currentColor" />
        <circle cx="78" cy="78" r="0.8" fill="currentColor" />
        <circle cx="14" cy="68" r="0.6" fill="currentColor" />
        <circle cx="84" cy="34" r="0.6" fill="currentColor" />
      </svg>
    )
  }
  // default: "eye" — Eye of Horus inspired abstract
  return (
    <svg
      viewBox="0 0 120 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Outer eye almond */}
      <path d="M10 48 C 30 18, 90 18, 110 48 C 90 78, 30 78, 10 48 Z" />
      {/* Iris */}
      <circle cx="60" cy="48" r="14" />
      {/* Pupil */}
      <circle cx="60" cy="48" r="4" fill="currentColor" />
      {/* Cheek mark / tear (eye of horus) */}
      <path d="M60 62 L 60 78 L 72 84" opacity="0.55" />
      {/* Brow swoosh */}
      <path d="M22 30 C 40 14, 80 14, 98 30" opacity="0.45" />
      {/* Faint orbiting dots */}
      <circle cx="6" cy="48" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="114" cy="48" r="0.8" fill="currentColor" opacity="0.5" />
    </svg>
  )
}
