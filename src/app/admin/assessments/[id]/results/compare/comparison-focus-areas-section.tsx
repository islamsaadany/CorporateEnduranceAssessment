// Twin top-5 focus area lists. Capabilities that appear in only one
// side's top-5 get a "Only in A" / "Only in B" badge so the difference
// is immediately visible. Spec 05 § 9.1.
//
// Per spec 06 § 6.3, no AI-adapted action items here in v1 — the lists
// are quantitative only.

import { CAPABILITY_LABELS, CAPABILITY_TO_PILLAR, PILLAR_LABELS } from '@/data/constants'
import type { CapabilityKey } from '@/data/types'
import type { ResultsBundle } from '@/lib/results-service'
import { BAND_HEX, BAND_LABEL } from '../band-style'

interface ComparisonFocusAreasSectionProps {
  a: ResultsBundle
  b: ResultsBundle
}

export function ComparisonFocusAreasSection({ a, b }: ComparisonFocusAreasSectionProps) {
  const aFocus = a.aggregates?.focusAreas ?? []
  const bFocus = b.aggregates?.focusAreas ?? []
  const aSet = new Set(aFocus)
  const bSet = new Set(bFocus)
  return (
    <section>
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
        Focus Areas
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FocusList side="A" bundle={a} focus={aFocus} other={bSet} />
        <FocusList side="B" bundle={b} focus={bFocus} other={aSet} />
      </div>
    </section>
  )
}

function FocusList({
  side,
  bundle,
  focus,
  other,
}: {
  side: 'A' | 'B'
  bundle: ResultsBundle
  focus: CapabilityKey[]
  other: Set<CapabilityKey>
}) {
  return (
    <div className="overflow-hidden rounded border border-brand-grey-light bg-white shadow-sm">
      <header className="border-b border-brand-grey-light px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[3px] text-brand-ochre">
          Filter {side}
        </p>
        <p className="mt-0.5 text-xs text-brand-grey-text">{bundle.filter.description}</p>
      </header>
      {bundle.lock ? (
        <p className="px-4 py-6 text-center text-sm italic text-brand-grey-text">
          Locked — too few respondents to display focus areas.
        </p>
      ) : focus.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm italic text-brand-grey-text">
          Not enough rated capabilities to surface focus areas.
        </p>
      ) : (
        <ol className="divide-y divide-brand-grey-light">
          {focus.map((cap, i) => {
            const result = bundle.aggregates!.capabilities[cap]
            const pillar = CAPABILITY_TO_PILLAR[cap]
            const onlyHere = !other.has(cap)
            return (
              <li key={cap} className="flex items-start gap-3 px-4 py-3">
                <span className="font-serif text-2xl font-bold text-brand-ochre">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[2px] text-brand-grey-text">
                    {PILLAR_LABELS[pillar]}
                  </p>
                  <p className="text-sm font-medium text-brand-dark-blue">
                    {CAPABILITY_LABELS[cap]}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-serif text-base font-semibold text-brand-dark-blue">
                      {result.score?.toFixed(2) ?? '—'}
                    </span>
                    {result.band ? (
                      <span
                        className="text-[10px] font-bold uppercase tracking-[2px]"
                        style={{ color: BAND_HEX[result.band] }}
                      >
                        {BAND_LABEL[result.band]}
                      </span>
                    ) : null}
                    {onlyHere ? (
                      <span className="rounded-full bg-brand-ochre-soft/40 px-2 py-0.5 text-[10px] font-medium text-brand-dark-blue">
                        Only in {side}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
