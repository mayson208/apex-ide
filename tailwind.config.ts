import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        apex: {
          'bg-void':        '#080810',
          'bg-base':        '#0d0d1a',
          'bg-surface':     '#12121f',
          'bg-elevated':    '#1a1a2e',
          'bg-overlay':     '#20203a',
          'border-subtle':  '#1e1e3a',
          'border-default': '#2a2a4a',
          'border-strong':  '#3d3d6b',
          'accent-primary': '#6366f1',
          'accent-violet':  '#8b5cf6',
          'accent-cyan':    '#06b6d4',
          'accent-emerald': '#10b981',
          'accent-amber':   '#f59e0b',
          'accent-rose':    '#f43f5e',
          'text-primary':   '#f1f5f9',
          'text-secondary': '#94a3b8',
          'text-muted':     '#475569',
          'text-disabled':  '#334155',
        },
      },
      fontFamily: {
        ui:   ['Geist', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'apex-xs':   ['11px', { lineHeight: '1.4' }],
        'apex-sm':   ['12px', { lineHeight: '1.5' }],
        'apex-base': ['13px', { lineHeight: '1.5' }],
        'apex-md':   ['14px', { lineHeight: '1.5' }],
        'apex-lg':   ['16px', { lineHeight: '1.4' }],
        'apex-xl':   ['20px', { lineHeight: '1.3' }],
        'apex-2xl':  ['24px', { lineHeight: '1.2' }],
      },
      animation: {
        'pulse-slow':  'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast':  'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in':    'slideIn 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in':     'fadeIn 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'apex-snap':   'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apex-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'apex-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
