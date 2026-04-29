import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Endurance Assessment',
  description: 'A team diagnostic measuring organizational endurance across Agility, Toughness, and Resilience.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
