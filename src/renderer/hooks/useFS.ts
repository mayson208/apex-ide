import { useEffect, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useAppStore } from '../store/appStore'
import type { FsNode } from '../store/projectStore'

declare global {
  interface Window {
    apex: {
      fs: {
        scanHome: (options?: { depth?: number; rootPath?: string }) => Promise<FsNode[]>
        scanDir: (dirPath: string, depth?: number) => Promise<FsNode[]>
        readFile: (filePath: string) => Promise<string | null>
        writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
        deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
        exists: (filePath: string) => Promise<boolean>
        mkdir: (dirPath: string) => Promise<{ success: boolean; error?: string }>
        listDir: (dirPath: string) => Promise<Array<{ name: string; type: string; path: string }>>
        watch: (watchPath: string) => Promise<{ success: boolean }>
        unwatch: () => Promise<{ success: boolean }>
        onChanged: (callback: (data: { event: string; path: string; timestamp: number }) => void) => () => void
      }
      process: {
        detectClaude: () => Promise<unknown[]>
        startPolling: () => Promise<{ success: boolean }>
        stopPolling: () => Promise<{ success: boolean }>
        kill: (pid: number) => Promise<{ success: boolean; error?: string }>
        onUpdate: (callback: (processes: unknown[]) => void) => () => void
      }
      pty: {
        create: (options: { id: string; cwd?: string; cols?: number; rows?: number }) => Promise<{ success: boolean; pid?: number; error?: string }>
        write: (id: string, data: string) => Promise<{ success: boolean; error?: string }>
        resize: (id: string, cols: number, rows: number) => Promise<{ success: boolean; error?: string }>
        kill: (id: string) => Promise<{ success: boolean; error?: string }>
        list: () => Promise<string[]>
        onData: (id: string, callback: (data: string) => void) => () => void
        onExit: (id: string, callback: (info: { exitCode: number }) => void) => () => void
      }
      sessions: {
        list: (projectPath?: string) => Promise<unknown[]>
        create: (session: unknown) => Promise<unknown>
        update: (id: string, updates: unknown) => Promise<unknown>
        delete: (id: string) => Promise<{ success: boolean }>
        get: (id: string) => Promise<unknown>
      }
      git: {
        status: (repoPath: string) => Promise<unknown>
        log: (repoPath: string, count?: number) => Promise<unknown[]>
        branches: (repoPath: string) => Promise<unknown>
        diff: (repoPath: string, file?: string) => Promise<string>
      }
      skills: {
        list: () => Promise<unknown[]>
        get: (id: string) => Promise<unknown>
        save: (skill: unknown) => Promise<{ success: boolean; id: string; filePath: string }>
        delete: (id: string) => Promise<{ success: boolean; error?: string }>
        incrementUsage: (id: string) => Promise<{ success: boolean }>
      }
      todos: {
        read: () => Promise<unknown[]>
        write: (todos: unknown[]) => Promise<{ success: boolean }>
        create: (todo: unknown) => Promise<unknown>
        update: (id: string, updates: unknown) => Promise<unknown>
        delete: (id: string) => Promise<{ success: boolean }>
      }
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        isMaximized: () => Promise<boolean>
      }
    }
  }
}

export function useFS() {
  const { setFsTree, setFsLoading, addFsEvent } = useProjectStore()
  const { addNotification } = useAppStore()

  const scanHome = useCallback(async (depth = 3) => {
    setFsLoading(true)
    try {
      const tree = await window.apex.fs.scanHome({ depth })
      setFsTree(tree)
      return tree
    } catch (err) {
      addNotification({ type: 'error', title: 'Scan failed', message: String(err) })
      return []
    } finally {
      setFsLoading(false)
    }
  }, [setFsTree, setFsLoading, addNotification])

  useEffect(() => {
    const unsub = window.apex.fs.onChanged((data) => {
      addFsEvent(data)
    })
    return unsub
  }, [addFsEvent])

  return { scanHome }
}
