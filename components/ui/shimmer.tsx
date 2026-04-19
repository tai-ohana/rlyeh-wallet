import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface ShimmerProps {
  /** CSS color used for the moving highlight. */
  color?: string
  /** Length of the full cycle including the quiet period. */
  duration?: string
  /** Delay before the first sweep. */
  delay?: string
  /** Extra classes for fine-tuning (z-index, opacity, etc.). */
  className?: string
}

/**
 * Overlay primitive — drop inside any `relative overflow-hidden` element
 * to get a periodic diagonal shine sweep. Inspired by Magic UI's ShimmerButton.
 */
export function Shimmer({
  color = 'rgba(255, 255, 255, 0.35)',
  duration = '3.2s',
  delay = '0s',
  className,
}: ShimmerProps) {
  return (
    <span
      aria-hidden
      style={
        {
          '--shimmer-color': color,
          '--shimmer-duration': duration,
          '--shimmer-delay': delay,
        } as CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-0 left-0 h-full w-1/2 -skew-x-12',
          'bg-gradient-to-r from-transparent via-[color:var(--shimmer-color)] to-transparent',
          'animate-[shimmer-sweep_var(--shimmer-duration)_ease-in-out_var(--shimmer-delay)_infinite]',
        )}
      />
    </span>
  )
}
