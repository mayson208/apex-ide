import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, GitCommit, FolderOpen, Terminal, Copy, ArrowLeft, File, Folder, Clock, Code2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useProjectStore, type FsNode } from '../store/projectStore'
import { useGitStatus } from '../hooks/useGitStatus'
import { useClaudeProcess } from '../hooks/useClaudeProcess'
import { ActiveIndicator } from '../components/ActiveIndicator'
import { ErrorBoundary } from '../components/ErrorBoundary'

interface GitCommitEntry {
  hash: string
  message: string
  author: string
  date: string
}

export function ProjectView(): React.ReactElement {
  const { selectedProjectPath, setActiveView, setSelectedProject, addNotification } = useAppStore()
  const { status: gitStatus, loading: gitLoading } = useGitStatus(selectedProjectPath)
  const { isActive } = useClaudeProcess(selectedProjectPath || undefined)
  const [tree, setTree] = useState<FsNode[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [commits, setCommits] = useState<GitCommitEntry[]>([])
  const [commitsLoading, setCommitsLoading] = useState(false)
  const [readme, setReadme] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'files' | 'git' | 'sessions' | 'readme'>('files')

  const projectName = selectedProjectPath?.split(/[/\\]/).pop() || 'Unknown Project'

  useEffect(() => {
    if (!selectedProjectPath) return

    // Load file tree
    setTreeLoading(true)
    window.apex.fs.scanDir(selectedProjectPath, 2).then((t) => {
      setTree(t)
      setTreeLoading(false)
    }).catch(() => setTreeLoading(false))

    // Load git log
    setCommitsLoading(true)
    window.apex.git.log(selectedProjectPath, 20).then((c) => {
      setCommits(c as GitCommitEntry[])
      setCommitsLoading(false)
    }).catch(() => setCommitsLoading(false))

    // Load README
    const readmePath = `${selectedProjectPath}/README.md`
    window.apex.fs.readFile(readmePath).then((content) => {
      setReadme(content)
    }).catch(() => setReadme(null))
  }, [selectedProjectPath])

  const fileCount = useMemo(() => {
    const count = (nodes: FsNode[]): number => nodes.reduce((a, n) => a + (n.type === 'file' ? 1 : count(n.children || [])), 0)
    return count(tree)
  }, [tree])

  if (!selectedProjectPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" style={{ background: 'var(--apex-bg-base)' }}>
        <FolderOpen size={48} color="var(--apex-text-disabled)" />
        <div style={{ fontSize: '16px', color: 'var(--apex-text-secondary)', fontWeight: 600 }}>No project selected</div>
        <button
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: 'var(--apex-accent-primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px' }}
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--apex-bg-base)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--apex-border-subtle)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--apex-text-primary)' }}>
                {projectName}
              </h1>
              <ActiveIndicator active={isActive} label="ACTIVE" />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--apex-text-muted)', fontFamily: 'var(--apex-font-mono)' }}>
              {selectedProjectPath}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveView('terminal') }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--apex-accent-primary)', cursor: 'pointer', fontSize: '12px' }}
          >
            <Terminal size={13} /> Open Terminal
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(selectedProjectPath); addNotification({ type: 'success', title: 'Path copied' }) }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-secondary)', cursor: 'pointer', fontSize: '12px' }}
          >
            <Copy size={13} /> Copy Path
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-5 py-2" style={{ borderBottom: '1px solid var(--apex-border-subtle)', background: 'var(--apex-bg-surface)' }}>
        {[
          { label: 'Files', value: fileCount, icon: File, color: '#6366f1' },
          { label: 'Commits', value: commits.length, icon: GitCommit, color: '#8b5cf6' },
          { label: 'Branch', value: gitStatus?.branch || '—', icon: GitBranch, color: '#06b6d4' },
          { label: 'Modified', value: `${gitStatus?.unstaged || 0} files`, icon: Code2, color: '#f59e0b' },
          { label: 'Last commit', value: gitStatus?.lastCommit?.date ? new Date(gitStatus.lastCommit.date).toLocaleDateString() : '—', icon: Clock, color: '#10b981' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon size={13} color={color} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-text-primary)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '10px', color: 'var(--apex-text-muted)' }}>{label}</div>
            </div>
            <div style={{ width: 1, height: 24, background: 'var(--apex-border-subtle)', marginLeft: 8 }} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5" style={{ borderBottom: '1px solid var(--apex-border-subtle)', background: 'var(--apex-bg-surface)' }}>
        {([
          { id: 'files', label: 'Files' },
          { id: 'git', label: 'Git Activity' },
          { id: 'sessions', label: 'Sessions' },
          ...(readme ? [{ id: 'readme', label: 'README' }] : []),
        ] as Array<{ id: 'files' | 'git' | 'sessions' | 'readme'; label: string }>).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-2 transition-colors"
            style={{
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--apex-accent-primary)' : 'transparent'}`,
              color: activeTab === tab.id ? 'var(--apex-text-primary)' : 'var(--apex-text-muted)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'files' && (
          <ErrorBoundary>
            {treeLoading ? (
              <div className="flex flex-col gap-1.5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="apex-skeleton rounded h-8" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {tree.map((node) => (
                  <FileRow key={node.path} node={node} depth={0} />
                ))}
              </div>
            )}
          </ErrorBoundary>
        )}

        {activeTab === 'git' && (
          <ErrorBoundary>
            {commitsLoading ? (
              <div className="flex flex-col gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="apex-skeleton rounded-xl h-16" />
                ))}
              </div>
            ) : commits.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <GitCommit size={32} color="var(--apex-text-disabled)" />
                <div style={{ color: 'var(--apex-text-secondary)', fontSize: '14px' }}>No git history</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {commits.map((commit) => (
                  <div key={commit.hash} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)' }}>
                    <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 32, height: 32, background: 'rgba(99,102,241,0.15)' }}>
                      <GitCommit size={14} color="var(--apex-accent-primary)" />
                    </div>
                    <div className="flex-1">
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-text-primary)', marginBottom: 2 }}>
                        {commit.message}
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', fontFamily: 'var(--apex-font-mono)' }}>{commit.hash}</span>
                        <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)' }}>by {commit.author}</span>
                        <span style={{ fontSize: '11px', color: 'var(--apex-text-disabled)' }}>{new Date(commit.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ErrorBoundary>
        )}

        {activeTab === 'sessions' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Terminal size={32} color="var(--apex-text-disabled)" />
            <div style={{ color: 'var(--apex-text-secondary)', fontSize: '14px' }}>Session history coming soon</div>
          </div>
        )}

        {activeTab === 'readme' && readme && (
          <div
            className="prose selectable"
            style={{ color: 'var(--apex-text-primary)', fontFamily: 'inherit', maxWidth: '760px', fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap', background: 'var(--apex-bg-surface)', padding: 24, borderRadius: 12, border: '1px solid var(--apex-border-subtle)' }}
          >
            {readme}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function FileRow({ node, depth }: { node: FsNode; depth: number }): React.ReactElement {
  const [expanded, setExpanded] = useState(depth === 0)

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/3 cursor-pointer group transition-colors"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => node.type === 'directory' && setExpanded(!expanded)}
      >
        {node.type === 'directory' ? (
          <Folder size={13} color="var(--apex-accent-amber)" />
        ) : (
          <File size={13} color="var(--apex-text-muted)" />
        )}
        <span style={{ fontSize: '13px', color: 'var(--apex-text-secondary)', flex: 1 }}>{node.name}</span>
        {node.type === 'file' && (
          <span style={{ fontSize: '10px', color: 'var(--apex-text-disabled)', fontFamily: 'var(--apex-font-mono)' }}>
            {(node.size / 1024).toFixed(1)}kb
          </span>
        )}
      </div>
      {expanded && node.children?.map((child) => (
        <FileRow key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}
