// Minimal frame for the respondent flow. No admin chrome — respondents
// shouldn't see anything that hints at an admin product.

export default function TakeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-2xl px-6 py-12">{children}</div>
    </div>
  )
}
