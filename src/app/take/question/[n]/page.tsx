import { notFound } from 'next/navigation'
import { questionAtPosition, TOTAL_QUESTIONS } from '@/data/questions'
import { CAPABILITY_LABELS, PILLAR_LABELS } from '@/data/constants'
import { QuestionCard } from './question-card'

export const metadata = { title: 'Question — The Endurance Assessment' }

interface QuestionPageProps {
  params: Promise<{ n: string }>
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { n: nStr } = await params
  const n = Number(nStr)
  const question = questionAtPosition(n)
  if (!question) notFound()

  const eyebrow = `${PILLAR_LABELS[question.pillar].toUpperCase()} · ${CAPABILITY_LABELS[
    question.capability
  ].toUpperCase()}`

  return (
    <QuestionCard
      position={n}
      total={TOTAL_QUESTIONS}
      eyebrow={eyebrow}
      questionId={question.id}
      questionText={question.text}
    />
  )
}
