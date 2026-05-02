'use client'

// Twin filter pickers for the comparison view. Each side shows its own
// chip row + matching count + "Change filter" button. Both buttons open
// the same `FilterModal`, scoped to that side's draft. URL is the source
// of truth — both A and B navigate via router.push to the prefixed
// query string format (`aDept=…&aLevel=…&bDept=…`).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Level, TenureBand } from '@prisma/client'

import { LEVEL_LABELS, TENURE_LABELS } from '@/data/constants'
import type { ParsedFilter } from '@/data/types'
import { filterToQueryString, isCompanyWide } from '@/lib/filters'

import { FilterModal } from '../filter-modal'

interface SubmittedDemo {
  department: string | null
  level: Level | null
  tenure: TenureBand | null
}

export interface ComparisonFilterControlsProps {
  assessmentId: string
  filterA: ParsedFilter
  filterB: ParsedFilter
  matchingA: number
  matchingB: number
  availableDepartments: string[]
  allSubmittedDemos: SubmittedDemo[]
}

export function ComparisonFilterControls(props: ComparisonFilterControlsProps) {
  const router = useRouter()
  const [openSide, setOpenSide] = useState<'a' | 'b' | null>(null)

  const navigate = (a: ParsedFilter, b: ParsedFilter) => {
    const aQs = filterToQueryString(a, 'a')
    const bQs = filterToQueryString(b, 'b')
    const qs = [aQs, bQs].filter(Boolean).join('&')
    const url = `/admin/assessments/${props.assessmentId}/results/compare${qs ? `?${qs}` : ''}`
    router.push(url)
  }

  const removeChip = (
    side: 'a' | 'b',
    kind: 'dept' | 'level' | 'tenure',
    value: string,
  ) => {
    const apply = (f: ParsedFilter): ParsedFilter => ({
      departments: kind === 'dept' ? f.departments.filter((v) => v !== value) : f.departments,
      levels: kind === 'level' ? f.levels.filter((v) => v !== value) : f.levels,
      tenures: kind === 'tenure' ? f.tenures.filter((v) => v !== value) : f.tenures,
    })
    if (side === 'a') navigate(apply(props.filterA), props.filterB)
    else navigate(props.filterA, apply(props.filterB))
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SidePicker
          side="A"
          filter={props.filterA}
          matching={props.matchingA}
          onOpen={() => setOpenSide('a')}
          onRemove={(kind, value) => removeChip('a', kind, value)}
        />
        <SidePicker
          side="B"
          filter={props.filterB}
          matching={props.matchingB}
          onOpen={() => setOpenSide('b')}
          onRemove={(kind, value) => removeChip('b', kind, value)}
        />
      </div>

      <FilterModal
        open={openSide !== null}
        onClose={() => setOpenSide(null)}
        onApply={(filter) => {
          if (openSide === 'a') navigate(filter, props.filterB)
          else if (openSide === 'b') navigate(props.filterA, filter)
          setOpenSide(null)
        }}
        currentFilter={openSide === 'a' ? props.filterA : props.filterB}
        availableDepartments={props.availableDepartments}
        allSubmittedDemos={props.allSubmittedDemos}
      />
    </>
  )
}

function SidePicker({
  side,
  filter,
  matching,
  onOpen,
  onRemove,
}: {
  side: 'A' | 'B'
  filter: ParsedFilter
  matching: number
  onOpen: () => void
  onRemove: (kind: 'dept' | 'level' | 'tenure', value: string) => void
}) {
  const company = isCompanyWide(filter)
  return (
    <div className="rounded border border-brand-grey-light bg-brand-grey-soft-bg px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[3px] text-brand-ochre">
          Filter {side}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="rounded border border-brand-dark-blue bg-white px-2.5 py-0.5 text-xs font-medium text-brand-dark-blue transition hover:bg-brand-dark-blue hover:text-white"
        >
          Change
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {company ? (
          <span className="text-sm font-medium text-brand-dark-blue">Company-wide</span>
        ) : (
          <>
            {filter.departments.map((d) => (
              <Chip key={`dept-${d}`} label={d} onRemove={() => onRemove('dept', d)} />
            ))}
            {filter.levels.map((l) => (
              <Chip
                key={`lvl-${l}`}
                label={LEVEL_LABELS[l]}
                onRemove={() => onRemove('level', l)}
              />
            ))}
            {filter.tenures.map((t) => (
              <Chip
                key={`tnr-${t}`}
                label={TENURE_LABELS[t]}
                onRemove={() => onRemove('tenure', t)}
              />
            ))}
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-brand-grey-text">
        {matching} respondent{matching === 1 ? '' : 's'}
      </p>
    </div>
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
