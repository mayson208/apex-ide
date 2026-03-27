import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Palette, Folder, Terminal, GitBranch, Keyboard, Database, Save, ExternalLink } from 'lucide-react'
import { useAppStore } from '../store/appStore'

interface SettingsSection { id: string; label: string; icon: React.ElementType }

const SECTIONS: SettingsSection[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'filesystem', label: 'File System', icon: Folder },
  { id: 'claude', label: 'Claude Integration', icon: Terminal },
  { id: 'git', label: 'Git', icon: GitBranch },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
  { id: 'data', label: 'Data & Privacy', icon: Database },
]

const SHORTCUTS = [
  { action: 'Command Palette', keys: '⌘⇧P', editable: true },
  { action: 'Open Terminal', keys: '⌘T', editable: true },
  { action: 'Go to Dashboard', keys: '⌘1', editable: true },
  { action: 'Go to Projects', keys: '⌘2', editable: true },
  { action: 'Go to Skills', keys: '⌘3', editable: true },
  { action: 'Go to Todos', keys: '⌘4', editable: true },
  { action: 'Open Settings', keys: '⌘,', editable: true },
  { action: 'New Tab (Terminal)', keys: '⌘T', editable: true },
  { action: 'Close Tab', keys: '⌘W', editable: true },
  { action: 'Launch Claude', keys: '⌘L', editable: true },
]

export function SettingsView(): React.ReactElement {
  const { settings, updateSettings, addNotification } = useAppStore()
  const [activeSection, setActiveSection] = useState('appearance')
  const [shortcutSearch, setShortcutSearch] = useState('')

  const save = () => {
    addNotification({ type: 'success', title: 'Settings saved' })
  }

  const exportData = async () => {
    try {
      const [sessions, todos, skills] = await Promise.all([
        window.apex.sessions.list(),
        window.apex.todos.read(),
        window.apex.skills.list(),
      ])
      const data = { sessions, todos, skills, exportedAt: new Date().toISOString() }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'apex-data-export.json'
      a.click()
      URL.revokeObjectURL(url)
      addNotification({ type: 'success', title: 'Data exported' })
    } catch {
      addNotification({ type: 'error', title: 'Export failed' })
    }
  }

  const filteredShortcuts = SHORTCUTS.filter(
    (s) => !shortcutSearch || s.action.toLowerCase().includes(shortcutSearch.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="flex h-full overflow-hidden"
      style={{ background: 'var(--apex-bg-base)' }}
    >
      {/* Sidebar */}
      <div className="flex flex-col gap-1 py-4 px-3 overflow-y-auto" style={{ width: '220px', minWidth: '220px', borderRight: '1px solid var(--apex-border-subtle)' }}>
        <div className="flex items-center gap-2 px-2 mb-4">
          <Settings size={16} color="var(--apex-text-secondary)" />
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--apex-text-primary)' }}>Settings</span>
        </div>
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors"
              style={{
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--apex-accent-primary)' : 'var(--apex-text-muted)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'appearance' && (
          <Section title="Appearance">
            <SettingRow label="Font Size" description="Base UI font size in pixels">
              <div className="flex items-center gap-2">
                <input
                  type="range" min={11} max={16} value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                  className="w-32"
                />
                <span style={{ fontSize: '12px', color: 'var(--apex-text-secondary)', minWidth: 24 }}>{settings.fontSize}px</span>
              </div>
            </SettingRow>
            <SettingRow label="Accent Color" description="Primary accent color">
              <div className="flex items-center gap-2">
                <input type="color" value={settings.accentColor} onChange={(e) => updateSettings({ accentColor: e.target.value })} style={{ width: 32, height: 28, borderRadius: 6, border: '1px solid var(--apex-border-default)', cursor: 'pointer' }} />
                <span style={{ fontSize: '12px', color: 'var(--apex-text-muted)', fontFamily: 'var(--apex-font-mono)' }}>{settings.accentColor}</span>
              </div>
            </SettingRow>
            <SettingRow label="Animation Speed" description="UI transition speed">
              <Select value={settings.animationSpeed} onChange={(v) => updateSettings({ animationSpeed: v as 'fast' | 'normal' | 'slow' })} options={[{ value: 'fast', label: 'Fast' }, { value: 'normal', label: 'Normal' }, { value: 'slow', label: 'Slow' }]} />
            </SettingRow>
          </Section>
        )}

        {activeSection === 'filesystem' && (
          <Section title="File System">
            <SettingRow label="Home Directory" description="Root directory to scan for projects">
              <input
                value={settings.homeDir}
                onChange={(e) => updateSettings({ homeDir: e.target.value })}
                placeholder="Leave empty for system home..."
                className="px-3 py-1.5 rounded-lg outline-none"
                style={{ width: '300px', background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '12px', fontFamily: 'var(--apex-font-mono)' }}
              />
            </SettingRow>
            <SettingRow label="Scan Depth" description="How deep to scan for projects (1-5)">
              <div className="flex items-center gap-2">
                <input type="range" min={1} max={5} value={settings.scanDepth} onChange={(e) => updateSettings({ scanDepth: Number(e.target.value) })} className="w-24" />
                <span style={{ fontSize: '12px', color: 'var(--apex-text-secondary)' }}>{settings.scanDepth}</span>
              </div>
            </SettingRow>
            <SettingRow label="Ignored Patterns" description="Comma-separated patterns to ignore during scanning">
              <textarea
                value={settings.ignoredPatterns.join(', ')}
                onChange={(e) => updateSettings({ ignoredPatterns: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="rounded-lg outline-none resize-none"
                style={{ width: '300px', height: '70px', background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '12px', padding: '8px 12px', fontFamily: 'var(--apex-font-mono)' }}
              />
            </SettingRow>
          </Section>
        )}

        {activeSection === 'claude' && (
          <Section title="Claude Integration">
            <SettingRow label="Claude CLI Path" description="Path to the claude CLI executable">
              <input
                value={settings.claudeCliPath}
                onChange={(e) => updateSettings({ claudeCliPath: e.target.value })}
                placeholder="claude"
                className="px-3 py-1.5 rounded-lg outline-none"
                style={{ width: '240px', background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '12px', fontFamily: 'var(--apex-font-mono)' }}
              />
            </SettingRow>
            <SettingRow label="Default Flags" description="Default flags to pass to claude (space-separated)">
              <input
                value={settings.claudeDefaultFlags.join(' ')}
                onChange={(e) => updateSettings({ claudeDefaultFlags: e.target.value.split(' ').filter(Boolean) })}
                placeholder="--no-auto-updates"
                className="px-3 py-1.5 rounded-lg outline-none"
                style={{ width: '240px', background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '12px', fontFamily: 'var(--apex-font-mono)' }}
              />
            </SettingRow>
            <SettingRow label="Auto Commit" description="Automatically create git commits after Claude sessions">
              <Toggle value={settings.autoCommit} onChange={(v) => updateSettings({ autoCommit: v })} />
            </SettingRow>
          </Section>
        )}

        {activeSection === 'git' && (
          <Section title="Git">
            <SettingRow label="User Name" description="Git commit author name">
              <input
                value={settings.gitUserName}
                onChange={(e) => updateSettings({ gitUserName: e.target.value })}
                placeholder="Your Name"
                className="px-3 py-1.5 rounded-lg outline-none"
                style={{ width: '240px', background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '13px' }}
              />
            </SettingRow>
            <SettingRow label="Email" description="Git commit author email">
              <input
                value={settings.gitUserEmail}
                onChange={(e) => updateSettings({ gitUserEmail: e.target.value })}
                placeholder="you@example.com"
                className="px-3 py-1.5 rounded-lg outline-none"
                style={{ width: '240px', background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '13px' }}
              />
            </SettingRow>
            <SettingRow label="Auto Push" description="Auto-push after commits">
              <Toggle value={settings.autoPush} onChange={(v) => updateSettings({ autoPush: v })} />
            </SettingRow>
            <SettingRow label="Default Branch" description="Default branch name">
              <input
                value={settings.defaultBranch}
                onChange={(e) => updateSettings({ defaultBranch: e.target.value })}
                placeholder="main"
                className="px-3 py-1.5 rounded-lg outline-none"
                style={{ width: '120px', background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '13px', fontFamily: 'var(--apex-font-mono)' }}
              />
            </SettingRow>
          </Section>
        )}

        {activeSection === 'shortcuts' && (
          <Section title="Keyboard Shortcuts">
            <div className="mb-3">
              <input
                value={shortcutSearch}
                onChange={(e) => setShortcutSearch(e.target.value)}
                placeholder="Search shortcuts..."
                className="px-3 py-2 rounded-xl outline-none"
                style={{ width: '100%', background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '13px', marginBottom: 12 }}
              />
            </div>
            <div className="flex flex-col gap-1">
              {filteredShortcuts.map((s) => (
                <div key={s.action} className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--apex-text-secondary)' }}>{s.action}</span>
                  <kbd style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--apex-border-strong)', color: 'var(--apex-text-primary)', background: 'var(--apex-bg-elevated)', fontFamily: 'var(--apex-font-mono)' }}>
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </Section>
        )}

        {activeSection === 'data' && (
          <Section title="Data & Privacy">
            <SettingRow label="Export All Data" description="Download all sessions, todos, and skills as JSON">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--apex-accent-primary)', cursor: 'pointer', fontSize: '13px' }}
              >
                <ExternalLink size={14} /> Export JSON
              </button>
            </SettingRow>
            <SettingRow label="Data Folder" description="Open ~/.apex/ in your file manager">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-secondary)', cursor: 'pointer', fontSize: '13px' }}
              >
                <Folder size={14} /> Open Folder
              </button>
            </SettingRow>
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f43f5e', marginBottom: 4 }}>Danger Zone</div>
              <div style={{ fontSize: '12px', color: 'var(--apex-text-muted)', marginBottom: 10 }}>These actions cannot be undone.</div>
              <button
                onClick={() => {
                  if (confirm('Clear all APEX data? This cannot be undone.')) {
                    addNotification({ type: 'warning', title: 'Data cleared' })
                  }
                }}
                className="px-4 py-2 rounded-xl"
                style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', cursor: 'pointer', fontSize: '13px' }}
              >
                Clear All History
              </button>
            </div>
          </Section>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={save}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold"
            style={{ background: 'var(--apex-accent-primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px' }}
          >
            <Save size={14} /> Save Settings
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--apex-text-primary)', marginBottom: 20 }}>{title}</h2>
      <div className="flex flex-col gap-1 max-w-2xl">
        {children}
      </div>
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid var(--apex-border-subtle)' }}>
      <div>
        <div style={{ fontSize: '14px', color: 'var(--apex-text-primary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--apex-text-muted)' }}>{description}</div>
      </div>
      <div style={{ flexShrink: 0, marginLeft: 24 }}>{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative rounded-full transition-colors"
      style={{ width: 40, height: 22, background: value ? 'var(--apex-accent-primary)' : 'var(--apex-border-strong)', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <div
        className="absolute rounded-full bg-white transition-transform"
        style={{ width: 16, height: 16, top: 3, left: 3, transform: value ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg outline-none"
      style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '13px', cursor: 'pointer' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
