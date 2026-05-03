import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        // Spec 12 § 2 — Georgia is reserved for moments of weight: hero
        // scores, statement text on question screens, report headlines.
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      colors: {
        // Visual design tokens live in product-spec/12_design_language.md.
        // These are bootstrap defaults; refine when the design language is locked.
        ink: {
          DEFAULT: '#0F172A',
          muted: '#475569',
          subtle: '#94A3B8',
        },
        canvas: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          border: '#E2E8F0',
        },
        accent: {
          DEFAULT: '#0EA5E9',
        },
        band: {
          critical: '#DC2626',
          needs: '#F59E0B',
          solid: '#10B981',
          strong: '#0EA5E9',
        },
        // ── Brand palette (spec 12 § 1) ────────────────────────────────
        // The report uses these spec-aligned tokens. Existing admin pages
        // continue to use the ink / canvas / band tokens above; they are
        // kept distinct so this addition doesn't restyle anything that
        // already works.
        brand: {
          'dark-blue': '#0B2545',
          'dark-blue-soft': '#13315C',
          'grey-text': '#5A6572',
          'grey-light': '#E8EBEE',
          'grey-soft-bg': '#F4F6F8',
          ochre: '#D4A24C',
          'ochre-soft': '#E9C98A',
        },
        // Report band colors per spec 03 § 5 + spec 12 § 1. "Solid" uses
        // the same ochre as the brand accent (intentional, per spec 12 § 1).
        'report-band': {
          critical: '#C0392B', // Critical Gap
          needs: '#E67E22',    // Needs Work
          solid: '#D4A24C',    // Solid (== brand.ochre)
          strong: '#27AE60',   // Strong
        },
      },
    },
  },
  plugins: [],
}

export default config
