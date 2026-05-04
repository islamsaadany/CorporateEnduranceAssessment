// AI Insights section — server wrapper.
//
// The body, button, skeleton-during-generation, and fallback card all
// live in `ai-body.tsx` (client). This server component renders the
// outer card chrome (eyebrow, draft pill) and forwards the cached row
// + filter context as props.

import type { AiReportOutput } from '@/data/types'
import { AiBody } from './ai-body'

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
  belowAnonymityFloor: boolean
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
        <p className="text-[11px] font-bold uppercase tracking-[3px] text-brand-ochre">
          AI Insights
        </p>
        {cached?.isDraft ? <DraftPill /> : null}
      </header>

      <div className="px-6 py-6">
        <AiBody
          assessmentId={assessmentId}
          filterQueryString={filterQueryString}
          cached={cached}
          belowAnonymityFloor={belowAnonymityFloor}
          noFocusAreas={noFocusAreas}
        />
      </div>
    </section>
  )
}

function DraftPill() {
  return (
    <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[1.5px] text-amber-900">
      ⚠ Preliminary draft — based on partial responses
    </span>
  )
}
