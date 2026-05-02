'use client'

// The single client-side surface for the report's filter UI:
// the active-filter chip row, the matching-respondent count, the
// "Change filter" button, and the filter modal it opens. URL is the
// source of truth for the filter — the chips and the modal both
// navigate via `router.push` on change, and the page re-renders
// server-side from the new query string.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Level, TenureBand } from '@prisma/client'

import { LEVEL_LABELS, TENURE_LABELS } from '@/data/constants'
import type { ParsedFilter } from '@/data/types'
import { filterToQueryString } from '@/lib/filters'

import { FilterModal } from './filter-modal'

interface FilterControlsProps {
  assessmentId: string
  currentFilter: ParsedFilter
  matchingFilter: number
  isCompanyWide: boolean
  availableDepartments: string[]
  allSubmittedDemos: Array<{
    department: string | null
    level: Level | null
    tenure: TenureBand | null
  }>
}

export function FilterControls(props: FilterControlsProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const navigate = (filter: ParsedFilter) => {
    const qs = filterToQueryString(filter)
    const url = `/admin/assessments/${props.assessmentId}/results${qs ? `?${qs}` : ''}`
    router.push(url)
  }

  const removeChip = (kind: 'dept' | 'level' | 'tenure', value: string) => {
    const next: ParsedFilter = {
      departments:
        kind === 'dept'
          ? props.currentFilter.departments.filter((v) => v !== value)
          : props.currentFilter.departments,
      levels:
        kind === 'level'
          ? props.currentFilter.levels.filter((v) => v !== value)
          : props.currentFilter.levels,
      tenures:
        kind === 'tenure'
          ? props.currentFilter.tenures.filter((v) => v !== value)
          : props.currentFilter.tenures,
    }
    navigate(next)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded border border-brand-grey-light bg-brand-grey-soft-bg px-4 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[2px] text-brand-grey-text">
          Filter:
        </span>

        {props.isCompanyWide ? (
          <span className="text-sm font-medium text-brand-dark-blue">Company-wide</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {props.currentFilter.departments.map((d) => (
              <Chip key={`dept-${d}`} label={d} onRemove={() => removeChip('dept', d)} />
            ))}
            {props.currentFilter.levels.map((l) => (
              <Chip
                key={`lvl-${l}`}
                label={LEVEL_LABELS[l]}
                onRemove={() => removeChip('level', l)}
              />
            ))}
            {props.currentFilter.tenures.map((t) => (
              <Chip
                key={`tnr-${t}`}
                label={TENURE_LABELS[t]}
                onRemove={() => removeChip('tenure', t)}
              />
            ))}
          </div>
        )}

        <span className="text-sm text-brand-grey-text">
          ·{' '}
          {props.matchingFilter} respondent{props.matchingFilter === 1 ? '' : 's'}
        </span>

        <span className="ml-auto" />

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded border border-brand-dark-blue bg-white px-3 py-1 text-xs font-medium text-brand-dark-blue transition hover:bg-brand-dark-blue hover:text-white"
        >
          Change filter
        </button>
      </div>

      <FilterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApply={(filter) => {
          setModalOpen(false)
          navigate(filter)
        }}
        currentFilter={props.currentFilter}
        availableDepartments={props.availableDepartments}
        allSubmittedDemos={props.allSubmittedDemos}
      />
    </>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-ochre bg-brand-ochre-soft/30 px-2.5 py-0.5 text-xs text-brand-dark-blue">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="leading-none text-brand-grey-text transition hover:text-brand-dark-blue"
        aria-label={`Remove ${label} from filter`}
      >
        ×
      </button>
    </span>
  )
}
