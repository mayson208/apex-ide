import { create } from 'zustand'

export interface Project {
  name: string
  path: string
  hasGit: boolean
  hasPackageJson: boolean
  hasClaudeMd: boolean
  lastModified: number
  lastOpened: number | null
  gitBranch: string | null
  lastCommit: string | null
  languages: string[]
  fileCount: number
  isActive: boolean
  activePid: number | null
}

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

interface ProjectState {
  projects: Project[]
  fsTree: FsNode[]
  loading: boolean
  fsLoading: boolean
  fsEvents: Array<{ event: string; path: string; timestamp: number }>

  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (path: string, updates: Partial<Project>) => void
  setFsTree: (tree: FsNode[]) => void
  setLoading: (loading: boolean) => void
  setFsLoading: (loading: boolean) => void
  addFsEvent: (event: { event: string; path: string; timestamp: number }) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  fsTree: [],
  loading: false,
  fsLoading: false,
  fsEvents: [],

  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({
      projects: state.projects.some((p) => p.path === project.path)
        ? state.projects.map((p) => (p.path === project.path ? project : p))
        : [...state.projects, project],
    })),
  updateProject: (path, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.path === path ? { ...p, ...updates } : p
      ),
    })),
  setFsTree: (tree) => set({ fsTree: tree }),
  setLoading: (loading) => set({ loading }),
  setFsLoading: (loading) => set({ fsLoading: loading }),
  addFsEvent: (event) =>
    set((state) => ({
      fsEvents: [event, ...state.fsEvents].slice(0, 100),
    })),
}))
