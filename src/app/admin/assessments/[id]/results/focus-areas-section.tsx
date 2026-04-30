// Section 3 — Focus Areas. Top-5 weakest capabilities with two baseline
// action items each. Spec 05 § 5, spec 04 § 3 (action items). AI-adapted
// items land in Phase 7; this slice always renders the baseline.

import {
  BASELINE_ACTION_ITEMS,
  CAPABILITY_LABELS,
  CAPABILITY_TO_PILLAR,
  PILLAR_LABELS,
} from '@/data/constants'
import type { AggregatedResults } from '@/data/types'
import { BAND_HEX, BAND_LABEL } from './band-style'

interface FocusAreasSectionProps {
  aggregates: AggregatedResults
}

export function FocusAreasSection({ aggregates }: FocusAreasSectionProps) {
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

  return (
    <section>
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
        Focus Areas
      </h2>
      <div className="space-y-4">
        {focusAreas.map((cap, i) => {
          const result = capabilities[cap]
          const pillar = CAPABILITY_TO_PILLAR[cap]
          const [actionA, actionB] = BASELINE_ACTION_ITEMS[cap]
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
                  <ol className="mt-4 space-y-2 text-sm text-brand-dark-blue">
                    <ActionItem index={1} text={actionA} />
                    <ActionItem index={2} text={actionB} />
                  </ol>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ActionItem({ index, text }: { index: number; text: string }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-grey-soft-bg text-[11px] font-semibold text-brand-dark-blue">
        {index}
      </span>
      <span className="leading-relaxed">{text}</span>
    </li>
  )
}
