/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#111827',
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-inset': 'var(--surface-inset)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        semantic: {
          done: 'var(--semantic-green)',
          overdue: 'var(--semantic-red)',
        },
        action: {
          DEFAULT: 'var(--action)',
          dim: 'var(--action-dim)',
        },
        growth: {
          DEFAULT: 'var(--growth)',
          dim: 'var(--growth-dim)',
        },
        capital: {
          DEFAULT: 'var(--capital)',
          dim: 'var(--capital-dim)',
        },
        knowledge: {
          DEFAULT: 'var(--knowledge)',
          dim: 'var(--knowledge-dim)',
        },
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        tile: '10px',
        chip: '6px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-hover)',
      },
    },
  },
  plugins: [],
}
