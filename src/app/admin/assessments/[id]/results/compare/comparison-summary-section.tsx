// Section 1 of the comparison view — twin overall scores with a single
// delta indicator between them (per slice 6.4 Q3/B). Spec 05 § 9.1.

import { BAND_INTERPRETATION } from '@/data/constants'
import type { AggregatedResults } from '@/data/types'
import type { ResultsBundle } from '@/lib/results-service'
import { BAND_LABEL } from '../band-style'

interface ComparisonSummaryProps {
  a: ResultsBundle
  b: ResultsBundle
}

export function ComparisonSummarySection({ a, b }: ComparisonSummaryProps) {
  return (
    <section className="overflow-hidden rounded bg-brand-dark-blue text-white shadow-sm">
      <div className="grid grid-cols-1 gap-6 px-6 py-8 md:grid-cols-2 md:gap-10 md:px-10">
        <SideHero side="A" bundle={a} />
        <SideHero side="B" bundle={b} />
      </div>
      <DeltaStrip a={a} b={b} />
    </section>
  )
}

function SideHero({ side, bundle }: { side: 'A' | 'B'; bundle: ResultsBundle }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[3px] text-brand-ochre">
        Filter {side}
      </p>
      <p className="mt-1 text-sm text-white/85">{bundle.filter.description}</p>
      <p className="text-xs text-white/60">
        {bundle.counts.matchingFilter} respondent
        {bundle.counts.matchingFilter === 1 ? '' : 's'}
      </p>

      {bundle.lock ? (
        <p className="mt-6 max-w-md text-base leading-relaxed text-white/85">
          Locked — too few respondents ({bundle.lock.count}) to display this segment
          anonymously.
        </p>
      ) : bundle.aggregates ? (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-[72px] font-bold leading-none">
              {bundle.aggregates.overall.score?.toFixed(2) ?? '—'}
            </span>
            <span className="text-xl text-white/60">/ 4.00</span>
          </div>
          {bundle.aggregates.overall.band ? (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[3px] text-brand-ochre">
              {BAND_LABEL[bundle.aggregates.overall.band]}
            </p>
          ) : null}
          {bundle.aggregates.overall.band ? (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
              {BAND_INTERPRETATION[bundle.aggregates.overall.band]}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function DeltaStrip({ a, b }: { a: ResultsBundle; b: ResultsBundle }) {
  const aScore = a.aggregates?.overall.score
  const bScore = b.aggregates?.overall.score
  if (aScore === null || aScore === undefined || bScore === null || bScore === undefined) {
    return null
  }
  const diff = aScore - bScore
  const text =
    Math.abs(diff) < 0.005
      ? 'Equal'
      : diff > 0
        ? `A leads by ${Math.abs(diff).toFixed(2)}`
        : `B leads by ${Math.abs(diff).toFixed(2)}`
  return (
    <div className="border-t border-white/10 bg-brand-dark-blue-soft px-6 py-3 text-center md:px-10">
      <p className="text-xs font-bold uppercase tracking-[3px] text-brand-ochre">
        Δ Overall · {text}
      </p>
    </div>
  )
}

// re-export type for convenience
export type { AggregatedResults }
