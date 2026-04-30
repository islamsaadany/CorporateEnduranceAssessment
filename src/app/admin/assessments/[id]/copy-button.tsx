'use client'

import { useState } from 'react'

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard API can be blocked (insecure context, permission denied).
      // Fall back to a transient prompt so the user can copy manually.
      window.prompt('Copy code:', value)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-canvas-border bg-canvas px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted transition hover:bg-canvas-muted"
      aria-label={`Copy ${value}`}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
