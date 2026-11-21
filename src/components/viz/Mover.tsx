import type { ReactNode } from 'react'

/**
 * Slides its child from the left end of a track to the right end (data travelling
 * along a channel, about 800ms). Plain CSS transition; reduce-motion is handled globally.
 */
export function Mover({ arrived, children, className = '', visible = true }: { arrived: boolean; children: ReactNode; className?: string; visible?: boolean }) {
  return (
    <div
      className={`absolute top-0 ${className}`}
      style={{
        left: arrived ? '100%' : '0%',
        transform: arrived ? 'translateX(-100%)' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'left 800ms ease-out, transform 800ms ease-out, opacity 300ms ease-out',
      }}
    >
      {children}
    </div>
  )
}
