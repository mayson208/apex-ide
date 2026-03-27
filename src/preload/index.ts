import { contextBridge, ipcRenderer } from 'electron'

// Expose all IPC channels to renderer via contextBridge
contextBridge.exposeInMainWorld('apex', {
  // Filesystem
  fs: {
    scanHome: (options?: { depth?: number; rootPath?: string }) =>
      ipcRenderer.invoke('fs:scan-home', options),
    scanDir: (dirPath: string, depth?: number) =>
      ipcRenderer.invoke('fs:scan-dir', dirPath, depth),
    readFile: (filePath: string) =>
      ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath: string, content: string) =>
      ipcRenderer.invoke('fs:write-file', filePath, content),
    deleteFile: (filePath: string) =>
      ipcRenderer.invoke('fs:delete-file', filePath),
    exists: (filePath: string) =>
      ipcRenderer.invoke('fs:exists', filePath),
    mkdir: (dirPath: string) =>
      ipcRenderer.invoke('fs:mkdir', dirPath),
    listDir: (dirPath: string) =>
      ipcRenderer.invoke('fs:list-dir', dirPath),
    watch: (watchPath: string) =>
      ipcRenderer.invoke('fs:watch', watchPath),
    unwatch: () =>
      ipcRenderer.invoke('fs:unwatch'),
    onChanged: (callback: (data: { event: string; path: string; timestamp: number }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: unknown) =>
        callback(data as { event: string; path: string; timestamp: number })
      ipcRenderer.on('fs:changed', handler)
      return () => ipcRenderer.removeListener('fs:changed', handler)
    },
  },

  // Process management
  process: {
    detectClaude: () =>
      ipcRenderer.invoke('process:detect-claude'),
    startPolling: () =>
      ipcRenderer.invoke('process:start-polling'),
    stopPolling: () =>
      ipcRenderer.invoke('process:stop-polling'),
    kill: (pid: number) =>
      ipcRenderer.invoke('process:kill', pid),
    onUpdate: (callback: (processes: unknown[]) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: unknown) =>
        callback(data as unknown[])
      ipcRenderer.on('process:update', handler)
      return () => ipcRenderer.removeListener('process:update', handler)
    },
  },

  // PTY / Terminal
  pty: {
    create: (options: { id: string; cwd?: string; cols?: number; rows?: number }) =>
      ipcRenderer.invoke('pty:create', options),
    write: (id: string, data: string) =>
      ipcRenderer.invoke('pty:write', id, data),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.invoke('pty:resize', id, cols, rows),
    kill: (id: string) =>
      ipcRenderer.invoke('pty:kill', id),
    list: () =>
      ipcRenderer.invoke('pty:list'),
    onData: (id: string, callback: (data: string) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: unknown) =>
        callback(data as string)
      ipcRenderer.on(`pty:data:${id}`, handler)
      return () => ipcRenderer.removeListener(`pty:data:${id}`, handler)
    },
    onExit: (id: string, callback: (info: { exitCode: number }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: unknown) =>
        callback(data as { exitCode: number })
      ipcRenderer.on(`pty:exit:${id}`, handler)
      return () => ipcRenderer.removeListener(`pty:exit:${id}`, handler)
    },
  },

  // Sessions
  sessions: {
    list: (projectPath?: string) =>
      ipcRenderer.invoke('sessions:list', projectPath),
    create: (session: unknown) =>
      ipcRenderer.invoke('sessions:create', session),
    update: (id: string, updates: unknown) =>
      ipcRenderer.invoke('sessions:update', id, updates),
    delete: (id: string) =>
      ipcRenderer.invoke('sessions:delete', id),
    get: (id: string) =>
      ipcRenderer.invoke('sessions:get', id),
  },

  // Git
  git: {
    status: (repoPath: string) =>
      ipcRenderer.invoke('git:status', repoPath),
    log: (repoPath: string, count?: number) =>
      ipcRenderer.invoke('git:log', repoPath, count),
    branches: (repoPath: string) =>
      ipcRenderer.invoke('git:branches', repoPath),
    diff: (repoPath: string, file?: string) =>
      ipcRenderer.invoke('git:diff', repoPath, file),
  },

  // Skills
  skills: {
    list: () =>
      ipcRenderer.invoke('skills:list'),
    get: (id: string) =>
      ipcRenderer.invoke('skills:get', id),
    save: (skill: unknown) =>
      ipcRenderer.invoke('skills:save', skill),
    delete: (id: string) =>
      ipcRenderer.invoke('skills:delete', id),
    incrementUsage: (id: string) =>
      ipcRenderer.invoke('skills:increment-usage', id),
  },

  // Todos
  todos: {
    read: () =>
      ipcRenderer.invoke('todos:read'),
    write: (todos: unknown[]) =>
      ipcRenderer.invoke('todos:write', todos),
    create: (todo: unknown) =>
      ipcRenderer.invoke('todos:create', todo),
    update: (id: string, updates: unknown) =>
      ipcRenderer.invoke('todos:update', id, updates),
    delete: (id: string) =>
      ipcRenderer.invoke('todos:delete', id),
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  },
})

// Type declaration for TypeScript
declare global {
  interface Window {
    apex: typeof import('./index')['apex']
  }
}

export const apex = null
