import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Copy, Trash2, Search, Maximize2, Minimize2, Terminal as TerminalIcon, GitBranch, ChevronRight } from 'lucide-react'

// Lazy-load xterm to avoid issues at module init
let Terminal: typeof import('@xterm/xterm').Terminal
let FitAddon: typeof import('@xterm/addon-fit').FitAddon
let WebLinksAddon: typeof import('@xterm/addon-web-links').WebLinksAddon

const apexTheme = {
  background: '#080810',
  foreground: '#e2e8f0',
  cursor: '#6366f1',
  cursorAccent: '#080810',
  selection: 'rgba(99, 102, 241, 0.3)',
  black: '#1a1a2e',
  red: '#f43f5e',
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#6366f1',
  magenta: '#8b5cf6',
  cyan: '#06b6d4',
  white: '#e2e8f0',
  brightBlack: '#475569',
  brightRed: '#fb7185',
  brightGreen: '#34d399',
  brightYellow: '#fbbf24',
  brightBlue: '#818cf8',
  brightMagenta: '#a78bfa',
  brightCyan: '#22d3ee',
  brightWhite: '#f8fafc',
}

interface TermTab {
  id: string
  title: string
  cwd: string
  gitBranch: string | null
  active: boolean
}

function generateId(): string {
  return `term_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

interface TerminalInstanceProps {
  tabId: string
  cwd: string
  visible: boolean
  onCwdChange?: (cwd: string) => void
}

function TerminalInstance({ tabId, cwd, visible }: TerminalInstanceProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<InstanceType<typeof Terminal> | null>(null)
  const fitRef = useRef<InstanceType<typeof FitAddon> | null>(null)
  const cleanupRef = useRef<Array<() => void>>([])
  const initialized = useRef(false)

  const initTerminal = useCallback(async () => {
    if (initialized.current || !containerRef.current) return
    initialized.current = true

    // Dynamic import to avoid SSR/init issues
    const xtermMod = await import('@xterm/xterm')
    const fitMod = await import('@xterm/addon-fit')
    const linksMod = await import('@xterm/addon-web-links')
    Terminal = xtermMod.Terminal
    FitAddon = fitMod.FitAddon
    WebLinksAddon = linksMod.WebLinksAddon

    const term = new Terminal({
      theme: apexTheme,
      fontFamily: 'Geist Mono, JetBrains Mono, Fira Code, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      allowTransparency: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(containerRef.current!)
    fitAddon.fit()

    termRef.current = term
    fitRef.current = fitAddon

    // Create PTY
    const result = await window.apex.pty.create({
      id: tabId,
      cwd: cwd || undefined,
      cols: term.cols,
      rows: term.rows,
    })

    if (!result.success) {
      term.writeln('\r\n\x1b[31mFailed to create terminal: ' + result.error + '\x1b[0m')
      return
    }

    // Stream data from pty
    const unsub = window.apex.pty.onData(tabId, (data) => {
      term.write(data)
    })
    cleanupRef.current.push(unsub)

    // Send input to pty
    term.onData((data) => {
      window.apex.pty.write(tabId, data)
    })

    // Resize pty when terminal resizes
    term.onResize(({ cols, rows }) => {
      window.apex.pty.resize(tabId, cols, rows)
    })

    // Handle pty exit
    const exitUnsub = window.apex.pty.onExit(tabId, () => {
      term.writeln('\r\n\x1b[90m[Process exited]\x1b[0m')
    })
    cleanupRef.current.push(exitUnsub)
  }, [tabId, cwd])

  useEffect(() => {
    initTerminal()

    const handleResize = () => {
      fitRef.current?.fit()
    }
    window.addEventListener('resize', handleResize)
    cleanupRef.current.push(() => window.removeEventListener('resize', handleResize))

    return () => {
      cleanupRef.current.forEach((fn) => fn())
      cleanupRef.current = []
      window.apex.pty.kill(tabId).catch(() => {})
      termRef.current?.dispose()
      termRef.current = null
      initialized.current = false
    }
  }, [initTerminal, tabId])

  useEffect(() => {
    if (visible) {
      setTimeout(() => fitRef.current?.fit(), 50)
    }
  }, [visible])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: visible ? 'block' : 'none',
        padding: '4px',
      }}
    />
  )
}

export function TerminalPane(): React.ReactElement {
  const [tabs, setTabs] = useState<TermTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(13)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const createTab = useCallback((cwd?: string) => {
    const id = generateId()
    const newTab: TermTab = {
      id,
      title: 'Terminal',
      cwd: cwd || '',
      gitBranch: null,
      active: true,
    }
    setTabs((prev) => [...prev.map((t) => ({ ...t, active: false })), newTab])
    setActiveTabId(id)
  }, [])

  useEffect(() => {
    createTab()
  }, [createTab])

  const closeTab = (id: string) => {
    window.apex.pty.kill(id).catch(() => {})
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id)
      if (filtered.length === 0) return filtered
      if (id === activeTabId) {
        const newActive = filtered[filtered.length - 1]
        setActiveTabId(newActive.id)
      }
      return filtered
    })
  }

  const launchClaude = () => {
    const tab = tabs.find((t) => t.id === activeTabId)
    if (!tab) return
    const cmd = tab.cwd ? `cd "${tab.cwd}" && claude\r` : 'claude\r'
    window.apex.pty.write(activeTabId!, cmd)
  }

  const startRenaming = (tab: TermTab) => {
    setEditingTabId(tab.id)
    setEditTitle(tab.title)
  }

  const commitRename = () => {
    if (!editingTabId || !editTitle.trim()) { setEditingTabId(null); return }
    setTabs((prev) => prev.map((t) => t.id === editingTabId ? { ...t, title: editTitle.trim() } : t))
    setEditingTabId(null)
  }

  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col h-full"
      style={{ background: '#080810' }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center"
        style={{ height: '36px', minHeight: '36px', background: 'var(--apex-bg-void)', borderBottom: '1px solid var(--apex-border-subtle)' }}
      >
        <div className="flex items-center flex-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            return (
              <div
                key={tab.id}
                className="flex items-center gap-2 px-3 cursor-pointer shrink-0 group"
                style={{
                  height: '36px',
                  borderRight: '1px solid var(--apex-border-subtle)',
                  background: isActive ? 'var(--apex-bg-surface)' : 'transparent',
                  borderBottom: isActive ? '2px solid var(--apex-accent-primary)' : '2px solid transparent',
                  color: isActive ? 'var(--apex-text-primary)' : 'var(--apex-text-muted)',
                  minWidth: 0,
                  maxWidth: '160px',
                }}
                onClick={() => setActiveTabId(tab.id)}
                onDoubleClick={() => startRenaming(tab)}
              >
                <TerminalIcon size={12} color={isActive ? 'var(--apex-accent-primary)' : undefined} />
                {editingTabId === tab.id ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingTabId(null) }}
                    className="bg-transparent outline-none"
                    style={{ fontSize: '12px', width: '80px', color: 'var(--apex-text-primary)' }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tab.title}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)', padding: 0, display: 'flex' }}
                >
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>

        {/* New tab button */}
        <button
          onClick={() => createTab()}
          className="flex items-center justify-center shrink-0 hover:opacity-100 opacity-60 transition-opacity"
          style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)' }}
        >
          <Plus size={14} />
        </button>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2" style={{ borderLeft: '1px solid var(--apex-border-subtle)' }}>
          {activeTab?.gitBranch && (
            <div className="flex items-center gap-1 px-2 rounded" style={{ color: 'var(--apex-accent-cyan)', fontSize: '11px' }}>
              <GitBranch size={11} />
              <span>{activeTab.gitBranch}</span>
            </div>
          )}

          {[
            { icon: Copy, label: 'Copy', action: () => document.execCommand('copy') },
            { icon: Trash2, label: 'Clear', action: () => window.apex.pty.write(activeTabId || '', process.platform === 'win32' ? 'cls\r' : 'clear\r') },
            { icon: Search, label: 'Search', action: () => {} },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className="flex items-center justify-center rounded hover:bg-white/5 transition-colors"
              style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)' }}
            >
              <Icon size={13} />
            </button>
          ))}

          {/* Font size */}
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              className="flex items-center justify-center rounded hover:bg-white/5 transition-colors"
              style={{ width: 22, height: 22, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)', fontSize: '11px' }}
            >
              A
            </button>
            <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', minWidth: 20, textAlign: 'center' }}>{fontSize}</span>
            <button
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              className="flex items-center justify-center rounded hover:bg-white/5 transition-colors"
              style={{ width: 22, height: 22, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)', fontSize: '14px', fontWeight: 700 }}
            >
              A
            </button>
          </div>

          {/* Launch Claude button */}
          <button
            onClick={launchClaude}
            className="flex items-center gap-1.5 px-3 rounded-lg ml-2 transition-colors"
            style={{ height: 26, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--apex-accent-primary)', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
          >
            <ChevronRight size={11} />
            Launch Claude
          </button>
        </div>
      </div>

      {/* Terminal area */}
      <div className="flex-1 overflow-hidden relative">
        {tabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <TerminalIcon size={40} color="var(--apex-text-disabled)" />
            <div style={{ color: 'var(--apex-text-secondary)', fontSize: '14px' }}>No terminal open</div>
            <button
              onClick={() => createTab()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'var(--apex-accent-primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              <Plus size={14} />
              New Terminal
            </button>
          </div>
        ) : (
          tabs.map((tab) => (
            <div key={tab.id} style={{ width: '100%', height: '100%', display: tab.id === activeTabId ? 'block' : 'none' }}>
              <TerminalInstance
                tabId={tab.id}
                cwd={tab.cwd}
                visible={tab.id === activeTabId}
              />
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}
