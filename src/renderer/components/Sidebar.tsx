import React from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '../store/sessionStore'
import { useProjectStore } from '../store/projectStore'
import { useAppStore } from '../store/appStore'
import { ActiveIndicator } from './ActiveIndicator'
import { Terminal, FolderOpen } from 'lucide-react'

export function Sidebar(): React.ReactElement {
  const { claudeProcesses } = useSessionStore()
  const { projects } = useProjectStore()
  const { setActiveView, setSelectedProject } = useAppStore()

  const activeProjects = claudeProcesses.map((p) => {
    const proc = p as { cwd: string }
    const name = proc.cwd?.split(/[/\\]/).pop() || 'Unknown'
    return { name, cwd: proc.cwd }
  })

  return (
    <div
      className="flex flex-col gap-3 py-4 px-3"
      style={{ width: '220px', minWidth: '220px', background: 'var(--apex-bg-void)', borderRight: '1px solid var(--apex-border-subtle)' }}
    >
      {activeProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <ActiveIndicator active size={7} />
            <span style={{ fontSize: '10px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Active Sessions
            </span>
          </div>
          {activeProjects.map((p) => (
            <motion.button
              key={p.cwd}
              whileHover={{ scale: 1.01 }}
              onClick={() => { setSelectedProject(p.cwd); setActiveView('project') }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-1"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' }}
            >
              <div className="w-1.5 h-1.5 rounded-full apex-dot-pulse" style={{ background: '#10b981', minWidth: 6 }} />
              <span style={{ fontSize: '12px', color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Recent projects */}
      <div>
        <div className="px-1 mb-2" style={{ fontSize: '10px', color: 'var(--apex-text-disabled)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Recent Projects
        </div>
        {projects.slice(0, 6).map((p) => (
          <button
            key={p.path}
            onClick={() => { setSelectedProject(p.path); setActiveView('project') }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 hover:bg-white/5 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)', fontSize: '12px' }}
          >
            <FolderOpen size={12} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <button
          onClick={() => setActiveView('terminal')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--apex-accent-primary)', cursor: 'pointer', fontSize: '12px' }}
        >
          <Terminal size={13} />
          New Terminal
        </button>
      </div>
    </div>
  )
}
