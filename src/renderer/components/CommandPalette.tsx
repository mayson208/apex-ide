import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, LayoutDashboard, FolderOpen, Terminal, Zap, CheckSquare, Settings } from 'lucide-react'
import { useAppStore, type ActiveView } from '../store/appStore'
import { useProjectStore } from '../store/projectStore'
import { useTodoStore } from '../store/todoStore'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: string
}

function highlight(text: string, query: string): React.ReactElement {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(99,102,241,0.35)', color: 'var(--apex-accent-primary)', borderRadius: 2 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

interface Props { onClose: () => void }

export function CommandPalette({ onClose }: Props): React.ReactElement {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const { setActiveView, setSelectedProject } = useAppStore()
  const { projects } = useProjectStore()
  const { todos } = useTodoStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const commands: Command[] = useMemo(() => {
    const base: Command[] = [
      { id: 'nav-dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => { setActiveView('dashboard'); onClose() }, category: 'Navigation' },
      { id: 'nav-projects', label: 'Go to Projects', icon: FolderOpen, action: () => { setActiveView('project'); onClose() }, category: 'Navigation' },
      { id: 'nav-terminal', label: 'Open Terminal', icon: Terminal, action: () => { setActiveView('terminal'); onClose() }, category: 'Navigation' },
      { id: 'nav-skills', label: 'Skills Manager', icon: Zap, action: () => { setActiveView('skills'); onClose() }, category: 'Navigation' },
      { id: 'nav-todos', label: 'Todo Board', icon: CheckSquare, action: () => { setActiveView('todos'); onClose() }, category: 'Navigation' },
      { id: 'nav-settings', label: 'Settings', icon: Settings, action: () => { setActiveView('settings'); onClose() }, category: 'Navigation' },
    ]

    // Project commands
    projects.slice(0, 10).forEach((p) => {
      base.push({
        id: `proj-${p.path}`,
        label: `Open ${p.name}`,
        description: p.path,
        icon: FolderOpen,
        action: () => { setSelectedProject(p.path); onClose() },
        category: 'Projects',
      })
    })

    // Todo commands
    todos.filter(t => t.status !== 'done').slice(0, 5).forEach((t) => {
      base.push({
        id: `todo-${t.id}`,
        label: t.title,
        description: `${t.status} · ${t.priority}`,
        icon: CheckSquare,
        action: () => { setActiveView('todos'); onClose() },
        category: 'Todos',
      })
    })

    return base
  }, [projects, todos, setActiveView, setSelectedProject, onClose])

  const filtered = useMemo(() => {
    if (!query) return commands
    const q = query.toLowerCase()
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    )
  }, [commands, query])

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[selectedIdx]) { filtered[selectedIdx].action() }
    if (e.key === 'Escape') onClose()
  }

  const categories = Array.from(new Set(filtered.map((c) => c.category)))

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(8,8,16,0.7)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed z-50 left-1/2 -translate-x-1/2"
        style={{ top: '15vh', width: '580px' }}
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      >
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'var(--apex-bg-elevated)',
            border: '1px solid var(--apex-border-default)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--apex-border-subtle)' }}>
            <Search size={16} color="var(--apex-text-muted)" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands, projects, todos..."
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: '14px', color: 'var(--apex-text-primary)' }}
            />
            <span style={{ fontSize: '10px', color: 'var(--apex-text-muted)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--apex-border-default)' }}>
              ESC
            </span>
          </div>

          {/* Results */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-10" style={{ color: 'var(--apex-text-muted)', fontSize: '13px' }}>
                No results for "{query}"
              </div>
            ) : (
              categories.map((cat) => {
                const items = filtered.filter((c) => c.category === cat)
                let runningIdx = filtered.findIndex((c) => c.category === cat)
                return (
                  <div key={cat}>
                    <div className="px-4 py-2" style={{ fontSize: '10px', color: 'var(--apex-text-disabled)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {cat}
                    </div>
                    {items.map((cmd) => {
                      const idx = runningIdx++
                      const Icon = cmd.icon
                      const isSelected = idx === selectedIdx
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                          style={{
                            background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isSelected ? 'var(--apex-text-primary)' : 'var(--apex-text-secondary)',
                          }}
                        >
                          <div
                            className="flex items-center justify-center rounded-lg shrink-0"
                            style={{ width: 28, height: 28, background: isSelected ? 'rgba(99,102,241,0.2)' : 'var(--apex-bg-surface)' }}
                          >
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div style={{ fontSize: '13px' }}>{highlight(cmd.label, query)}</div>
                            {cmd.description && (
                              <div style={{ fontSize: '11px', color: 'var(--apex-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {cmd.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <span style={{ fontSize: '10px', color: 'var(--apex-text-muted)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--apex-border-default)' }}>
                              ↵
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          <div className="px-4 py-2.5 flex items-center gap-4" style={{ borderTop: '1px solid var(--apex-border-subtle)' }}>
            {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close'], ['⌘⇧P', 'Open']].map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-muted)', fontFamily: 'var(--apex-font-mono)' }}>
                  {k}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--apex-text-disabled)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}
