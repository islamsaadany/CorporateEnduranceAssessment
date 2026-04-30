'use client'

import { useState } from 'react'

export function CopyAllCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false)

  const onClick = async () => {
    const text = codes.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Copy all codes:', text)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-canvas-border bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-canvas-muted"
    >
      {copied ? 'Codes copied to clipboard' : 'Copy all codes'}
    </button>
  )
}
