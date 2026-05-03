// Filter parsing, signature serialization, and Prisma where-fragment.
//
// Source-of-truth rules: product-spec/06_report_filters_and_segments.md.
// One module owns all three concerns so the URL form, the cache key,
// and the PDF filename suffix can never drift apart.

import type { Prisma } from '@prisma/client'
import { Level, TenureBand } from '@prisma/client'

import {
  LEVELS,
  LEVEL_LABELS,
  TENURE_BANDS,
  TENURE_LABELS,
} from '@/data/constants'
import type { ParsedFilter } from '@/data/types'

const VALID_LEVELS = new Set<Level>(LEVELS)
const VALID_TENURES = new Set<TenureBand>(TENURE_BANDS)

// Lenient URL parse — invalid level/tenure values are silently dropped per
// product-spec/06 § 9 ("if URL is hand-crafted with an invalid level, treat
// as no filter on that dimension"). Department names pass through verbatim;
// the DB query simply returns 0 rows for unknown departments, which the
// caller renders as "0 respondents match".
//
// `prefix` controls the URL parameter names. With `prefix=""` (default),
// reads `dept`, `level`, `tenure`. With `prefix="a"`, reads `aDept`,
// `aLevel`, `aTenure` — used by the comparison view (slice 6.4) where two
// filters share a single URL.
export function parseFilterFromSearchParams(sp: URLSearchParams, prefix = ''): ParsedFilter {
  return {
    departments: splitMulti(sp.get(prefixedKey(prefix, 'dept'))),
    levels: splitMulti(sp.get(prefixedKey(prefix, 'level'))).filter((v): v is Level =>
      VALID_LEVELS.has(v as Level),
    ),
    tenures: splitMulti(sp.get(prefixedKey(prefix, 'tenure'))).filter((v): v is TenureBand =>
      VALID_TENURES.has(v as TenureBand),
    ),
  }
}

function prefixedKey(prefix: string, base: 'dept' | 'level' | 'tenure'): string {
  if (!prefix) return base
  return prefix + base.charAt(0).toUpperCase() + base.slice(1)
}

function splitMulti(raw: string | null): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(',')) {
    const v = part.trim()
    if (!v || seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

// The canonical, deterministic, human-readable signature used as
// (a) the URL query string, (b) the cache key in `generated_reports`,
// and (c) the PDF filename suffix. Same string in all three places.
//
// Construction (per product-spec/06 § 2.1):
//   - keys appear in fixed order: dept, level, tenure
//   - values within a dimension are sorted alphabetically
//   - dimensions with no values are omitted
//   - empty filter → the literal string "company_wide"
//
// Department names are URL-encoded for safety (they can contain `&`, `=`, etc).
export function filterSignature(f: ParsedFilter): string {
  const parts: string[] = []
  if (f.departments.length > 0) {
    const sorted = [...f.departments].sort()
    parts.push(`dept=${sorted.map(encodeURIComponent).join(',')}`)
  }
  if (f.levels.length > 0) {
    const sorted = [...f.levels].sort()
    parts.push(`level=${sorted.join(',')}`)
  }
  if (f.tenures.length > 0) {
    const sorted = [...f.tenures].sort()
    parts.push(`tenure=${sorted.join(',')}`)
  }
  return parts.length === 0 ? 'company_wide' : parts.join('&')
}

export function isCompanyWide(f: ParsedFilter): boolean {
  return (
    f.departments.length === 0 &&
    f.levels.length === 0 &&
    f.tenures.length === 0
  )
}

// URL query string for navigation: same canonical form as filterSignature
// for non-empty filters, empty string for company-wide. The bare URL
// (no `?`) is the canonical form for company-wide so links don't carry a
// stray `?company_wide` suffix.
//
// `prefix` produces compare-style keys (`aDept`, `aLevel`, `aTenure`) for
// use on the comparison view; the empty default produces single-filter
// keys (`dept`, `level`, `tenure`).
export function filterToQueryString(f: ParsedFilter, prefix = ''): string {
  if (isCompanyWide(f)) return ''
  const parts: string[] = []
  if (f.departments.length > 0) {
    const sorted = [...f.departments].sort()
    parts.push(`${prefixedKey(prefix, 'dept')}=${sorted.map(encodeURIComponent).join(',')}`)
  }
  if (f.levels.length > 0) {
    const sorted = [...f.levels].sort()
    parts.push(`${prefixedKey(prefix, 'level')}=${sorted.join(',')}`)
  }
  if (f.tenures.length > 0) {
    const sorted = [...f.tenures].sort()
    parts.push(`${prefixedKey(prefix, 'tenure')}=${sorted.join(',')}`)
  }
  return parts.join('&')
}

// Human-readable phrase used in the report's filter banner and as a hint
// in the AI prompt's filter_description field. Shape matches the examples
// in product-spec/06 § 7.
export function filterDescription(f: ParsedFilter): string {
  if (isCompanyWide(f)) {
    return 'Company-wide (all departments, all levels, all tenures)'
  }
  const segments: string[] = []
  if (f.departments.length > 0) {
    const word = f.departments.length === 1 ? 'department' : 'departments'
    segments.push(`${humanList(f.departments)} ${word}`)
  } else {
    segments.push('all departments')
  }
  if (f.levels.length > 0) {
    const labels = f.levels.map((l) => LEVEL_LABELS[l])
    const word = f.levels.length === 1 ? 'level' : 'levels'
    segments.push(`${humanList(labels)} ${word}`)
  } else {
    segments.push('all levels')
  }
  if (f.tenures.length > 0) {
    const labels = f.tenures.map((t) => TENURE_LABELS[t])
    segments.push(`${humanList(labels)} tenure`)
  } else {
    segments.push('all tenures')
  }
  return segments.join(', ')
}

function humanList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} or ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`
}

// Prisma where-fragment to narrow `Respondent` rows to the filter. The
// caller is expected to AND this with their own scoping (assessmentId,
// demographicsCompletedAt, submittedAt, etc).
export function prismaWhereForFilter(
  f: ParsedFilter,
): Prisma.RespondentWhereInput {
  const where: Prisma.RespondentWhereInput = {}
  if (f.departments.length > 0) {
    where.department = { name: { in: f.departments } }
  }
  if (f.levels.length > 0) {
    where.level = { in: f.levels }
  }
  if (f.tenures.length > 0) {
    where.tenure = { in: f.tenures }
  }
  return where
}
