// Twin score bars per capability, in canonical order so the eye can
// compare A and B like-with-like. No spread sort here — that lives on
// the single-filter view. Spec 05 § 9.1.

import {
  CAPABILITY_LABELS,
  CAPABILITY_ORDER,
  CAPABILITY_TO_PILLAR,
  PILLAR_LABELS,
  PILLAR_ORDER,
} from '@/data/constants'
import type { BandKey, CapabilityKey, CapabilityResult, PillarKey } from '@/data/types'
import type { ResultsBundle } from '@/lib/results-service'
import { BAND_HEX } from '../band-style'

interface ComparisonCapabilitySectionProps {
  a: ResultsBundle
  b: ResultsBundle
}

export function ComparisonCapabilitySection({ a, b }: ComparisonCapabilitySectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
        Capability Profile
      </h2>
      <div className="space-y-6">
        {PILLAR_ORDER.map((p) => (
          <PillarBlock key={p} pillar={p} a={a} b={b} />
        ))}
      </div>
    </section>
  )
}

function PillarBlock({ pillar, a, b }: { pillar: PillarKey; a: ResultsBundle; b: ResultsBundle }) {
  const caps = CAPABILITY_ORDER.filter((c) => CAPABILITY_TO_PILLAR[c] === pillar)
  return (
    <div className="overflow-hidden rounded border border-brand-grey-light bg-white shadow-sm">
      <header className="bg-brand-dark-blue px-4 py-2.5 text-white">
        <p className="text-base font-semibold">{PILLAR_LABELS[pillar]}</p>
      </header>
      <ul className="divide-y divide-brand-grey-light">
        {caps.map((cap) => (
          <CapabilityRow
            key={cap}
            cap={cap}
            aLocked={!!a.lock}
            bLocked={!!b.lock}
            aResult={a.aggregates?.capabilities[cap]}
            bResult={b.aggregates?.capabilities[cap]}
          />
        ))}
      </ul>
    </div>
  )
}

function CapabilityRow({
  cap,
  aLocked,
  bLocked,
  aResult,
  bResult,
}: {
  cap: CapabilityKey
  aLocked: boolean
  bLocked: boolean
  aResult: CapabilityResult | undefined
  bResult: CapabilityResult | undefined
}) {
  const aScore = aLocked ? null : (aResult?.score ?? null)
  const bScore = bLocked ? null : (bResult?.score ?? null)
  return (
    <li className="px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-brand-dark-blue">{CAPABILITY_LABELS[cap]}</p>
        <Delta a={aScore} b={bScore} />
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <SideRow side="A" score={aScore} band={aLocked ? null : (aResult?.band ?? null)} insufficient={aResult?.insufficient ?? aLocked} />
        <SideRow side="B" score={bScore} band={bLocked ? null : (bResult?.band ?? null)} insufficient={bResult?.insufficient ?? bLocked} />
      </div>
    </li>
  )
}

function SideRow({
  side,
  score,
  band,
  insufficient,
}: {
  side: 'A' | 'B'
  score: number | null
  band: BandKey | null
  insufficient: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-3 text-[10px] font-bold uppercase tracking-[2px] text-brand-grey-text">
        {side}
      </span>
      <div className="flex-1">
        <div className="h-2 w-full overflow-hidden rounded bg-brand-grey-light">
          {band ? (
            <div
              className="h-full"
              style={{
                width: `${Math.max(0, Math.min(1, (score ?? 0) / 4)) * 100}%`,
                backgroundColor: BAND_HEX[band],
              }}
            />
          ) : null}
        </div>
      </div>
      <span className="w-14 text-right font-serif text-sm font-semibold text-brand-dark-blue">
        {insufficient ? '—' : score?.toFixed(2) ?? '—'}
      </span>
    </div>
  )
}

function Delta({ a, b }: { a: number | null; b: number | null }) {
  if (a === null || b === null) return null
  const diff = a - b
  if (Math.abs(diff) < 0.005) return null
  return (
    <span className="text-[10px] font-bold uppercase tracking-[2px] text-brand-grey-text">
      Δ {diff > 0 ? '+' : '−'}
      {Math.abs(diff).toFixed(2)}
    </span>
  )
}
