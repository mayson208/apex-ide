import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

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

function getSessionsPath(): string {
  const apexDir = path.join(app.getPath('home'), '.apex')
  fs.mkdirSync(apexDir, { recursive: true })
  return path.join(apexDir, 'sessions.json')
}

function readSessions(): ApexSession[] {
  const filePath = getSessionsPath()
  try {
    if (!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as ApexSession[]
  } catch {
    return []
  }
}

function writeSessions(sessions: ApexSession[]): void {
  const filePath = getSessionsPath()
  fs.writeFileSync(filePath, JSON.stringify(sessions, null, 2), 'utf-8')
}

export function registerSessionHandlers(): void {
  ipcMain.handle('sessions:list', async (_event, projectPath?: string) => {
    const sessions = readSessions()
    if (projectPath) {
      return sessions.filter((s) => s.projectPath === projectPath)
    }
    return sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  })

  ipcMain.handle('sessions:create', async (_event, session: Omit<ApexSession, 'id'>) => {
    const sessions = readSessions()
    const newSession: ApexSession = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    }
    sessions.push(newSession)
    writeSessions(sessions)
    return newSession
  })

  ipcMain.handle('sessions:update', async (_event, id: string, updates: Partial<ApexSession>) => {
    const sessions = readSessions()
    const idx = sessions.findIndex((s) => s.id === id)
    if (idx === -1) return { success: false, error: 'Session not found' }
    sessions[idx] = { ...sessions[idx], ...updates }
    writeSessions(sessions)
    return { success: true, session: sessions[idx] }
  })

  ipcMain.handle('sessions:delete', async (_event, id: string) => {
    const sessions = readSessions()
    const filtered = sessions.filter((s) => s.id !== id)
    writeSessions(filtered)
    return { success: true }
  })

  ipcMain.handle('sessions:get', async (_event, id: string) => {
    const sessions = readSessions()
    return sessions.find((s) => s.id === id) || null
  })
}
