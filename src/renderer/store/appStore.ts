import { create } from 'zustand'

export type ActiveView = 'dashboard' | 'project' | 'terminal' | 'skills' | 'todos' | 'settings'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  timestamp: number
  autoDismiss?: boolean
}

export interface AppSettings {
  theme: 'dark'
  accentColor: string
  fontSize: number
  animationSpeed: 'fast' | 'normal' | 'slow'
  homeDir: string
  ignoredPatterns: string[]
  scanDepth: number
  watchInterval: number
  claudeCliPath: string
  claudeDefaultFlags: string[]
  autoCommit: boolean
  gitUserName: string
  gitUserEmail: string
  autoPush: boolean
  defaultBranch: string
}

interface AppState {
  activeView: ActiveView
  selectedProjectPath: string | null
  notifications: Notification[]
  commandPaletteOpen: boolean
  settings: AppSettings
  sidebarCollapsed: boolean

  setActiveView: (view: ActiveView) => void
  setSelectedProject: (path: string | null) => void
  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  setCommandPaletteOpen: (open: boolean) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  selectedProjectPath: null,
  notifications: [],
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  settings: {
    theme: 'dark',
    accentColor: '#6366f1',
    fontSize: 13,
    animationSpeed: 'normal',
    homeDir: '',
    ignoredPatterns: ['node_modules', '__pycache__', '.git', 'target', 'out', 'dist'],
    scanDepth: 3,
    watchInterval: 1000,
    claudeCliPath: 'claude',
    claudeDefaultFlags: [],
    autoCommit: false,
    gitUserName: '',
    gitUserEmail: '',
    autoPush: false,
    defaultBranch: 'main',
  },

  setActiveView: (view) => set({ activeView: view }),
  setSelectedProject: (path) => set({ selectedProjectPath: path, activeView: path ? 'project' : 'dashboard' }),
  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      timestamp: Date.now(),
      autoDismiss: n.autoDismiss !== false,
    }
    set((state) => ({ notifications: [...state.notifications, notification] }))
  },
  removeNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
