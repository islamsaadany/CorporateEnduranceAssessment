// GET /api/assessments/[id]/results
//
// Returns the fully-aggregated numerical report for the assessment under
// the active filter (read from the URL query string per product-spec/06).
// NextAuth-gated. Math + DB access live in src/lib/results-service.ts.

import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { parseFilterFromSearchParams } from '@/lib/filters'
import { loadResults } from '@/lib/results-service'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const url = new URL(req.url)
  const filter = parseFilterFromSearchParams(url.searchParams)

  const bundle = await loadResults(id, filter)
  if (!bundle) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Dates → ISO strings for over-the-wire consumption.
  return NextResponse.json({
    ...bundle,
    assessment: {
      ...bundle.assessment,
      deadline: bundle.assessment.deadline.toISOString(),
      closedAt: bundle.assessment.closedAt?.toISOString() ?? null,
    },
  })
}
