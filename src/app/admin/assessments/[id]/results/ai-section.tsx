// AI Insights section (slice 7.3 + prompt v2).
//
// Server component. Renders the cached AI executive summary as a list
// of correlation bullets (prompt v2; was a single paragraph in v1).
//
// Pre-closure generations carry isDraft=true and render an amber
// "PRELIMINARY DRAFT" pill above the bullets per spec 15 § 1.
//
// Cached rows whose promptVersion < CURRENT_PROMPT_VERSION render with a
// small "Generated with prompt v{N}; current is v{M} — regenerate for the
// latest framing" line. Per CLAUDE.md we never silently invalidate.

import type { AiReportOutput } from '@/data/types'
import { CURRENT_PROMPT_VERSION } from '@/lib/ai'
import { GenerateButton } from './generate-button'

const PROVIDER_LABEL: Record<string, string> = {
  gemini: 'Google Gemini',
  claude: 'Anthropic Claude',
  openai: 'OpenAI',
}

export interface CachedReport {
  outputJson: AiReportOutput
  isDraft: boolean
  generatedAt: string
  provider: string
  promptVersion: number
  filterSignature: string
  generatedBy: { name: string } | null
}

interface AiSectionProps {
  assessmentId: string
  filterQueryString: string
  cached: CachedReport | null
  /** Server-known: skip the button + show the lock message when true. */
  belowAnonymityFloor: boolean
  /** Server-known: nothing to recommend when no focus areas. */
  noFocusAreas: boolean
}

export function AiSection({
  assessmentId,
  filterQueryString,
  cached,
  belowAnonymityFloor,
  noFocusAreas,
}: AiSectionProps) {
  return (
    <section className="overflow-hidden rounded border border-brand-grey-light bg-white shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-brand-grey-light bg-brand-grey-soft-bg px-6 py-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[3px] text-brand-ochre">
            AI Insights
          </p>
          {cached ? (
            <p className="text-[11px] uppercase tracking-[2px] text-brand-grey-text">
              {PROVIDER_LABEL[cached.provider] ?? cached.provider} ·{' '}
              {formatTimestamp(cached.generatedAt)}
              {cached.generatedBy ? ` by ${cached.generatedBy.name}` : ''}
            </p>
          ) : null}
        </div>
        {cached?.isDraft ? <DraftPill /> : null}
      </header>

      <div className="px-6 py-6">
        {belowAnonymityFloor ? (
          <EmptyState
            heading="AI generation is unavailable for this filter"
            body="An AI report needs at least 3 respondents to satisfy the anonymity guardrail. Adjust the filter or wait for more responses."
          />
        ) : noFocusAreas ? (
          <EmptyState
            heading="No focus areas yet"
            body="An AI report needs at least one focus-area capability with rated answers. Wait for more responses, then try again."
          />
        ) : cached ? (
          <div className="space-y-5">
            <SummaryBullets bullets={cached.outputJson.executiveSummary} />
            {cached.promptVersion < CURRENT_PROMPT_VERSION ? (
              <p className="text-[11px] italic text-brand-grey-text">
                Generated with prompt v{cached.promptVersion}; current is v{CURRENT_PROMPT_VERSION}.
                Regenerate to use the latest framing.
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 border-t border-brand-grey-light pt-4">
              <GenerateButton
                assessmentId={assessmentId}
                filterQueryString={filterQueryString}
                label="Regenerate AI report"
              />
              <p className="text-xs text-brand-grey-text">
                Regenerating overwrites this report for the current filter.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-brand-grey-text">
              No AI report has been generated for this filter yet. Generation typically takes 5–15
              seconds.
            </p>
            <GenerateButton
              assessmentId={assessmentId}
              filterQueryString={filterQueryString}
              label="Generate AI report"
            />
          </div>
        )}
      </div>
    </section>
  )
}

function SummaryBullets({ bullets }: { bullets: string[] }) {
  if (bullets.length === 0) {
    return (
      <p className="text-sm italic text-brand-grey-text">
        AI returned no summary bullets.
      </p>
    )
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

function DraftPill() {
  return (
    <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[1.5px] text-amber-900">
      ⚠ Preliminary draft — based on partial responses
    </span>
  )
}

function EmptyState({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="rounded border border-dashed border-brand-grey-light bg-brand-grey-soft-bg px-5 py-6 text-center">
      <p className="text-sm font-medium text-brand-dark-blue">{heading}</p>
      <p className="mt-1 text-xs text-brand-grey-text">{body}</p>
    </div>
  )
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}
