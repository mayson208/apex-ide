import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Folder, Zap, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'

interface Props { onComplete: () => void }

const STEPS = [
  {
    id: 'claude',
    icon: Terminal,
    title: 'Claude CLI',
    description: 'APEX works with the Claude CLI. Make sure claude is installed and in your PATH.',
    action: 'Check CLI',
    color: '#6366f1',
  },
  {
    id: 'homedir',
    icon: Folder,
    title: 'Home Directory',
    description: 'APEX will scan your home directory for projects. You can change this in Settings.',
    action: 'Confirm',
    color: '#06b6d4',
  },
  {
    id: 'skill',
    icon: Zap,
    title: 'First Skill',
    description: 'Skills are reusable prompts stored as Markdown files in ~/.apex/skills/.',
    action: 'Got it',
    color: '#8b5cf6',
  },
]

export function Onboarding({ onComplete }: Props): React.ReactElement {
  const [step, setStep] = useState(0)
  const [claudeStatus, setClaudeStatus] = useState<'checking' | 'found' | 'notfound' | 'idle'>('idle')
  const { updateSettings } = useAppStore()

  const current = STEPS[step]
  const Icon = current.icon

  const handleAction = async () => {
    if (step === 0) {
      setClaudeStatus('checking')
      // Try to detect claude process or check path
      try {
        const procs = await window.apex.process.detectClaude()
        setClaudeStatus(procs.length > 0 ? 'found' : 'notfound')
      } catch {
        setClaudeStatus('notfound')
      }
      setTimeout(() => setStep(1), 1000)
    } else if (step === 1) {
      const home = await window.apex.fs.scanHome({ depth: 0 })
      updateSettings({ homeDir: home.length > 0 ? home[0]?.path || '' : '' })
      setStep(2)
    } else {
      onComplete()
    }
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(8,8,16,0.9)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="rounded-2xl overflow-hidden"
          style={{
            width: '480px',
            background: 'var(--apex-bg-elevated)',
            border: '1px solid var(--apex-border-default)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
          }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="obGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <polygon points="12,2 22,20 2,20" fill="none" stroke="url(#obGrad)" strokeWidth="2" strokeLinejoin="round" />
                <line x1="7" y1="14" x2="17" y2="14" stroke="url(#obGrad)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--apex-text-primary)', marginBottom: 4 }}>
              Welcome to APEX
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--apex-text-muted)' }}>
              Let's get you set up in 3 quick steps
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  background: i === step ? current.color : i < step ? 'var(--apex-border-strong)' : 'var(--apex-border-subtle)',
                }}
              />
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-8 pb-8"
            >
              <div
                className="flex items-center justify-center rounded-2xl mb-5 mx-auto"
                style={{
                  width: 64,
                  height: 64,
                  background: `${current.color}15`,
                  border: `1px solid ${current.color}30`,
                }}
              >
                <Icon size={28} color={current.color} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--apex-text-primary)', textAlign: 'center', marginBottom: 8 }}>
                {current.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--apex-text-secondary)', textAlign: 'center', marginBottom: 24 }}>
                {current.description}
              </p>

              {step === 0 && claudeStatus !== 'idle' && (
                <div
                  className="flex items-center justify-center gap-2 mb-4 py-2 rounded-lg"
                  style={{
                    background: claudeStatus === 'found' ? 'rgba(16,185,129,0.1)' : claudeStatus === 'checking' ? 'rgba(99,102,241,0.1)' : 'rgba(244,63,94,0.1)',
                    color: claudeStatus === 'found' ? '#10b981' : claudeStatus === 'checking' ? '#6366f1' : '#f43f5e',
                  }}
                >
                  <span style={{ fontSize: '13px' }}>
                    {claudeStatus === 'checking' && 'Checking...'}
                    {claudeStatus === 'found' && 'Claude CLI detected!'}
                    {claudeStatus === 'notfound' && 'Not detected — install claude CLI first'}
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 py-2.5 rounded-xl transition-colors"
                    style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-secondary)', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleAction}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-colors"
                  style={{ background: current.color, border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                >
                  {current.action}
                  {step < STEPS.length - 1 && <ChevronRight size={14} />}
                </button>
              </div>

              <button
                onClick={onComplete}
                className="w-full text-center mt-3 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--apex-text-disabled)' }}
              >
                Skip setup
              </button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  )
}
