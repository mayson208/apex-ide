import { create } from 'zustand'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Todo {
  id: string
  title: string
  description: string
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'critical' | 'high' | 'medium' | 'low'
  tags: string[]
  projectPath: string | null
  sessionId: string | null
  createdAt: string
  updatedAt: string
  dueDate: string | null
  completedAt: string | null
  subtasks: Subtask[]
}

interface TodoState {
  todos: Todo[]
  loading: boolean
  filterStatus: string | null
  filterPriority: string | null
  filterProject: string | null
  searchQuery: string

  setTodos: (todos: Todo[]) => void
  addTodo: (todo: Todo) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  removeTodo: (id: string) => void
  reorderTodos: (todos: Todo[]) => void
  setLoading: (loading: boolean) => void
  setFilterStatus: (status: string | null) => void
  setFilterPriority: (priority: string | null) => void
  setFilterProject: (project: string | null) => void
  setSearchQuery: (query: string) => void
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  loading: false,
  filterStatus: null,
  filterPriority: null,
  filterProject: null,
  searchQuery: '',

  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [todo, ...state.todos] })),
  updateTodo: (id, updates) =>
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTodo: (id) =>
    set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),
  reorderTodos: (todos) => set({ todos }),
  setLoading: (loading) => set({ loading }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterProject: (project) => set({ filterProject: project }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
