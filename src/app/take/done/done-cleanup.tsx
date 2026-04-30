'use client'

import { useEffect } from 'react'
import { clearAllRespondentIds } from '@/lib/take-storage'

/**
 * Clears any tea_respondent_* entries from localStorage on the
 * /take/done screen. Belt-and-suspenders: also runs every time this
 * component mounts (e.g., user navigates back to /take/done).
 */
export function DoneCleanup() {
  useEffect(() => {
    clearAllRespondentIds()
  }, [])
  return null
}
