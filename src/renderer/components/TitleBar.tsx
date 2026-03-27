import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useSessionStore } from '../store/sessionStore'

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  project: 'Project',
  terminal: 'Terminal',
  skills: 'Skills Manager',
  todos: 'Todo Board',
  settings: 'Settings',
}

export function TitleBar(): React.ReactElement {
  const { activeView } = useAppStore()
  const { claudeProcesses } = useSessionStore()
  const [isMaximized, setIsMaximized] = useState(false)
  const activeSessions = claudeProcesses.length

  useEffect(() => {
    window.apex.window.isMaximized().then(setIsMaximized)
  }, [])

  return (
    <div
      className="flex items-center justify-between h-9 px-3 select-none"
      style={{
        background: 'var(--apex-bg-void)',
        borderBottom: '1px solid var(--apex-border-subtle)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Left: Logo + title */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Traffic light buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.apex.window.close()}
            className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
            style={{ background: '#ff5f57' }}
            title="Close"
          />
          <button
            onClick={() => window.apex.window.minimize()}
            className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
            style={{ background: '#febc2e' }}
            title="Minimize"
          />
          <button
            onClick={() => {
              window.apex.window.maximize()
              setIsMaximized(!isMaximized)
            }}
            className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
            style={{ background: '#28c840' }}
            title="Maximize"
          />
        </div>
      </div>

      {/* Center: App name + view */}
      <div className="flex items-center gap-2">
        {/* APEX logo */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="apexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <polygon points="12,2 22,20 2,20" fill="none" stroke="url(#apexGrad)" strokeWidth="2" strokeLinejoin="round" />
          <line x1="7" y1="14" x2="17" y2="14" stroke="url(#apexGrad)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: '12px', color: 'var(--apex-text-secondary)', letterSpacing: '0.05em' }}>
          APEX
          <span style={{ color: 'var(--apex-border-strong)', margin: '0 6px' }}>—</span>
          <span style={{ color: 'var(--apex-text-muted)' }}>{VIEW_LABELS[activeView] || activeView}</span>
        </span>
        {activeSessions > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="w-1.5 h-1.5 rounded-full apex-dot-pulse" style={{ background: '#10b981' }} />
            <span style={{ fontSize: '10px', color: '#10b981' }}>{activeSessions} active</span>
          </div>
        )}
      </div>

      {/* Right: Empty drag area */}
      <div className="w-20" />
    </div>
  )
}
