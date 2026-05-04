'use client'

// Phase 6.5 — "Who responded" section.
//
// Three pies: Department / Level / Tenure. Scope is ALL submitted
// respondents (not the filter), since the question we're answering is
// "who is this cohort?" — a property of the assessment, not the active
// filter view. A subtitle reminds the admin that scoring below uses the
// filter.
//
// Colors avoid the report-band palette deliberately (red/amber/green/blue
// are reserved for score bands; demographics shouldn't imply value).
// We use the existing brand-dark-blue + brand-ochre family.

import type { Level, TenureBand } from '@prisma/client'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { LEVEL_LABELS, LEVELS, TENURE_BANDS, TENURE_LABELS } from '@/data/constants'

interface DemoRow {
  department: string | null
  level: Level | null
  tenure: TenureBand | null
}

interface WhoRespondedSectionProps {
  /** All submitted respondents on this assessment, regardless of filter. */
  allSubmittedDemos: DemoRow[]
}

/**
 * 10-color palette for pie slices. Brand-rooted but properly distinct
 * (alignment 2026-05-03 — the previous 6-color set had too many close
 * dark-blues). Slices cycle through this list; each slice in the same
 * pie gets a different color.
 */
const PIE_PALETTE = [
  '#0B2545', // brand dark blue
  '#D4A24C', // brand ochre
  '#C0392B', // terracotta
  '#27AE60', // sage green
  '#7E57C2', // soft plum
  '#13315C', // brand dark blue soft
  '#E9C98A', // brand ochre soft
  '#5A6572', // brand grey
  '#E67E22', // burnt orange
  '#16A085', // teal
]

interface Slice {
  name: string
  value: number
}

export function WhoRespondedSection({ allSubmittedDemos }: WhoRespondedSectionProps) {
  const total = allSubmittedDemos.length

  if (total === 0) {
    return (
      <section>
        <SectionHeader total={0} />
        <div className="rounded border border-dashed border-brand-grey-light bg-white px-6 py-10 text-center text-sm text-brand-grey-text">
          No submitted respondents yet.
        </div>
      </section>
    )
  }

  const departmentSlices = bucketSlices(
    allSubmittedDemos.map((r) => r.department ?? 'Unknown'),
  )
  const levelSlices = bucketByOrder(
    allSubmittedDemos.map((r) => r.level),
    LEVELS,
    (k) => LEVEL_LABELS[k],
  )
  const tenureSlices = bucketByOrder(
    allSubmittedDemos.map((r) => r.tenure),
    TENURE_BANDS,
    (k) => TENURE_LABELS[k],
  )

  return (
    <section>
      <SectionHeader total={total} />
      <div className="grid gap-4 md:grid-cols-3">
        <PieCard title="Department" slices={departmentSlices} total={total} />
        <PieCard title="Seniority" slices={levelSlices} total={total} />
        <PieCard title="Tenure" slices={tenureSlices} total={total} />
      </div>
    </section>
  )
}

function SectionHeader({ total }: { total: number }) {
  return (
    <div className="mb-4">
      <h2 className="text-[11px] font-bold uppercase tracking-[3px] text-brand-grey-text">
        Who responded
      </h2>
      <p className="mt-1 text-xs text-brand-grey-text">
        Showing all {total} submitted {total === 1 ? 'respondent' : 'respondents'} — the cohort
        breakdown does not narrow with the filter. The scoring sections below do reflect the
        active filter.
      </p>
    </div>
  )
}

function PieCard({ title, slices, total }: { title: string; slices: Slice[]; total: number }) {
  // Per-slice % label printed inside the slice (alignment 2026-05-03).
  // Hide on slices < 5% of total — cramped labels look messy.
  const renderLabel = (entry: { value?: number }) => {
    const v = typeof entry.value === 'number' ? entry.value : 0
    const pct = Math.round((v / total) * 100)
    if (pct < 5) return ''
    return `${pct}%`
  }

  return (
    <div className="rounded border border-brand-grey-light bg-white p-4 shadow-sm">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-brand-ochre">
        {title}
      </p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={60}
              paddingAngle={2}
              isAnimationActive={false}
              label={renderLabel}
              labelLine={false}
              fontSize={11}
              fontWeight={600}
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const v = typeof value === 'number' ? value : Number(value) || 0
                return [`${v} (${Math.round((v / total) * 100)}%)`, String(name)]
              }}
              contentStyle={{
                background: 'white',
                border: '1px solid #E8EBEE',
                borderRadius: 4,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {slices.map((s, i) => (
          <li key={s.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-brand-dark-blue">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: PIE_PALETTE[i % PIE_PALETTE.length] }}
              />
              <span className="truncate">{s.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-brand-grey-text">
              {s.value} · {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Aggregation helpers ─────────────────────────────────────────────────

/**
 * Bucket free-text values (department names) into slices, ordered by
 * count desc. Drops slices with 0 entries (none should occur here, but
 * guarding against future callers).
 */
function bucketSlices(values: string[]): Slice[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
}

/**
 * Bucket enum values (levels, tenures) in their canonical order. Only
 * include slices with non-zero count so empty buckets disappear (per
 * the alignment).
 */
function bucketByOrder<K extends string>(
  values: Array<K | null>,
  order: readonly K[],
  label: (k: K) => string,
): Slice[] {
  const counts = new Map<K | 'Unknown', number>()
  for (const v of values) {
    const key = (v ?? 'Unknown') as K | 'Unknown'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const slices: Slice[] = []
  for (const k of order) {
    const c = counts.get(k) ?? 0
    if (c > 0) slices.push({ name: label(k), value: c })
  }
  const unknown = counts.get('Unknown') ?? 0
  if (unknown > 0) slices.push({ name: 'Unknown', value: unknown })
  return slices
}
