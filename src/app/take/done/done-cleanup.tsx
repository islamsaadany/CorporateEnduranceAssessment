'use client'

import { useEffect } from 'react'

/**
 * Clears any tea_respondent_<CODE> entries from localStorage on the
 * /take/done screen. Belt-and-suspenders: also runs every time this
 * component mounts (e.g., user navigates back to /take/done).
 */
export function DoneCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key && key.startsWith('tea_respondent_')) keysToRemove.push(key)
      }
      for (const key of keysToRemove) window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }, [])
  return null
}
