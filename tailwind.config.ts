import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
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
      },
    },
  },
  plugins: [],
}

export default config
