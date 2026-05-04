'use client'

// Section — Individual Responses (Phase 6.5).
//
// Now collapsed by default (alignment 2026-05-03): the per-respondent
// table is supplementary detail, not integral to the report. Admin
// expands when they want to drill in.
//
// The capability heatmap was dropped entirely in Phase 6.5 — Capability
// Profile already conveys the same data more legibly.
//
// v1: names are shown directly. The proper anonymization (letter labels +
// admin reveal toggle + audit log) is deferred to a later phase. Spec 05
// § 6 / spec 11 § 3 cover the anonymized-by-default rule we're knowingly
// stepping outside of for now.

import { useState } from 'react'

import {
  LEVEL_LABELS,
  PILLAR_LABELS,
  PILLAR_ORDER,
  TENURE_LABELS,
  bandFor,
} from '@/data/constants'
import type { RespondentRow } from '@/lib/results-service'
import { BAND_HEX, BAND_LABEL } from './band-style'

interface IndividualResponsesSectionProps {
  respondents: RespondentRow[]
}

export function IndividualResponsesSection({ respondents }: IndividualResponsesSectionProps) {
  const [open, setOpen] = useState(false)
  const count = respondents.length

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="individual-responses-table"
        className="flex w-full items-center justify-between gap-3 rounded border border-brand-grey-light bg-white px-5 py-4 text-left shadow-sm transition hover:bg-brand-grey-soft-bg"
      >
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
            Individual Responses
          </span>
          <span className="text-xs text-brand-grey-text">
            {count} {count === 1 ? 'respondent' : 'respondents'}
          </span>
        </div>
        <Chevron open={open} />
      </button>

      {open ? (
        <div
          id="individual-responses-table"
          className="mt-3 overflow-hidden rounded border border-brand-grey-light bg-white shadow-sm"
        >
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
      ) : null}
    </section>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={`shrink-0 text-brand-grey-text transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BandCell({ value }: { value: number | null }) {
  if (value === null) {
    return <td className="px-4 py-3 text-right text-brand-grey-text">—</td>
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
