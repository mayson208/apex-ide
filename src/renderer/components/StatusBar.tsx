import React, { useState, useEffect } from 'react'
import { useSessionStore } from '../store/sessionStore'
import { useProjectStore } from '../store/projectStore'
import { useAppStore } from '../store/appStore'

function useTime() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

export function StatusBar(): React.ReactElement {
  const { claudeProcesses } = useSessionStore()
  const { fsEvents } = useProjectStore()
  const { activeView, selectedProjectPath } = useAppStore()
  const time = useTime()
  const activeCount = claudeProcesses.length
  const lastEvent = fsEvents[0]

  const getBreadcrumb = () => {
    const parts = ['APEX']
    if (activeView !== 'dashboard') {
      parts.push(activeView.charAt(0).toUpperCase() + activeView.slice(1))
    }
    if (selectedProjectPath && activeView === 'project') {
      const name = selectedProjectPath.split(/[/\\]/).pop()
      if (name) parts.push(name)
    }
    return parts.join(' / ')
  }

  return (
    <div
      className="flex items-center justify-between px-3"
      style={{
        height: '22px',
        minHeight: '22px',
        background: 'var(--apex-bg-void)',
        borderTop: '1px solid var(--apex-border-subtle)',
        fontSize: '11px',
        color: 'var(--apex-text-muted)',
      }}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--apex-text-secondary)' }}>{getBreadcrumb()}</span>
        {lastEvent && (
          <span style={{ color: 'var(--apex-text-disabled)' }}>
            · {lastEvent.event} {lastEvent.path.split(/[/\\]/).pop()}
          </span>
        )}
      </div>

      {/* Center: session count */}
      <div className="flex items-center gap-2">
        {activeCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full apex-dot-pulse" style={{ background: '#10b981' }} />
            <span style={{ color: '#10b981' }}>{activeCount} Claude session{activeCount !== 1 ? 's' : ''} active</span>
          </div>
        ) : (
          <span style={{ color: 'var(--apex-text-disabled)' }}>No active sessions</span>
        )}
      </div>

      {/* Right: git / time */}
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--apex-text-disabled)' }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
