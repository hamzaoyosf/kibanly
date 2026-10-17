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
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
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
        card: '24px',
        tile: '20px',
        chip: '14px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'glow-action': 'var(--inner-glow-action)',
        'glow-growth': 'var(--inner-glow-growth)',
        'glow-capital': 'var(--inner-glow-capital)',
        'glow-knowledge': 'var(--inner-glow-knowledge)',
      },
    },
  },
  plugins: [],
}
