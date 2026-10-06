import type { ReactNode } from 'react'
import { cardCx, pageCx, subtitleCx, titleCx } from '../lib/ui'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Centered card layout shared by every auth screen. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className={pageCx}>
      <div className={cardCx}>
        <div className="mb-6">
          <h1 className={titleCx}>{title}</h1>
          {subtitle ? <p className={subtitleCx}>{subtitle}</p> : null}
        </div>
        {children}
        {footer ? <div className="mt-6 text-center text-sm text-neutral-500">{footer}</div> : null}
      </div>
    </main>
  )
}
