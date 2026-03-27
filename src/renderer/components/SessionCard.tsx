import React from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Clock, Terminal } from 'lucide-react'
import type { ApexSession } from '../store/sessionStore'
import { useAppStore } from '../store/appStore'

interface Props {
  session: ApexSession
  isLive?: boolean
}

export function SessionCard({ session, isLive }: Props): React.ReactElement {
  const { setSelectedProject } = useAppStore()

  const duration = session.duration
    ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s`
    : isLive
    ? 'Live'
    : 'Unknown'

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -1 }}
      className="rounded-xl p-3 cursor-pointer"
      style={{
        background: isLive ? 'rgba(16,185,129,0.07)' : 'var(--apex-bg-surface)',
        border: `1px solid ${isLive ? 'rgba(16,185,129,0.3)' : 'var(--apex-border-subtle)'}`,
        boxShadow: isLive ? '0 0 12px rgba(16,185,129,0.1)' : 'none',
      }}
      onClick={() => setSelectedProject(session.projectPath)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="w-2 h-2 rounded-full apex-dot-pulse" style={{ background: '#10b981', minWidth: 8 }} />
          )}
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-text-primary)' }}>
            {session.projectName}
          </span>
        </div>
        {isLive && (
          <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>
            LIVE
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {session.gitBranch && (
          <div className="flex items-center gap-1">
            <GitBranch size={10} color="var(--apex-text-muted)" />
            <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', fontFamily: 'var(--apex-font-mono)' }}>
              {session.gitBranch}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock size={10} color="var(--apex-text-muted)" />
          <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)' }}>{duration}</span>
        </div>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--apex-text-disabled)', marginTop: 4, fontFamily: 'var(--apex-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {session.projectPath}
      </div>
    </motion.div>
  )
}

export function SessionCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-xl p-3" style={{ border: '1px solid var(--apex-border-subtle)' }}>
      <div className="apex-skeleton rounded mb-2" style={{ height: 16, width: '60%' }} />
      <div className="apex-skeleton rounded mb-1" style={{ height: 12, width: '40%' }} />
      <div className="apex-skeleton rounded" style={{ height: 10, width: '80%' }} />
    </div>
  )
}

interface SessionsListProps {
  title?: string
}

export function SessionsList({ title }: SessionsListProps): React.ReactElement {
  const { setActiveView } = useAppStore()

  return (
    <div className="flex flex-col gap-1">
      {title && (
        <div className="flex items-center gap-2 px-2 mb-1">
          <Terminal size={11} color="var(--apex-text-muted)" />
          <span style={{ fontSize: '10px', color: 'var(--apex-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {title}
          </span>
        </div>
      )}
      <button
        onClick={() => setActiveView('terminal')}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-opacity-100 transition-colors text-left"
        style={{ background: 'rgba(99,102,241,0.1)', border: 'none', cursor: 'pointer', color: 'var(--apex-accent-primary)', fontSize: '12px' }}
      >
        <Terminal size={12} />
        Open Terminal
      </button>
    </div>
  )
}
