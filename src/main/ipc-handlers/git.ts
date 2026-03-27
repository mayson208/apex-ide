import { ipcMain } from 'electron'
import simpleGit from 'simple-git'
import * as fs from 'fs'
import * as path from 'path'

function isGitRepo(dirPath: string): boolean {
  try {
    return fs.existsSync(path.join(dirPath, '.git'))
  } catch {
    return false
  }
}

export function registerGitHandlers(): void {
  ipcMain.handle('git:status', async (_event, repoPath: string) => {
    if (!isGitRepo(repoPath)) {
      return { isRepo: false }
    }
    try {
      const git = simpleGit(repoPath)
      const [status, log] = await Promise.all([
        git.status(),
        git.log({ maxCount: 1 }).catch(() => ({ latest: null })),
      ])

      return {
        isRepo: true,
        branch: status.current || 'HEAD',
        ahead: status.ahead,
        behind: status.behind,
        staged: status.staged.length,
        unstaged: status.modified.length + status.deleted.length,
        untracked: status.not_added.length,
        lastCommit: (log as { latest: { hash?: string; message?: string; date?: string } | null }).latest
          ? {
              hash: (log as { latest: { hash?: string; message?: string; date?: string } }).latest?.hash?.slice(0, 7),
              message: (log as { latest: { hash?: string; message?: string; date?: string } }).latest?.message,
              date: (log as { latest: { hash?: string; message?: string; date?: string } }).latest?.date,
            }
          : null,
        files: {
          staged: status.staged,
          modified: status.modified,
          deleted: status.deleted,
          untracked: status.not_added,
        },
      }
    } catch (err) {
      return { isRepo: false, error: String(err) }
    }
  })

  ipcMain.handle('git:log', async (_event, repoPath: string, count = 20) => {
    if (!isGitRepo(repoPath)) return []
    try {
      const git = simpleGit(repoPath)
      const log = await git.log({ maxCount: count })
      return log.all.map((c) => ({
        hash: c.hash.slice(0, 7),
        fullHash: c.hash,
        message: c.message,
        author: c.author_name,
        date: c.date,
        refs: c.refs,
      }))
    } catch {
      return []
    }
  })

  ipcMain.handle('git:branches', async (_event, repoPath: string) => {
    if (!isGitRepo(repoPath)) return { current: null, branches: [] }
    try {
      const git = simpleGit(repoPath)
      const branches = await git.branchLocal()
      return {
        current: branches.current,
        branches: branches.all,
      }
    } catch {
      return { current: null, branches: [] }
    }
  })

  ipcMain.handle('git:diff', async (_event, repoPath: string, file?: string) => {
    if (!isGitRepo(repoPath)) return ''
    try {
      const git = simpleGit(repoPath)
      if (file) {
        return git.diff([file])
      }
      return git.diff()
    } catch {
      return ''
    }
  })
}
