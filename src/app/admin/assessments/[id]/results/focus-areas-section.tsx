// Section 3 — Focus Areas (prompt v3, alignment 2026-05-03).
//
// Each card now has THREE tiers:
//   1. Observations              — AI analysis (correlations specific to
//                                  this capability)
//   2. Correlated Activities     — AI-derived concrete next steps
//   3. Action Items              — baseline reference (always present)
//
// Order: AI tiers FIRST, baseline LAST (per Q3/A in alignment).

import {
  BASELINE_ACTION_ITEMS,
  CAPABILITY_LABELS,
  CAPABILITY_TO_PILLAR,
  PILLAR_LABELS,
} from '@/data/constants'
import type { AggregatedResults, AiReportOutput, CapabilityKey } from '@/data/types'
import { BAND_HEX, BAND_LABEL } from './band-style'

interface FocusAreasSectionProps {
  aggregates: AggregatedResults
  /**
   * Optional. When present, the focus-area cards render two AI tiers
   * (Observations + Correlated Activities) above the baseline tier.
   * Maps each focus-area capability to its AI observations + actions.
   */
  aiPerCapability?: AiReportOutput['focusAreas']
}

export function FocusAreasSection({ aggregates, aiPerCapability }: FocusAreasSectionProps) {
  const { focusAreas, capabilities } = aggregates

  if (focusAreas.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
          Focus Areas
        </h2>
        <div className="rounded border border-dashed border-brand-grey-light bg-white px-6 py-10 text-center text-sm text-brand-grey-text">
          Not enough rated capabilities to surface focus areas yet.
        </div>
      </section>
    )
  }

  const aiByCapability = new Map<CapabilityKey, { observations: string[]; actions: string[] }>(
    (aiPerCapability ?? []).map((a) => [a.capability, { observations: a.observations, actions: a.actions }]),
  )

  return (
    <section>
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
        Focus Areas
      </h2>
      <div className="space-y-4">
        {focusAreas.map((cap, i) => {
          const result = capabilities[cap]
          const pillar = CAPABILITY_TO_PILLAR[cap]
          const [baselineA, baselineB] = BASELINE_ACTION_ITEMS[cap]
          const ai = aiByCapability.get(cap)
          const aiObservations = ai?.observations ?? []
          const aiActions = ai?.actions ?? []
          return (
            <article
              key={cap}
              className="overflow-hidden rounded border border-brand-grey-light bg-white shadow-sm"
            >
              <div
                className="h-1 w-full"
                style={{ backgroundColor: BAND_HEX[result.band ?? 'critical_gap'] }}
              />
              <div className="grid gap-4 px-6 py-5 md:grid-cols-[80px_1fr]">
                <div>
                  <p className="font-serif text-5xl font-bold leading-none text-brand-ochre">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
                    {PILLAR_LABELS[pillar]} · {CAPABILITY_LABELS[cap]}
                  </p>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="font-serif text-3xl font-bold text-brand-dark-blue">
                      {result.score !== null ? result.score.toFixed(2) : '—'}
                    </span>
                    {result.band ? (
                      <span
                        className="text-[11px] font-bold uppercase tracking-[2px]"
                        style={{ color: BAND_HEX[result.band] }}
                      >
                        {BAND_LABEL[result.band]}
                      </span>
                    ) : null}
                  </div>
                  {result.spread !== null &&
                  result.spread > 1.0 &&
                  result.min !== null &&
                  result.max !== null ? (
                    <p className="mt-1 text-xs italic text-brand-grey-text">
                      Team is split — range {result.min.toFixed(1)} to {result.max.toFixed(1)}
                    </p>
                  ) : null}

                  <div className="mt-4 space-y-4">
                    {aiObservations.length > 0 ? (
                      <BulletList eyebrow="Observations" items={aiObservations} variant="ai" />
                    ) : null}
                    {aiActions.length > 0 ? (
                      <NumberedList
                        eyebrow="Correlated Activities"
                        items={aiActions}
                        variant="ai"
                      />
                    ) : null}
                    <NumberedList
                      eyebrow="Action Items"
                      items={[baselineA, baselineB]}
                      variant="baseline"
                    />
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function BulletList({
  eyebrow,
  items,
  variant,
}: {
  eyebrow: string
  items: string[]
  variant: 'ai' | 'baseline'
}) {
  const eyebrowColor = variant === 'ai' ? 'text-brand-ochre' : 'text-brand-grey-text'
  const dotColor = variant === 'ai' ? 'bg-brand-ochre' : 'bg-brand-grey-text'
  return (
    <div>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-[2px] ${eyebrowColor}`}>
        {eyebrow}
      </p>
      <ul className="space-y-2 text-sm text-brand-dark-blue">
        {items.map((text, i) => (
          <li key={i} className="flex gap-2.5">
            <span className={`mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
            <span className="leading-relaxed">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NumberedList({
  eyebrow,
  items,
  variant,
}: {
  eyebrow: string
  items: string[]
  variant: 'ai' | 'baseline'
}) {
  const eyebrowColor = variant === 'ai' ? 'text-brand-ochre' : 'text-brand-grey-text'
  const bulletBg = variant === 'ai' ? 'bg-brand-ochre/15' : 'bg-brand-grey-soft-bg'
  return (
    <div>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-[2px] ${eyebrowColor}`}>
        {eyebrow}
      </p>
      <ol className="space-y-2 text-sm text-brand-dark-blue">
        {items.map((text, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-brand-dark-blue ${bulletBg}`}
            >
              {i + 1}
            </span>
            <span className="leading-relaxed">{text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
