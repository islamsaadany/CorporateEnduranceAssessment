// Section 1 — Summary hero panel.
// Spec 05 § 3. Dark-blue background, ochre eyebrow + score numeral,
// 3-pillar breakdown on the right, band legend at the bottom.

import {
  BAND_INTERPRETATION,
  BAND_THRESHOLDS,
  PILLAR_LABELS,
  PILLAR_ORDER,
  PILLAR_VERB_PAIRS,
} from '@/data/constants'
import type { AggregatedResults } from '@/data/types'
import { BAND_HEX, BAND_LABEL, BAND_RANGE_LABEL } from './band-style'

interface SummarySectionProps {
  aggregates: AggregatedResults
}

export function SummarySection({ aggregates }: SummarySectionProps) {
  const { overall, pillars } = aggregates
  return (
    <section className="overflow-hidden rounded bg-brand-dark-blue text-white shadow-sm">
      <div className="grid gap-8 px-6 py-8 md:grid-cols-[5fr_4fr] md:px-10 md:py-10">
        {/* Left — hero score */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[3px] text-brand-ochre">
            Team Endurance Score
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-serif text-[88px] font-bold leading-none">
              {formatScore(overall.score)}
            </span>
            <span className="text-2xl text-white/60">/ 4.00</span>
          </div>
          {overall.band ? (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[3px] text-brand-ochre">
              {BAND_LABEL[overall.band]}
            </p>
          ) : null}
          {overall.band ? (
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/85">
              {BAND_INTERPRETATION[overall.band]}
            </p>
          ) : (
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
              No respondents have rated any capability yet.
            </p>
          )}
        </div>

        {/* Right — pillar breakdown */}
        <div className="space-y-5">
          {PILLAR_ORDER.map((p) => {
            const pillar = pillars[p]
            return (
              <div key={p} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{PILLAR_LABELS[p]}</p>
                    <p className="text-xs text-brand-ochre">{PILLAR_VERB_PAIRS[p]}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-3xl font-bold leading-none">
                      {formatScore(pillar.score)}
                    </p>
                    {pillar.band ? (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[2px] text-white/70">
                        {BAND_LABEL[pillar.band]}
                      </p>
                    ) : null}
                  </div>
                </div>
                <ProgressBar score={pillar.score} band={pillar.band ?? null} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Band legend */}
      <div className="border-t border-white/10 bg-brand-dark-blue-soft px-6 py-4 md:px-10">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/85">
          {BAND_THRESHOLDS.map((b) => (
            <li key={b.key} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: BAND_HEX[b.key] }}
              />
              <span className="font-medium">{b.label}</span>
              <span className="text-white/55">({BAND_RANGE_LABEL[b.key]})</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ProgressBar({
  score,
  band,
}: {
  score: number | null
  band: import('@/data/types').BandKey | null
}) {
  const pct = score !== null ? Math.max(0, Math.min(1, score / 4)) * 100 : 0
  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded bg-white/10">
      {band ? (
        <div
          className="h-full"
          style={{ width: `${pct}%`, backgroundColor: BAND_HEX[band] }}
        />
      ) : null}
    </div>
  )
}

function formatScore(score: number | null): string {
  return score === null ? '—' : score.toFixed(2)
}
