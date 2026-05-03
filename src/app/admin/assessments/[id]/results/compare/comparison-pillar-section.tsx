// Twin pillar progress bars per pillar — three rows (Agility, Toughness,
// Resilience), each showing A and B side-by-side. Spec 05 § 9.1.

import { PILLAR_LABELS, PILLAR_ORDER, PILLAR_VERB_PAIRS } from '@/data/constants'
import type { BandKey, PillarKey, PillarResult } from '@/data/types'
import type { ResultsBundle } from '@/lib/results-service'
import { BAND_HEX, BAND_LABEL } from '../band-style'

interface ComparisonPillarSectionProps {
  a: ResultsBundle
  b: ResultsBundle
}

export function ComparisonPillarSection({ a, b }: ComparisonPillarSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
        Pillar Breakdown
      </h2>
      <div className="space-y-4">
        {PILLAR_ORDER.map((p) => (
          <PillarRow key={p} pillar={p} a={a} b={b} />
        ))}
      </div>
    </section>
  )
}

function PillarRow({ pillar, a, b }: { pillar: PillarKey; a: ResultsBundle; b: ResultsBundle }) {
  const aResult = a.aggregates?.pillars[pillar]
  const bResult = b.aggregates?.pillars[pillar]
  return (
    <div className="rounded border border-brand-grey-light bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-brand-dark-blue">{PILLAR_LABELS[pillar]}</h3>
          <p className="text-xs text-brand-ochre">{PILLAR_VERB_PAIRS[pillar]}</p>
        </div>
        <PillarDelta a={aResult?.score ?? null} b={bResult?.score ?? null} />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SideBar side="A" locked={!!a.lock} result={aResult} />
        <SideBar side="B" locked={!!b.lock} result={bResult} />
      </div>
    </div>
  )
}

function PillarDelta({ a, b }: { a: number | null; b: number | null }) {
  if (a === null || b === null) return null
  const diff = a - b
  if (Math.abs(diff) < 0.005) {
    return <span className="text-[11px] font-bold uppercase tracking-[2px] text-brand-grey-text">Equal</span>
  }
  return (
    <span className="text-[11px] font-bold uppercase tracking-[2px] text-brand-grey-text">
      Δ {diff > 0 ? '+' : '−'}
      {Math.abs(diff).toFixed(2)}
    </span>
  )
}

function SideBar({
  side,
  locked,
  result,
}: {
  side: 'A' | 'B'
  locked: boolean
  result: PillarResult | undefined
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[2px] text-brand-grey-text">
          {side}
        </span>
        {locked ? (
          <span className="text-xs text-brand-grey-text">Locked</span>
        ) : result?.score !== null && result?.score !== undefined ? (
          <span className="font-serif text-lg font-bold text-brand-dark-blue">
            {result.score.toFixed(2)}{' '}
            {result.band ? (
              <span
                className="ml-1 align-middle text-[10px] font-bold uppercase tracking-[2px]"
                style={{ color: BAND_HEX[result.band] }}
              >
                {BAND_LABEL[result.band]}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-xs text-brand-grey-text">—</span>
        )}
      </div>
      <ProgressBar
        score={locked ? null : (result?.score ?? null)}
        band={locked ? null : (result?.band ?? null)}
      />
    </div>
  )
}

function ProgressBar({ score, band }: { score: number | null; band: BandKey | null }) {
  const pct = score !== null ? Math.max(0, Math.min(1, score / 4)) * 100 : 0
  return (
    <div className="mt-1 h-2 w-full overflow-hidden rounded bg-brand-grey-light">
      {band ? <div className="h-full" style={{ width: `${pct}%`, backgroundColor: BAND_HEX[band] }} /> : null}
    </div>
  )
}
