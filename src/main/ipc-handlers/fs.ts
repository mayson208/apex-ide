import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import chokidar from 'chokidar'
import type { BrowserWindow } from 'electron'

export interface FsNode {
  name: string
  path: string
  type: 'file' | 'directory'
  hasGit: boolean
  hasPackageJson: boolean
  hasClaudeMd: boolean
  size: number
  lastModified: number
  children?: FsNode[]
}

let watcher: ReturnType<typeof chokidar.watch> | null = null
let watcherWindow: BrowserWindow | null = null

function scanDir(dirPath: string, depth: number, maxDepth: number): FsNode[] {
  if (depth > maxDepth) return []

  let entries: fs.Dirent[] = []
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return []
  }

  const results: FsNode[] = []

  for (const entry of entries) {
    // Skip hidden dirs and common noise
    if (entry.name.startsWith('.') && !entry.name.startsWith('.apex')) continue
    if (['node_modules', '__pycache__', '.git', 'target', 'out', 'dist', 'build'].includes(entry.name)) continue

    const fullPath = path.join(dirPath, entry.name)
    let stat: fs.Stats
    try {
      stat = fs.statSync(fullPath)
    } catch {
      continue
    }

    if (entry.isDirectory()) {
      const children = depth < maxDepth ? scanDir(fullPath, depth + 1, maxDepth) : []
      const dirContents = (() => {
        try { return fs.readdirSync(fullPath) } catch { return [] }
      })()

      results.push({
        name: entry.name,
        path: fullPath,
        type: 'directory',
        hasGit: dirContents.includes('.git'),
        hasPackageJson: dirContents.includes('package.json'),
        hasClaudeMd: dirContents.includes('CLAUDE.md') || dirContents.includes('.claude'),
        size: 0,
        lastModified: stat.mtimeMs,
        children,
      })
    } else if (entry.isFile()) {
      results.push({
        name: entry.name,
        path: fullPath,
        type: 'file',
        hasGit: false,
        hasPackageJson: false,
        hasClaudeMd: false,
        size: stat.size,
        lastModified: stat.mtimeMs,
      })
    }
  }

  return results.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function registerFsHandlers(): void {
  ipcMain.handle('fs:scan-home', async (_event, options?: { depth?: number; rootPath?: string }) => {
    const rootPath = options?.rootPath || app.getPath('home')
    const depth = options?.depth ?? 3
    try {
      return scanDir(rootPath, 0, depth)
    } catch (err) {
      console.error('fs:scan-home error:', err)
      return []
    }
  })

  ipcMain.handle('fs:scan-dir', async (_event, dirPath: string, depth = 2) => {
    try {
      return scanDir(dirPath, 0, depth)
    } catch {
      return []
    }
  })

  ipcMain.handle('fs:read-file', async (_event, filePath: string) => {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      return null
    }
  })

  ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string) => {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('fs:delete-file', async (_event, filePath: string) => {
    try {
      fs.unlinkSync(filePath)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('fs:exists', async (_event, filePath: string) => {
    return fs.existsSync(filePath)
  })

  ipcMain.handle('fs:mkdir', async (_event, dirPath: string) => {
    try {
      fs.mkdirSync(dirPath, { recursive: true })
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('fs:watch', async (_event, watchPath: string) => {
    if (watcher) {
      await watcher.close()
    }
    watcher = chokidar.watch(watchPath, {
      ignored: /(^|[/\\])(\.|node_modules|__pycache__|target|out|dist|build)/,
      persistent: true,
      ignoreInitial: true,
      depth: 3,
    })

    const send = (event: string, filePath: string): void => {
      watcherWindow?.webContents.send('fs:changed', { event, path: filePath, timestamp: Date.now() })
    }

    watcher.on('add', (p) => send('add', p))
    watcher.on('change', (p) => send('change', p))
    watcher.on('unlink', (p) => send('unlink', p))
    watcher.on('addDir', (p) => send('addDir', p))
    watcher.on('unlinkDir', (p) => send('unlinkDir', p))

    return { success: true }
  })

  ipcMain.handle('fs:unwatch', async () => {
    if (watcher) {
      await watcher.close()
      watcher = null
    }
    return { success: true }
  })

  ipcMain.handle('fs:list-dir', async (_event, dirPath: string) => {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      return entries.map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
        path: path.join(dirPath, e.name),
      }))
    } catch {
      return []
    }
  })
}

export function setWatcherWindow(win: BrowserWindow): void {
  watcherWindow = win
}
