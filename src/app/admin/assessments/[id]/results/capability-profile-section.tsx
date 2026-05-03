// Section 2 — Capability Profile.
// Spec 05 § 4. Three columns side-by-side, one per pillar. Each column
// has a compact pillar header + 5 capability rows.

import {
  CAPABILITY_LABELS,
  CAPABILITY_ORDER,
  CAPABILITY_TO_PILLAR,
  PILLAR_LABELS,
  PILLAR_ORDER,
  PILLAR_VERB_PAIRS,
} from '@/data/constants'
import type {
  AggregatedResults,
  BandKey,
  CapabilityKey,
  PillarKey,
} from '@/data/types'
import { BAND_HEX, BAND_LABEL } from './band-style'

interface CapabilityProfileSectionProps {
  aggregates: AggregatedResults
}

export function CapabilityProfileSection({ aggregates }: CapabilityProfileSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
        Capability Profile
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {PILLAR_ORDER.map((p) => (
          <PillarColumn key={p} pillar={p} aggregates={aggregates} />
        ))}
      </div>
    </section>
  )
}

function PillarColumn({
  pillar,
  aggregates,
}: {
  pillar: PillarKey
  aggregates: AggregatedResults
}) {
  const pillarResult = aggregates.pillars[pillar]
  const caps = CAPABILITY_ORDER.filter((c) => CAPABILITY_TO_PILLAR[c] === pillar)
  // Within each pillar column, order strongest → weakest (spec 05 § 4.2).
  // Insufficient capabilities sink to the bottom so the visual hierarchy
  // still reads "what's working at top, what's not at bottom".
  const sortedCaps = [...caps].sort((a, b) => {
    const aRes = aggregates.capabilities[a]
    const bRes = aggregates.capabilities[b]
    if (aRes.score === null && bRes.score === null) return 0
    if (aRes.score === null) return 1
    if (bRes.score === null) return -1
    return bRes.score - aRes.score
  })

  return (
    <div className="overflow-hidden rounded border border-brand-grey-light bg-white shadow-sm">
      <header className="bg-brand-dark-blue px-4 py-3 text-white">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-base font-semibold">{PILLAR_LABELS[pillar]}</p>
            <p className="text-[11px] text-brand-ochre">{PILLAR_VERB_PAIRS[pillar]}</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl font-bold leading-none">
              {pillarResult.score === null ? '—' : pillarResult.score.toFixed(2)}
            </p>
            {pillarResult.band ? (
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[2px] text-white/70">
                {BAND_LABEL[pillarResult.band]}
              </p>
            ) : null}
          </div>
        </div>
      </header>
      <ul className="divide-y divide-brand-grey-light">
        {sortedCaps.map((cap) => (
          <CapabilityRow
            key={cap}
            cap={cap}
            result={aggregates.capabilities[cap]}
          />
        ))}
      </ul>
    </div>
  )
}

function CapabilityRow({
  cap,
  result,
}: {
  cap: CapabilityKey
  result: AggregatedResults['capabilities'][CapabilityKey]
}) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-brand-dark-blue">
          {CAPABILITY_LABELS[cap]}
        </p>
        <p className="font-serif text-base font-semibold text-brand-dark-blue">
          {result.insufficient ? '—' : result.score!.toFixed(1)}
        </p>
      </div>
      <ScoreBar score={result.score} band={result.band} />
      {result.insufficient ? (
        <p className="mt-1.5 text-[11px] italic text-brand-grey-text">
          Insufficient data — fewer than 3 respondents rated this capability
        </p>
      ) : result.spread !== null &&
        result.spread > 1.0 &&
        result.min !== null &&
        result.max !== null ? (
        <p className="mt-1.5 text-[11px] italic text-brand-grey-text">
          Range: {result.min.toFixed(1)} – {result.max.toFixed(1)}
          {result.spread > 1.5 ? (
            <span className="ml-2 rounded bg-brand-ochre-soft/40 px-1.5 py-0.5 text-[10px] font-medium not-italic text-brand-dark-blue">
              Team is split
            </span>
          ) : null}
        </p>
      ) : null}
    </li>
  )
}

function ScoreBar({
  score,
  band,
}: {
  score: number | null
  band: BandKey | null
}) {
  const pct = score !== null ? Math.max(0, Math.min(1, score / 4)) * 100 : 0
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded bg-brand-grey-light">
      {band ? (
        <div
          className="h-full"
          style={{ width: `${pct}%`, backgroundColor: BAND_HEX[band] }}
        />
      ) : null}
    </div>
  )
}
