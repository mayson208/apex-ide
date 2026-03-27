import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Terminal, Clock, Package, Zap, CheckSquare, FolderOpen, Activity, GitCommit } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useProjectStore, type FsNode } from '../store/projectStore'
import { useSessionStore } from '../store/sessionStore'
import { useTodoStore } from '../store/todoStore'
import { useFS } from '../hooks/useFS'
import { useSessions } from '../hooks/useSessions'
import { useClaudeProcess } from '../hooks/useClaudeProcess'
import { FolderTree } from '../components/FolderTree'
import { MetricsPanel } from '../components/MetricsPanel'
import { ErrorBoundary } from '../components/ErrorBoundary'

// ---------- Stat Card ----------
interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  pulse?: boolean
}

function StatCard({ label, value, icon: Icon, color, pulse }: StatCardProps): React.ReactElement {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)', cursor: 'default' }}
    >
      <div
        className="flex items-center justify-center rounded-lg shrink-0"
        style={{ width: 38, height: 38, background: `${color}18` }}
      >
        <Icon size={18} color={color} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--apex-text-primary)', lineHeight: 1 }}>
            {value}
          </span>
          {pulse && Number(value) > 0 && (
            <div className="w-2 h-2 rounded-full apex-dot-pulse" style={{ background: '#10b981' }} />
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--apex-text-muted)', marginTop: 2 }}>{label}</div>
      </div>
    </motion.div>
  )
}

// ---------- Project Card ----------
interface ProjectCardProps {
  node: FsNode
  index: number
  activePaths: string[]
}

function ProjectCard({ node, index, activePaths }: ProjectCardProps): React.ReactElement {
  const [gitStatus, setGitStatus] = useState<{ branch?: string; lastCommit?: { message: string } | null } | null>(null)
  const { setSelectedProject } = useAppStore()
  const isActive = activePaths.some((p) => p === node.path || p.startsWith(node.path))

  useEffect(() => {
    if (node.hasGit) {
      window.apex.git.status(node.path).then((s) => {
        setGitStatus(s as { branch?: string; lastCommit?: { message: string } | null } | null)
      }).catch(() => {})
    }
  }, [node.path, node.hasGit])

  const detectLanguages = (): string[] => {
    const langs: string[] = []
    const children = node.children || []
    const files = children.map((c) => c.name.toLowerCase())
    if (files.some((f) => f.endsWith('.ts') || f.endsWith('.tsx'))) langs.push('TypeScript')
    if (files.some((f) => f.endsWith('.py'))) langs.push('Python')
    if (files.some((f) => f.endsWith('.java'))) langs.push('Java')
    if (files.some((f) => f.endsWith('.js') || f.endsWith('.jsx'))) langs.push('JavaScript')
    if (files.some((f) => f.endsWith('.go'))) langs.push('Go')
    if (files.some((f) => f.endsWith('.rs'))) langs.push('Rust')
    if (node.hasPackageJson) { if (!langs.includes('JavaScript') && !langs.includes('TypeScript')) langs.push('Node.js') }
    return langs.slice(0, 3)
  }

  const languages = detectLanguages()
  const LANG_COLORS: Record<string, string> = {
    TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219',
    JavaScript: '#f1e05a', Go: '#00ADD8', Rust: '#dea584', 'Node.js': '#68a063',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22 }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={() => setSelectedProject(node.path)}
      className="rounded-xl p-4 cursor-pointer group relative overflow-hidden"
      style={{
        background: 'var(--apex-bg-surface)',
        border: `1px solid ${isActive ? 'rgba(16,185,129,0.35)' : 'var(--apex-border-subtle)'}`,
        boxShadow: isActive ? '0 0 16px rgba(16,185,129,0.1)' : 'none',
      }}
    >
      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="w-1.5 h-1.5 rounded-full apex-dot-pulse" style={{ background: '#10b981' }} />
          <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE</span>
        </div>
      )}

      <div className="mb-2 pr-16">
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--apex-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--apex-text-disabled)', fontFamily: 'var(--apex-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.path}
        </div>
      </div>

      {gitStatus && (
        <div className="flex items-center gap-2 mb-2">
          {gitStatus.branch && (
            <div className="flex items-center gap-1">
              <GitBranch size={10} color="var(--apex-accent-cyan)" />
              <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', fontFamily: 'var(--apex-font-mono)' }}>
                {gitStatus.branch}
              </span>
            </div>
          )}
          {gitStatus.lastCommit?.message && (
            <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {gitStatus.lastCommit.message.slice(0, 40)}
            </span>
          )}
        </div>
      )}

      {/* Language badges */}
      {languages.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {languages.map((lang) => (
            <span
              key={lang}
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ fontSize: '10px', background: `${LANG_COLORS[lang] || '#6366f1'}22`, color: LANG_COLORS[lang] || '#6366f1', border: `1px solid ${LANG_COLORS[lang] || '#6366f1'}33` }}
            >
              {lang}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <Clock size={10} color="var(--apex-text-disabled)" />
          <span style={{ fontSize: '10px', color: 'var(--apex-text-disabled)' }}>
            {new Date(node.lastModified).toLocaleDateString()}
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); useAppStore.getState().setActiveView('terminal') }}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
          style={{ fontSize: '10px', background: 'rgba(99,102,241,0.15)', color: 'var(--apex-accent-primary)', border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer' }}
        >
          <Terminal size={10} />
          Terminal
        </button>
      </div>
    </motion.div>
  )
}

// ---------- Dashboard ----------
export function Dashboard(): React.ReactElement {
  const { setActiveView } = useAppStore()
  const { fsTree, loading, fsLoading } = useProjectStore()
  const { claudeProcesses, sessions } = useSessionStore()
  const { todos } = useTodoStore()
  const { scanHome } = useFS()
  useSessions()

  const { allProcesses } = useClaudeProcess()
  const activePaths = useMemo(
    () => allProcesses.map((p) => (p as { cwd: string }).cwd).filter(Boolean),
    [allProcesses]
  )

  useEffect(() => {
    scanHome(3)
    // Start watching home dir
    window.apex.fs.watch('').catch(() => {})
  }, [scanHome])

  // Extract projects from fs tree
  const projects = useMemo(() => {
    const result: FsNode[] = []
    const scan = (nodes: FsNode[]) => {
      for (const n of nodes) {
        if (n.type === 'directory' && (n.hasGit || n.hasPackageJson)) {
          result.push(n)
        } else if (n.type === 'directory' && n.children) {
          scan(n.children)
        }
      }
    }
    scan(fsTree)
    return result.sort((a, b) => b.lastModified - a.lastModified).slice(0, 12)
  }, [fsTree])

  const pendingTodos = todos.filter((t) => t.status !== 'done').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="flex h-full overflow-hidden"
      style={{ background: 'var(--apex-bg-base)' }}
    >
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats bar */}
        <div className="grid grid-cols-6 gap-3 p-4 pb-0" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          <StatCard label="Active Sessions" value={claudeProcesses.length} icon={Activity} color="#10b981" pulse />
          <StatCard label="Projects" value={projects.length} icon={FolderOpen} color="#6366f1" />
          <StatCard label="Files Watched" value={fsTree.reduce((a, n) => a + (n.children?.length || 0), 0)} icon={Package} color="#06b6d4" />
          <StatCard label="Git Repos" value={projects.filter((p) => p.hasGit).length} icon={GitCommit} color="#8b5cf6" />
          <StatCard label="Skills" value={0} icon={Zap} color="#f59e0b" />
          <StatCard label="Todos Pending" value={pendingTodos} icon={CheckSquare} color="#f43f5e" />
        </div>

        {/* Projects section */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-text-secondary)', letterSpacing: '0.04em' }}>
                RECENT PROJECTS
              </h2>
              <button
                onClick={() => setActiveView('project')}
                style={{ fontSize: '11px', color: 'var(--apex-accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View all
              </button>
            </div>

            {loading || fsLoading ? (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl p-4 h-32 apex-skeleton" style={{ border: '1px solid var(--apex-border-subtle)' }} />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <FolderOpen size={40} color="var(--apex-text-disabled)" />
                <div style={{ fontSize: '14px', color: 'var(--apex-text-secondary)', fontWeight: 600 }}>No projects found</div>
                <div style={{ fontSize: '12px', color: 'var(--apex-text-disabled)' }}>
                  Create a project in ~/Coding or any folder with a .git directory
                </div>
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {projects.map((node, i) => (
                  <ErrorBoundary key={node.path}>
                    <ProjectCard node={node} index={i} activePaths={activePaths} />
                  </ErrorBoundary>
                ))}
              </div>
            )}
          </div>

          {/* Folder tree */}
          <div className="flex-1 rounded-xl overflow-hidden" style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)', minHeight: '240px' }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--apex-border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                File System
              </span>
              <button
                onClick={() => scanHome(3)}
                style={{ fontSize: '11px', color: 'var(--apex-accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Refresh
              </button>
            </div>
            <div style={{ height: '300px' }}>
              <ErrorBoundary>
                <FolderTree nodes={fsTree} activePaths={activePaths} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      {/* Right metrics panel */}
      <ErrorBoundary>
        <MetricsPanel />
      </ErrorBoundary>
    </motion.div>
  )
}
