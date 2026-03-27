import { create } from 'zustand'
import type { ClaudeProcess } from '../../main/ipc-handlers/process'

export interface ApexSession {
  id: string
  projectPath: string
  projectName: string
  startedAt: string
  endedAt: string | null
  duration: number | null
  gitBranch: string | null
  notes: string
  tags: string[]
}

interface SessionState {
  sessions: ApexSession[]
  claudeProcesses: ClaudeProcess[]
  loading: boolean

  setSessions: (sessions: ApexSession[]) => void
  addSession: (session: ApexSession) => void
  updateSession: (id: string, updates: Partial<ApexSession>) => void
  removeSession: (id: string) => void
  setClaudeProcesses: (processes: ClaudeProcess[]) => void
  setLoading: (loading: boolean) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  claudeProcesses: [],
  loading: false,

  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  removeSession: (id) =>
    set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
  setClaudeProcesses: (processes) => set({ claudeProcesses: processes }),
  setLoading: (loading) => set({ loading }),
}))
