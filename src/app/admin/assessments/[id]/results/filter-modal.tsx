'use client'

// Multi-select filter modal for the report. Three sections (Department,
// Level, Tenure), live preview of how many submitted respondents match
// the in-progress filter draft, Apply/Cancel/Clear-all controls.
//
// "Apply" is enabled only when the draft differs from the current filter,
// and is allowed even when the count is below the anonymity floor — the
// admin gets a lock card on the next page (per slice 6.3 Q4 / spec 06 § 3).

import { useEffect, useMemo, useState } from 'react'
import type { Level, TenureBand } from '@prisma/client'

import {
  LEVELS,
  LEVEL_LABELS,
  MIN_RESPONDENTS_FOR_VIEW,
  TENURE_BANDS,
  TENURE_LABELS,
} from '@/data/constants'
import type { ParsedFilter } from '@/data/types'

export interface FilterModalProps {
  open: boolean
  onClose: () => void
  onApply: (filter: ParsedFilter) => void
  currentFilter: ParsedFilter
  availableDepartments: string[]
  allSubmittedDemos: Array<{
    department: string | null
    level: Level | null
    tenure: TenureBand | null
  }>
}

export function FilterModal({
  open,
  onClose,
  onApply,
  currentFilter,
  availableDepartments,
  allSubmittedDemos,
}: FilterModalProps) {
  const [draft, setDraft] = useState<ParsedFilter>(currentFilter)

  // Reset draft to the current filter every time the modal reopens, so a
  // partial selection from a previous Cancel doesn't leak in.
  useEffect(() => {
    if (open) setDraft(currentFilter)
  }, [open, currentFilter])

  // Esc closes (= Cancel)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const matchCount = useMemo(
    () => countMatching(draft, allSubmittedDemos),
    [draft, allSubmittedDemos],
  )
  const hasChanges = !filtersEqual(draft, currentFilter)
  const floorMet = matchCount >= MIN_RESPONDENTS_FOR_VIEW

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Change filter"
    >
      {/* Backdrop — clicking it cancels */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close filter"
        className="absolute inset-0 cursor-default bg-brand-dark-blue/40"
      />

      {/* Panel */}
      <div className="relative z-10 max-h-full w-full max-w-2xl overflow-auto rounded bg-white shadow-xl">
        <header className="border-b border-brand-grey-light px-6 py-4">
          <h2 className="font-serif text-lg font-bold text-brand-dark-blue">Change filter</h2>
          <p className="mt-1 text-xs text-brand-grey-text">
            Slice the report by department, level, or tenure. Pick multiple values to
            include any of them; leave a section empty to include all.
          </p>
        </header>

        <div className="space-y-5 px-6 py-5">
          <Section
            title="Department"
            options={availableDepartments.map((d) => ({ value: d, label: d }))}
            selected={draft.departments}
            onChange={(v) => setDraft({ ...draft, departments: v })}
          />
          <Section<Level>
            title="Level"
            options={LEVELS.map((l) => ({ value: l, label: LEVEL_LABELS[l] }))}
            selected={draft.levels}
            onChange={(v) => setDraft({ ...draft, levels: v })}
          />
          <Section<TenureBand>
            title="Tenure"
            options={TENURE_BANDS.map((t) => ({ value: t, label: TENURE_LABELS[t] }))}
            selected={draft.tenures}
            onChange={(v) => setDraft({ ...draft, tenures: v })}
          />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-grey-light px-6 py-4">
          <div className="text-sm">
            <span className={floorMet ? 'text-brand-dark-blue' : 'text-report-band-needs'}>
              This filter matches {matchCount} respondent{matchCount === 1 ? '' : 's'}
            </span>
            <span className="ml-2 text-brand-grey-text">
              {floorMet ? '(anonymity floor met ✓)' : '(below floor — view will be locked)'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setDraft({ departments: [], levels: [], tenures: [] })}
              className="text-xs text-brand-grey-text hover:text-brand-dark-blue hover:underline"
            >
              Clear all filters
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-brand-grey-light bg-white px-3 py-1.5 text-sm font-medium text-brand-dark-blue transition hover:bg-brand-grey-soft-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(draft)}
              disabled={!hasChanges}
              className="rounded bg-brand-dark-blue px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark-blue-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

interface SectionProps<V extends string> {
  title: string
  options: Array<{ value: V; label: string }>
  selected: V[]
  onChange: (next: V[]) => void
}

function Section<V extends string>({ title, options, selected, onChange }: SectionProps<V>) {
  const allSelected = options.length > 0 && options.every((o) => selected.includes(o.value))
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[2px] text-brand-grey-text">
          {title}
        </h3>
        <div className="flex gap-3 text-xs">
          {!allSelected && options.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange(options.map((o) => o.value))}
              className="text-brand-dark-blue hover:underline"
            >
              Select all
            </button>
          ) : null}
          {selected.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-brand-grey-text hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
      {options.length === 0 ? (
        <p className="text-xs italic text-brand-grey-text">
          No options — admin hasn&apos;t defined any departments yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = selected.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  onChange(active ? selected.filter((v) => v !== o.value) : [...selected, o.value])
                }
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? 'border-brand-ochre bg-brand-ochre-soft/40 text-brand-dark-blue'
                    : 'border-brand-grey-light bg-white text-brand-grey-text hover:border-brand-ochre'
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function filtersEqual(a: ParsedFilter, b: ParsedFilter): boolean {
  return (
    setsEqual(a.departments, b.departments) &&
    setsEqual(a.levels, b.levels) &&
    setsEqual(a.tenures, b.tenures)
  )
}

function setsEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set<T>(a)
  return b.every((v) => set.has(v))
}

function countMatching(
  filter: ParsedFilter,
  demos: FilterModalProps['allSubmittedDemos'],
): number {
  const deptSet = filter.departments.length > 0 ? new Set(filter.departments) : null
  const levelSet = filter.levels.length > 0 ? new Set<Level>(filter.levels) : null
  const tenureSet = filter.tenures.length > 0 ? new Set<TenureBand>(filter.tenures) : null
  let count = 0
  for (const d of demos) {
    if (deptSet && (!d.department || !deptSet.has(d.department))) continue
    if (levelSet && (!d.level || !levelSet.has(d.level))) continue
    if (tenureSet && (!d.tenure || !tenureSet.has(d.tenure))) continue
    count++
  }
  return count
}
