'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AiReportOutput } from '@/data/types'
import { CURRENT_PROMPT_VERSION } from '@/lib/ai'

/**
 * Client component that owns the AI Insights body + the Generate /
 * Regenerate button as a single unit. Owning both lets the click flow
 * replace the body with a "vivid pulsing" skeleton while generation is
 * in flight, and slot the fallback card / attempt reasons inline on
 * failure.
 *
 * Renders:
 *   - skeleton while generating
 *   - cached bullets + Regenerate button (when a cached row exists)
 *   - empty state + Generate button (no cache yet)
 *   - lock state (anonymity floor / no focus areas — no button)
 *   - inline FallbackCard with attempt reasons if a generation lands
 *     on the fallback path (transient; not cached, lost on refresh)
 */

export interface CachedReportClient {
  outputJson: AiReportOutput
  isDraft: boolean
  generatedAt: string
  provider: string
  promptVersion: number
  filterSignature: string
  generatedBy: { name: string } | null
}

interface FallbackResult {
  outputJson: AiReportOutput
  provider: string | null
  reason: string
  attempts: number
  attemptReasons: string[]
  attemptDetails?: string[]
  isDraft: boolean
}

interface AiBodyProps {
  assessmentId: string
  filterQueryString: string
  cached: CachedReportClient | null
  belowAnonymityFloor: boolean
  noFocusAreas: boolean
}

const PROVIDER_LABEL: Record<string, string> = {
  gemini: 'Google Gemini',
  claude: 'Anthropic Claude',
  openai: 'OpenAI',
}

export function AiBody({
  assessmentId,
  filterQueryString,
  cached,
  belowAnonymityFloor,
  noFocusAreas,
}: AiBodyProps) {
  const router = useRouter()
  const [isGenerating, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fallback, setFallback] = useState<FallbackResult | null>(null)

  function handleGenerate() {
    setError(null)
    setFallback(null)
    startTransition(async () => {
      try {
        const url = `/api/assessments/${assessmentId}/report${filterQueryString ? `?${filterQueryString}` : ''}`
        const res = await fetch(url, { method: 'POST' })
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
          setError(data.message ?? data.error ?? `Generation failed (${res.status}).`)
          return
        }
        const data = (await res.json()) as
          | { kind: 'success' }
          | { kind: 'fallback'; fallback: FallbackResult }
        if (data.kind === 'success') {
          // Refresh server props so the cached row is re-read and the
          // fresh content replaces the skeleton.
          router.refresh()
        } else {
          setFallback(data.fallback)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error.')
      }
    })
  }

  // ── In-flight: skeleton + button-with-spinner ─────────────────────────
  if (isGenerating) {
    return (
      <div className="space-y-5">
        <SkeletonBullets />
        <GenerateRow
          label={cached ? 'Regenerate AI report' : 'Generate AI report'}
          onClick={handleGenerate}
          isGenerating={true}
        />
      </div>
    )
  }

  // ── Lock states ─────────────────────────────────────────────────────
  if (belowAnonymityFloor) {
    return (
      <EmptyCard
        heading="AI generation is unavailable for this filter"
        body="An AI report needs at least 3 respondents to satisfy the anonymity guardrail. Adjust the filter or wait for more responses."
      />
    )
  }
  if (noFocusAreas) {
    return (
      <EmptyCard
        heading="No focus areas yet"
        body="An AI report needs at least one focus-area capability with rated answers. Wait for more responses, then try again."
      />
    )
  }

  // ── Cached: bullets + Regenerate ────────────────────────────────────
  if (cached) {
    return (
      <div className="space-y-5">
        <SourceLine cached={cached} />
        <SummaryBullets bullets={cached.outputJson.executiveSummary} />
        {cached.promptVersion < CURRENT_PROMPT_VERSION ? (
          <p className="text-[11px] italic text-brand-grey-text">
            Generated with prompt v{cached.promptVersion}; current is v{CURRENT_PROMPT_VERSION}.
            Regenerate to use the latest framing.
          </p>
        ) : null}
        <div className="border-t border-brand-grey-light pt-4">
          <GenerateRow label="Regenerate AI report" onClick={handleGenerate} isGenerating={false} />
          <p className="mt-2 text-xs text-brand-grey-text">
            Regenerating overwrites this report for the current filter.
          </p>
        </div>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
        {fallback ? <FallbackCard fallback={fallback} onRetry={handleGenerate} disabled={false} /> : null}
      </div>
    )
  }

  // ── No cache yet: empty + Generate ──────────────────────────────────
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-grey-text">
        No AI report has been generated for this filter yet. Generation typically takes 5–15
        seconds.
      </p>
      <GenerateRow label="Generate AI report" onClick={handleGenerate} isGenerating={false} />
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      {fallback ? <FallbackCard fallback={fallback} onRetry={handleGenerate} disabled={false} /> : null}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────

function SourceLine({ cached }: { cached: CachedReportClient }) {
  const provider = PROVIDER_LABEL[cached.provider] ?? cached.provider
  const ts = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(cached.generatedAt),
  )
  return (
    <p className="text-[11px] uppercase tracking-[2px] text-brand-grey-text">
      {provider} · {ts}
      {cached.generatedBy ? ` by ${cached.generatedBy.name}` : ''}
    </p>
  )
}

function SummaryBullets({ bullets }: { bullets: string[] }) {
  if (bullets.length === 0) {
    return <p className="text-sm italic text-brand-grey-text">AI returned no summary bullets.</p>
  }
  return (
    <ul className="space-y-2.5">
      {bullets.map((b, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-ochre" />
          <span className="font-serif text-base leading-relaxed text-brand-dark-blue">{b}</span>
        </li>
      ))}
    </ul>
  )
}

function GenerateRow({
  label,
  onClick,
  isGenerating,
}: {
  label: string
  onClick: () => void
  isGenerating: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={isGenerating}
        className="inline-flex items-center justify-center gap-2 rounded bg-brand-dark-blue px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-dark-blue/90 disabled:cursor-not-allowed disabled:bg-brand-grey-light disabled:text-brand-grey-text"
      >
        {isGenerating ? <Spinner /> : null}
        {isGenerating ? 'Generating… (up to 30s)' : label}
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  )
}

function SkeletonBullets() {
  // Three pulsing rectangles at the typical bullet widths. Animated with
  // Tailwind's animate-pulse over a brand-tinted grey so it reads as
  // "content is being generated here" rather than "content failed to load".
  return (
    <ul className="space-y-3" role="status" aria-live="polite" aria-label="Generating AI report">
      <li className="flex items-center gap-3">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-ochre/50" />
        <span className="block h-4 w-[88%] animate-pulse rounded bg-brand-grey-light/80" />
      </li>
      <li className="flex items-center gap-3">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-ochre/50" />
        <span className="block h-4 w-[72%] animate-pulse rounded bg-brand-grey-light/80" />
      </li>
      <li className="flex items-center gap-3">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-ochre/50" />
        <span className="block h-4 w-[60%] animate-pulse rounded bg-brand-grey-light/80" />
      </li>
      <li className="flex items-center gap-3">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-ochre/50" />
        <span className="block h-4 w-[78%] animate-pulse rounded bg-brand-grey-light/80" />
      </li>
    </ul>
  )
}

function EmptyCard({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="rounded border border-dashed border-brand-grey-light bg-brand-grey-soft-bg px-5 py-6 text-center">
      <p className="text-sm font-medium text-brand-dark-blue">{heading}</p>
      <p className="mt-1 text-xs text-brand-grey-text">{body}</p>
    </div>
  )
}

function FallbackCard({
  fallback,
  onRetry,
  disabled,
}: {
  fallback: FallbackResult
  onRetry: () => void
  disabled: boolean
}) {
  return (
    <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[2px] text-amber-900">
        AI assistance unavailable — showing baseline content
      </p>
      <ul className="mt-2 space-y-1.5">
        {fallback.outputJson.executiveSummary.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-700" />
            <span className="font-serif text-sm leading-relaxed text-brand-dark-blue">{b}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] italic text-amber-900">
        Generated from baseline content. Baseline action items are also shown in the Focus Areas
        section below.
      </p>
      {fallback.attemptReasons && fallback.attemptReasons.length > 0 ? (
        <div className="mt-2 rounded border border-amber-200 bg-white/40 px-2 py-1.5 font-mono text-[10px] text-amber-900">
          <p className="font-bold uppercase tracking-[1px]">Why:</p>
          <ul className="mt-1 space-y-1">
            {fallback.attemptReasons.map((r, i) => {
              const detail = fallback.attemptDetails?.[i]
              return (
                <li key={i} className="break-words">
                  <span className="font-bold">Attempt {i + 1}:</span> {r}
                  {detail && detail !== r ? (
                    <span className="block pl-4 italic opacity-80">{detail}</span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className="mt-3 inline-flex items-center justify-center rounded border border-amber-700 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Retry AI generation
      </button>
    </div>
  )
}
