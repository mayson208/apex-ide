import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { BrowserWindow } from 'electron'

const execAsync = promisify(exec)

export interface ClaudeProcess {
  pid: number
  cwd: string
  startedAt: number
  cpuPercent: number
  memoryMB: number
  commandLine: string
}

let pollInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null

async function detectClaudeProcesses(): Promise<ClaudeProcess[]> {
  const processes: ClaudeProcess[] = []

  try {
    if (process.platform === 'win32') {
      // Use PowerShell to get process info on Windows
      const { stdout } = await execAsync(
        `powershell -NoProfile -Command "Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*claude*' } | Select-Object ProcessId, CommandLine, WorkingDirectory, CreationDate | ConvertTo-Json"`,
        { timeout: 5000 }
      )

      if (stdout.trim()) {
        let parsed: unknown
        try { parsed = JSON.parse(stdout.trim()) } catch { parsed = null }
        if (parsed) {
          const arr = Array.isArray(parsed) ? parsed : [parsed]
          for (const item of arr as Record<string, unknown>[]) {
            if (item && typeof item === 'object' && item['CommandLine']) {
              const cmdLine = String(item['CommandLine'] || '')
              // Filter to actual claude CLI processes
              if (cmdLine.includes('claude') && !cmdLine.includes('powershell') && !cmdLine.includes('Get-WmiObject')) {
                processes.push({
                  pid: Number(item['ProcessId']) || 0,
                  cwd: String(item['WorkingDirectory'] || ''),
                  startedAt: Date.now(),
                  cpuPercent: 0,
                  memoryMB: 0,
                  commandLine: cmdLine,
                })
              }
            }
          }
        }
      }
    } else {
      // Mac/Linux
      const { stdout } = await execAsync(
        'ps aux | grep -i claude | grep -v grep | grep -v "ps aux"',
        { timeout: 5000 }
      )
      const lines = stdout.trim().split('\n').filter(Boolean)
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 11) {
          const pid = parseInt(parts[1])
          const cpuPercent = parseFloat(parts[2])
          const memPercent = parseFloat(parts[3])
          const command = parts.slice(10).join(' ')
          if (command.includes('claude')) {
            processes.push({
              pid,
              cwd: '',
              startedAt: Date.now(),
              cpuPercent,
              memoryMB: memPercent * 10, // rough estimate
              commandLine: command,
            })
          }
        }
      }
    }
  } catch {
    // Process detection can fail silently
  }

  return processes
}

export function registerProcessHandlers(win: BrowserWindow | null): void {
  mainWindow = win

  ipcMain.handle('process:detect-claude', async () => {
    return detectClaudeProcesses()
  })

  ipcMain.handle('process:start-polling', () => {
    if (pollInterval) clearInterval(pollInterval)
    pollInterval = setInterval(async () => {
      const processes = await detectClaudeProcesses()
      mainWindow?.webContents.send('process:update', processes)
    }, 3000)
    return { success: true }
  })

  ipcMain.handle('process:stop-polling', () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    return { success: true }
  })

  ipcMain.handle('process:kill', async (_event, pid: number) => {
    try {
      if (process.platform === 'win32') {
        await execAsync(`taskkill /F /PID ${pid}`)
      } else {
        process.kill(pid, 'SIGTERM')
      }
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })
}
