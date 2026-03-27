import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Zap, Tag, Download, X, Save, Trash2, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { ErrorBoundary } from '../components/ErrorBoundary'

interface Skill {
  id: string
  name: string
  description: string
  tags: string[]
  version: string
  author: string
  usageCount: number
  createdAt: string
  lastUsedAt: string
  content: string
  filePath: string
}

const TAG_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e']

export function SkillsManager(): React.ReactElement {
  const { addNotification } = useAppStore()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)

  const loadSkills = async () => {
    setLoading(true)
    try {
      const list = await window.apex.skills.list()
      setSkills(list as Skill[])
    } catch {
      addNotification({ type: 'error', title: 'Failed to load skills' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSkills() }, [])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    skills.forEach((s) => s.tags?.forEach((t) => tags.add(t)))
    return Array.from(tags)
  }, [skills])

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      const q = search.toLowerCase()
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.tags?.some((t) => t.toLowerCase().includes(q))
      const matchTag = !selectedTag || s.tags?.includes(selectedTag)
      return matchSearch && matchTag
    })
  }, [skills, search, selectedTag])

  const openEditor = (skill?: Skill) => {
    setEditingSkill(skill || { name: '', description: '', tags: [], content: '', version: '1.0.0', author: '' })
    setEditorOpen(true)
  }

  const saveSkill = async () => {
    if (!editingSkill?.name || !editingSkill?.content) {
      addNotification({ type: 'warning', title: 'Name and content required' })
      return
    }
    try {
      await window.apex.skills.save(editingSkill)
      addNotification({ type: 'success', title: 'Skill saved' })
      setEditorOpen(false)
      loadSkills()
    } catch {
      addNotification({ type: 'error', title: 'Failed to save skill' })
    }
  }

  const deleteSkill = async (id: string) => {
    try {
      await window.apex.skills.delete(id)
      addNotification({ type: 'success', title: 'Skill deleted' })
      loadSkills()
    } catch {
      addNotification({ type: 'error', title: 'Failed to delete skill' })
    }
  }

  const importFromUrl = async () => {
    if (!importUrl.trim()) return
    setImportLoading(true)
    try {
      const res = await fetch(importUrl)
      if (!res.ok) throw new Error('Fetch failed')
      const content = await res.text()
      openEditor({ name: 'Imported Skill', content, description: `Imported from ${importUrl}`, tags: ['imported'] })
      setImportUrl('')
    } catch {
      addNotification({ type: 'error', title: 'Import failed', message: 'Check the URL and try again' })
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col h-full"
      style={{ background: 'var(--apex-bg-base)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--apex-border-subtle)' }}>
        <div className="flex items-center gap-3">
          <Zap size={20} color="var(--apex-accent-amber)" />
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--apex-text-primary)' }}>Skills Manager</h1>
          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: '11px', background: 'rgba(245,158,11,0.15)', color: 'var(--apex-accent-amber)' }}>
            {skills.length} skills
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)' }}>
            <Download size={13} color="var(--apex-text-muted)" />
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="Import from URL..."
              onKeyDown={(e) => e.key === 'Enter' && importFromUrl()}
              className="bg-transparent outline-none"
              style={{ fontSize: '12px', color: 'var(--apex-text-secondary)', width: '200px' }}
            />
            {importUrl && (
              <button
                onClick={importFromUrl}
                disabled={importLoading}
                style={{ fontSize: '11px', color: 'var(--apex-accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {importLoading ? '...' : 'Import'}
              </button>
            )}
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--apex-accent-amber)', border: 'none', color: '#000', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            <Plus size={14} />
            New Skill
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex flex-col gap-4 p-4" style={{ width: '220px', minWidth: '220px', borderRight: '1px solid var(--apex-border-subtle)', overflowY: 'auto' }}>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)' }}>
            <Search size={13} color="var(--apex-text-muted)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="bg-transparent outline-none flex-1"
              style={{ fontSize: '12px', color: 'var(--apex-text-secondary)' }}
            />
          </div>

          {/* Tags */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--apex-text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Tags</div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedTag(null)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left"
                style={{ background: !selectedTag ? 'rgba(99,102,241,0.12)' : 'transparent', color: !selectedTag ? 'var(--apex-accent-primary)' : 'var(--apex-text-muted)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
              >
                All Skills ({skills.length})
              </button>
              {allTags.map((tag, i) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left"
                  style={{ background: selectedTag === tag ? 'rgba(99,102,241,0.12)' : 'transparent', color: selectedTag === tag ? 'var(--apex-accent-primary)' : 'var(--apex-text-muted)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: TAG_COLORS[i % TAG_COLORS.length] }} />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl h-40 apex-skeleton" style={{ border: '1px solid var(--apex-border-subtle)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Zap size={40} color="var(--apex-text-disabled)" />
              <div style={{ fontSize: '15px', color: 'var(--apex-text-secondary)', fontWeight: 600 }}>
                {search ? 'No skills match' : 'No skills yet'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--apex-text-disabled)', textAlign: 'center', maxWidth: 300 }}>
                Skills are reusable prompts stored as Markdown files in ~/.apex/skills/. Create your first skill to get started.
              </div>
              <button
                onClick={() => openEditor()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'var(--apex-accent-amber)', border: 'none', color: '#000', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                <Plus size={14} />
                Create First Skill
              </button>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {filtered.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="rounded-xl p-4 group cursor-pointer"
                  style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)' }}
                  onClick={() => openEditor(skill)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      className="flex items-center justify-center rounded-lg shrink-0"
                      style={{ width: 32, height: 32, background: 'rgba(245,158,11,0.15)' }}
                    >
                      <Zap size={16} color="#f59e0b" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSkill(skill.id) }}
                        className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-rose-500/20 transition-colors"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--apex-text-primary)', marginBottom: 4 }}>
                    {skill.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--apex-text-muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {skill.description || 'No description'}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    {skill.tags?.slice(0, 3).map((tag, idx) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded" style={{ fontSize: '10px', background: `${TAG_COLORS[idx % TAG_COLORS.length]}20`, color: TAG_COLORS[idx % TAG_COLORS.length] }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '10px', color: 'var(--apex-text-disabled)' }}>
                      Used {skill.usageCount}×
                    </span>
                    <ChevronRight size={12} color="var(--apex-text-disabled)" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editorOpen && editingSkill && (
          <SkillEditor
            skill={editingSkill}
            onChange={setEditingSkill}
            onSave={saveSkill}
            onClose={() => setEditorOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface SkillEditorProps {
  skill: Partial<Skill>
  onChange: (skill: Partial<Skill>) => void
  onSave: () => void
  onClose: () => void
}

function SkillEditor({ skill, onChange, onSave, onClose }: SkillEditorProps): React.ReactElement {
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    if (!tagInput.trim()) return
    onChange({ ...skill, tags: [...(skill.tags || []), tagInput.trim()] })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    onChange({ ...skill, tags: (skill.tags || []).filter((t) => t !== tag) })
  }

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
        className="fixed inset-0 z-50 flex items-center justify-center p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex overflow-hidden rounded-2xl w-full max-w-4xl"
          style={{ maxHeight: '85vh', background: 'var(--apex-bg-elevated)', border: '1px solid var(--apex-border-default)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left: metadata */}
          <div className="flex flex-col gap-4 p-6 overflow-y-auto" style={{ width: '320px', minWidth: '320px', borderRight: '1px solid var(--apex-border-subtle)' }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--apex-text-primary)' }}>
                {skill.id ? 'Edit Skill' : 'New Skill'}
              </h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {[
              { label: 'Name', key: 'name', placeholder: 'Skill name...' },
              { label: 'Description', key: 'description', placeholder: 'What does this skill do?' },
              { label: 'Author', key: 'author', placeholder: 'Your name...' },
              { label: 'Version', key: 'version', placeholder: '1.0.0' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: '11px', color: 'var(--apex-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  {label}
                </label>
                <input
                  value={(skill as Record<string, string>)[key] || ''}
                  onChange={(e) => onChange({ ...skill, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-lg outline-none"
                  style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '13px' }}
                />
              </div>
            ))}

            {/* Tags */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--apex-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Tags
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {(skill.tags || []).map((tag) => (
                  <div key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '11px', color: 'var(--apex-accent-primary)' }}>
                    {tag}
                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-1.5 rounded-lg outline-none"
                  style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '12px' }}
                />
                <button
                  onClick={addTag}
                  style={{ padding: '6px 12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: 'var(--apex-accent-primary)', cursor: 'pointer', fontSize: '12px' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={onSave}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold mt-auto"
              style={{ background: 'var(--apex-accent-primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px' }}
            >
              <Save size={14} />
              Save Skill
            </button>
          </div>

          {/* Right: content editor */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--apex-border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Content (Markdown)
              </span>
              <div className="flex items-center gap-1">
                <Tag size={11} color="var(--apex-text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)' }}>Supports Markdown</span>
              </div>
            </div>
            <textarea
              value={skill.content || ''}
              onChange={(e) => onChange({ ...skill, content: e.target.value })}
              placeholder="Write your skill prompt here in Markdown..."
              className="flex-1 outline-none resize-none selectable"
              style={{
                background: 'var(--apex-bg-base)',
                color: 'var(--apex-text-primary)',
                fontFamily: 'var(--apex-font-mono)',
                fontSize: '13px',
                padding: '16px',
                lineHeight: '1.6',
                border: 'none',
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
