import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

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
  subtasks: { id: string; title: string; done: boolean }[]
}

function getTodosPath(): string {
  const apexDir = path.join(app.getPath('home'), '.apex')
  fs.mkdirSync(apexDir, { recursive: true })
  return path.join(apexDir, 'todos.json')
}

function readTodos(): Todo[] {
  const filePath = getTodosPath()
  try {
    if (!fs.existsSync(filePath)) return []
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Todo[]
  } catch {
    return []
  }
}

function writeTodos(todos: Todo[]): void {
  fs.writeFileSync(getTodosPath(), JSON.stringify(todos, null, 2), 'utf-8')
}

export function registerTodosHandlers(): void {
  ipcMain.handle('todos:read', async () => {
    return readTodos()
  })

  ipcMain.handle('todos:write', async (_event, todos: Todo[]) => {
    writeTodos(todos)
    return { success: true }
  })

  ipcMain.handle('todos:create', async (_event, todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    const todos = readTodos()
    const newTodo: Todo = {
      ...todo,
      id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    todos.push(newTodo)
    writeTodos(todos)
    return newTodo
  })

  ipcMain.handle('todos:update', async (_event, id: string, updates: Partial<Todo>) => {
    const todos = readTodos()
    const idx = todos.findIndex((t) => t.id === id)
    if (idx === -1) return { success: false, error: 'Todo not found' }
    todos[idx] = { ...todos[idx], ...updates, updatedAt: new Date().toISOString() }
    if (updates.status === 'done' && !todos[idx].completedAt) {
      todos[idx].completedAt = new Date().toISOString()
    }
    writeTodos(todos)
    return { success: true, todo: todos[idx] }
  })

  ipcMain.handle('todos:delete', async (_event, id: string) => {
    const todos = readTodos()
    writeTodos(todos.filter((t) => t.id !== id))
    return { success: true }
  })
}
