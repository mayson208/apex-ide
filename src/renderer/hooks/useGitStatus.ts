import { useState, useEffect, useCallback } from 'react'

export interface GitStatus {
  isRepo: boolean
  branch?: string
  ahead?: number
  behind?: number
  staged?: number
  unstaged?: number
  untracked?: number
  lastCommit?: {
    hash: string
    message: string
    date: string
  } | null
}

export function useGitStatus(repoPath: string | null) {
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!repoPath) return
    setLoading(true)
    try {
      const result = await window.apex.git.status(repoPath)
      setStatus(result as GitStatus)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [repoPath])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { status, loading, refresh }
}
