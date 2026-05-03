// Section 4 — Individual Responses.
//
// v1: names are shown directly. The proper anonymization (letter labels +
// admin reveal toggle + audit log) is deferred to a later phase. Spec 05
// § 6 / spec 11 § 3 cover the anonymized-by-default rule we're knowingly
// stepping outside of for now — when the toggle lands, this section
// switches to letters by default and the heatmap stays unchanged.

import {
  CAPABILITY_LABELS,
  CAPABILITY_ORDER,
  CAPABILITY_TO_PILLAR,
  LEVEL_LABELS,
  PILLAR_LABELS,
  PILLAR_ORDER,
  TENURE_LABELS,
  bandFor,
} from '@/data/constants'
import type { CapabilityKey } from '@/data/types'
import type { RespondentRow } from '@/lib/results-service'
import { BAND_HEX, BAND_LABEL } from './band-style'

interface IndividualResponsesSectionProps {
  respondents: RespondentRow[]
}

export function IndividualResponsesSection({ respondents }: IndividualResponsesSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
        Individual Responses
      </h2>

      <div className="overflow-hidden rounded border border-brand-grey-light bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-brand-grey-light bg-brand-grey-soft-bg text-left text-[11px] font-bold uppercase tracking-[2px] text-brand-grey-text">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Tenure</th>
                <th className="px-4 py-3 text-right">Overall</th>
                {PILLAR_ORDER.map((p) => (
                  <th key={p} className="px-4 py-3 text-right">
                    {PILLAR_LABELS[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-grey-light">
              {respondents.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium text-brand-dark-blue">
                    {r.name ?? <span className="text-brand-grey-text">—</span>}
                  </td>
                  <td className="px-4 py-3 text-brand-grey-text">
                    {r.department ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-brand-grey-text">
                    {r.level ? LEVEL_LABELS[r.level] : '—'}
                  </td>
                  <td className="px-4 py-3 text-brand-grey-text">
                    {r.tenure ? TENURE_LABELS[r.tenure] : '—'}
                  </td>
                  <BandCell value={r.overall} />
                  {PILLAR_ORDER.map((p) => (
                    <BandCell key={p} value={r.pillars[p]} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-brand-grey-text">
          Capability heatmap
        </h3>
        <CapabilityHeatmap respondents={respondents} />
      </div>
    </section>
  )
}

function BandCell({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <td className="px-4 py-3 text-right text-brand-grey-text">—</td>
    )
  }
  const band = bandFor(value)
  return (
    <td className="px-4 py-3 text-right">
      <span
        className="inline-flex items-baseline gap-2 rounded px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: BAND_HEX[band] + '22', color: BAND_HEX[band] }}
        title={BAND_LABEL[band]}
      >
        <span className="font-serif text-sm font-semibold">{value.toFixed(2)}</span>
      </span>
    </td>
  )
}

// Heatmap: rows = capabilities, columns = respondents. Each cell shows
// the band color (no numeric value, per spec 05 § 6.2). Score is in the
// title attribute as a hover hint.
function CapabilityHeatmap({ respondents }: { respondents: RespondentRow[] }) {
  if (respondents.length === 0) return null

  return (
    <div className="overflow-x-auto rounded border border-brand-grey-light bg-white shadow-sm">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-brand-grey-light bg-brand-grey-soft-bg px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[2px] text-brand-grey-text">
              Capability
            </th>
            {respondents.map((r, i) => (
              <th
                key={i}
                className="border-b border-brand-grey-light bg-brand-grey-soft-bg px-2 py-2 text-center text-[11px] font-medium text-brand-grey-text"
                title={r.name ?? ''}
              >
                {/* Truncate long names so the heatmap stays compact. */}
                {r.name ? truncate(r.name, 14) : '—'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PILLAR_ORDER.flatMap((p) =>
            CAPABILITY_ORDER.filter((c) => CAPABILITY_TO_PILLAR[c] === p).map((cap) => (
              <HeatmapRow key={cap} cap={cap} respondents={respondents} />
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}

function HeatmapRow({
  cap,
  respondents,
}: {
  cap: CapabilityKey
  respondents: RespondentRow[]
}) {
  return (
    <tr>
      <th
        scope="row"
        className="sticky left-0 z-10 border-b border-brand-grey-light bg-white px-3 py-2 text-left text-xs font-medium text-brand-dark-blue"
      >
        {CAPABILITY_LABELS[cap]}
      </th>
      {respondents.map((r, i) => {
        const score = r.capabilities[cap]
        const band = score !== null ? bandFor(score) : null
        return (
          <td
            key={i}
            className="border-b border-brand-grey-light px-1 py-1 text-center"
            title={
              score !== null && band
                ? `${r.name ?? ''} · ${CAPABILITY_LABELS[cap]} · ${score.toFixed(2)} (${BAND_LABEL[band]})`
                : `${r.name ?? ''} · ${CAPABILITY_LABELS[cap]} · No data`
            }
          >
            <span
              className="block h-6 w-full rounded-sm"
              style={{
                backgroundColor: band ? BAND_HEX[band] : '#E8EBEE',
                opacity: band ? 0.85 : 0.4,
              }}
            />
          </td>
        )
      })}
    </tr>
  )
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…'
}
