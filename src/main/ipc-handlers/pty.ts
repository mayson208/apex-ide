import { ipcMain } from 'electron'
import * as pty from 'node-pty'
import type { BrowserWindow } from 'electron'
import type { IPty } from 'node-pty'

interface PtySession {
  pty: IPty
  id: string
}

const ptyMap = new Map<string, PtySession>()
let ptyWindow: BrowserWindow | null = null

function getShell(): string {
  if (process.platform === 'win32') {
    return 'powershell.exe'
  }
  return process.env.SHELL || '/bin/bash'
}

function getShellArgs(): string[] {
  if (process.platform === 'win32') {
    return []
  }
  return []
}

export function registerPtyHandlers(win: BrowserWindow | null): void {
  ptyWindow = win

  ipcMain.handle('pty:create', (_event, options: { id: string; cwd?: string; cols?: number; rows?: number }) => {
    const { id, cwd, cols = 80, rows = 24 } = options

    // Kill existing pty with same id
    if (ptyMap.has(id)) {
      try { ptyMap.get(id)!.pty.kill() } catch {}
      ptyMap.delete(id)
    }

    try {
      const shell = getShell()
      const args = getShellArgs()
      const env = { ...process.env } as Record<string, string>

      const ptyProcess = pty.spawn(shell, args, {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: cwd || process.env.HOME || process.cwd(),
        env,
      })

      ptyProcess.onData((data) => {
        ptyWindow?.webContents.send(`pty:data:${id}`, data)
      })

      ptyProcess.onExit(({ exitCode }) => {
        ptyWindow?.webContents.send(`pty:exit:${id}`, { exitCode })
        ptyMap.delete(id)
      })

      ptyMap.set(id, { pty: ptyProcess, id })
      return { success: true, pid: ptyProcess.pid }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('pty:write', (_event, id: string, data: string) => {
    const session = ptyMap.get(id)
    if (!session) return { success: false, error: 'PTY not found' }
    try {
      session.pty.write(data)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('pty:resize', (_event, id: string, cols: number, rows: number) => {
    const session = ptyMap.get(id)
    if (!session) return { success: false, error: 'PTY not found' }
    try {
      session.pty.resize(cols, rows)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('pty:kill', (_event, id: string) => {
    const session = ptyMap.get(id)
    if (!session) return { success: false, error: 'PTY not found' }
    try {
      session.pty.kill()
      ptyMap.delete(id)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('pty:list', () => {
    return Array.from(ptyMap.keys())
  })
}
