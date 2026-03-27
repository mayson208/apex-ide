import React, { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from './store/appStore'
import { TitleBar } from './components/TitleBar'
import { ActivityBar } from './components/ActivityBar'
import { StatusBar } from './components/StatusBar'
import { CommandPalette } from './components/CommandPalette'
import { NotificationSystem } from './components/NotificationSystem'
import { Dashboard } from './views/Dashboard'
import { ProjectView } from './views/ProjectView'
import { TerminalPane } from './views/TerminalPane'
import { SkillsManager } from './views/SkillsManager'
import { TodoBoard } from './views/TodoBoard'
import { SettingsView } from './views/SettingsView'
import { Onboarding } from './components/Onboarding'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App(): React.ReactElement {
  const { activeView, commandPaletteOpen, setCommandPaletteOpen } = useAppStore()
  const [showOnboarding, setShowOnboarding] = React.useState(false)

  useEffect(() => {
    // Check if first launch
    const hasLaunched = localStorage.getItem('apex-has-launched')
    if (!hasLaunched) {
      setShowOnboarding(true)
    }

    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />
      case 'project': return <ProjectView />
      case 'terminal': return <TerminalPane />
      case 'skills': return <SkillsManager />
      case 'todos': return <TodoBoard />
      case 'settings': return <SettingsView />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex flex-col" style={{ width: '100vw', height: '100vh', background: 'var(--apex-bg-void)', overflow: 'hidden' }}>
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar />

        <main className="flex-1 overflow-hidden relative">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <div key={activeView} className="absolute inset-0">
                {renderView()}
              </div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      <StatusBar />

      <AnimatePresence>
        {commandPaletteOpen && (
          <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
        )}
      </AnimatePresence>

      <NotificationSystem />

      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={() => {
            localStorage.setItem('apex-has-launched', 'true')
            setShowOnboarding(false)
          }} />
        )}
      </AnimatePresence>
    </div>
  )
}
