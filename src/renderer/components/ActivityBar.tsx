import React from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, FolderOpen, Terminal, Zap, CheckSquare, Settings } from 'lucide-react'
import { useAppStore, type ActiveView } from '../store/appStore'
import { useSessionStore } from '../store/sessionStore'

interface NavItem {
  id: ActiveView
  icon: React.ElementType
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'project', icon: FolderOpen, label: 'Projects' },
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'skills', icon: Zap, label: 'Skills' },
  { id: 'todos', icon: CheckSquare, label: 'Todos' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

export function ActivityBar(): React.ReactElement {
  const { activeView, setActiveView } = useAppStore()
  const { claudeProcesses } = useSessionStore()

  return (
    <div
      className="flex flex-col items-center py-2"
      style={{
        width: '52px',
        minWidth: '52px',
        background: 'var(--apex-bg-void)',
        borderRight: '1px solid var(--apex-border-subtle)',
        gap: '2px',
      }}
    >
      {/* Logo */}
      <div className="mb-4 mt-1 flex items-center justify-center" style={{ width: 40, height: 40 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="actBarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <polygon points="12,2 22,20 2,20" fill="none" stroke="url(#actBarGrad)" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="7.5" y1="14.5" x2="16.5" y2="14.5" stroke="url(#actBarGrad)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 w-full px-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <div key={item.id} className="relative group">
              <motion.button
                onClick={() => setActiveView(item.id)}
                className="flex items-center justify-center rounded-lg transition-colors relative"
                style={{
                  width: '100%',
                  height: 40,
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: isActive ? 'var(--apex-accent-primary)' : 'var(--apex-text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  borderLeft: isActive ? '2px solid var(--apex-accent-primary)' : '2px solid transparent',
                }}
                whileHover={{ scale: 1.05, color: 'var(--apex-text-primary)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={18} />
              </motion.button>

              {/* Tooltip */}
              <div
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{
                  background: 'var(--apex-bg-overlay)',
                  border: '1px solid var(--apex-border-default)',
                  fontSize: '11px',
                  color: 'var(--apex-text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom: Active sessions indicator */}
      {claudeProcesses.length > 0 && (
        <div className="mt-auto mb-2 flex flex-col items-center gap-1">
          <div
            className="flex items-center justify-center rounded-full apex-active-pulse"
            style={{
              width: 32,
              height: 32,
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.4)',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
              {claudeProcesses.length}
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#10b981', letterSpacing: '0.03em' }}>
            active
          </span>
        </div>
      )}
    </div>
  )
}
