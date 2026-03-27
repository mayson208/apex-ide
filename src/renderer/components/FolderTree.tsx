import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, File, ChevronRight, GitBranch, Package, Zap } from 'lucide-react'
import type { FsNode } from '../store/projectStore'
import { useAppStore } from '../store/appStore'

interface Props {
  nodes: FsNode[]
  depth?: number
  activePaths?: string[]
}

function TreeNode({ node, depth = 0, activePaths = [] }: { node: FsNode; depth: number; activePaths: string[] }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const { setSelectedProject, setActiveView } = useAppStore()
  const isActive = activePaths.some((p) => p === node.path || p.startsWith(node.path))
  const hasChildren = node.type === 'directory' && (node.children?.length ?? 0) > 0

  const handleClick = () => {
    if (node.type === 'directory') {
      setExpanded(!expanded)
    }
  }

  const handleDoubleClick = () => {
    if (node.type === 'directory' && node.hasGit) {
      setSelectedProject(node.path)
      setActiveView('project')
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="flex items-center gap-1.5 rounded cursor-pointer group transition-colors"
        style={{
          paddingLeft: `${8 + depth * 14}px`,
          paddingRight: 8,
          paddingTop: 3,
          paddingBottom: 3,
          background: isActive ? 'rgba(16,185,129,0.08)' : 'transparent',
          borderLeft: isActive ? '1px solid rgba(16,185,129,0.4)' : '1px solid transparent',
        }}
      >
        {hasChildren ? (
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.12 }}>
            <ChevronRight size={10} color="var(--apex-text-muted)" />
          </motion.div>
        ) : (
          <div style={{ width: 10 }} />
        )}

        {node.type === 'directory' ? (
          expanded ? (
            <FolderOpen size={13} color={isActive ? '#10b981' : 'var(--apex-accent-amber)'} />
          ) : (
            <Folder size={13} color={isActive ? '#10b981' : 'var(--apex-accent-amber)'} />
          )
        ) : (
          <File size={13} color="var(--apex-text-muted)" />
        )}

        <span
          style={{
            fontSize: '12px',
            color: isActive ? '#10b981' : 'var(--apex-text-secondary)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          className="group-hover:text-white transition-colors"
        >
          {node.name}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.hasGit && <GitBranch size={10} color="var(--apex-accent-cyan)" />}
          {node.hasPackageJson && <Package size={10} color="var(--apex-accent-amber)" />}
          {node.hasClaudeMd && <Zap size={10} color="var(--apex-accent-violet)" />}
          {isActive && <div className="w-1.5 h-1.5 rounded-full apex-dot-pulse" style={{ background: '#10b981' }} />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'hidden' }}
          >
            {node.children!.map((child) => (
              <TreeNode key={child.path} node={child} depth={depth + 1} activePaths={activePaths} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FolderTree({ nodes, depth = 0, activePaths = [] }: Props): React.ReactElement {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'active'>('active')

  const sorted = useMemo(() => {
    let list = [...nodes]
    if (sortBy === 'modified') {
      list.sort((a, b) => b.lastModified - a.lastModified)
    } else if (sortBy === 'active') {
      list.sort((a, b) => {
        const aA = activePaths.some((p) => p === a.path || p.startsWith(a.path)) ? 1 : 0
        const bA = activePaths.some((p) => p === b.path || p.startsWith(b.path)) ? 1 : 0
        return bA - aA
      })
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }

    if (search) {
      list = list.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
    }

    return list
  }, [nodes, sortBy, search, activePaths])

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--apex-border-subtle)' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter..."
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: '12px', color: 'var(--apex-text-secondary)' }}
        />
        <div className="flex items-center gap-1">
          {(['name', 'modified', 'active'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid',
                borderColor: sortBy === s ? 'var(--apex-accent-primary)' : 'var(--apex-border-default)',
                background: sortBy === s ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: sortBy === s ? 'var(--apex-accent-primary)' : 'var(--apex-text-muted)',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center py-8" style={{ color: 'var(--apex-text-disabled)', fontSize: '12px' }}>
            {search ? `No results for "${search}"` : 'No folders found'}
          </div>
        ) : (
          sorted.map((node) => (
            <TreeNode key={node.path} node={node} depth={depth} activePaths={activePaths} />
          ))
        )}
      </div>
    </div>
  )
}
