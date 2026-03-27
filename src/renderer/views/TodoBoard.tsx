import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X, CheckSquare, GripVertical, AlertCircle, ChevronDown, Flag, List, LayoutGrid } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useTodoStore, type Todo } from '../store/todoStore'

const COLUMNS: { id: Todo['status']; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: '#475569' },
  { id: 'todo', label: 'To Do', color: '#6366f1' },
  { id: 'in-progress', label: 'In Progress', color: '#06b6d4' },
  { id: 'review', label: 'Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
]

const PRIORITY_COLORS: Record<Todo['priority'], string> = {
  critical: '#f43f5e',
  high: '#f59e0b',
  medium: '#6366f1',
  low: '#475569',
}

function PriorityBadge({ priority }: { priority: Todo['priority'] }): React.ReactElement {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-xs"
      style={{ fontSize: '10px', background: `${PRIORITY_COLORS[priority]}20`, color: PRIORITY_COLORS[priority], border: `1px solid ${PRIORITY_COLORS[priority]}30` }}
    >
      {priority}
    </span>
  )
}

function SubtaskProgress({ todo }: { todo: Todo }): React.ReactElement | null {
  if (!todo.subtasks?.length) return null
  const done = todo.subtasks.filter((s) => s.done).length
  const pct = Math.round((done / todo.subtasks.length) * 100)
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: '10px', color: 'var(--apex-text-muted)' }}>{done}/{todo.subtasks.length} subtasks</span>
        <span style={{ fontSize: '10px', color: 'var(--apex-text-muted)' }}>{pct}%</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 3, background: 'var(--apex-border-subtle)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#10b981', transition: 'width 0.3s ease' }} />
      </div>
    </div>
  )
}

interface TodoCardProps {
  todo: Todo
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
}

function SortableTodoCard({ todo, onEdit, onDelete }: TodoCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      <motion.div
        whileHover={{ scale: 1.01, y: -1 }}
        onClick={() => onEdit(todo)}
        className="rounded-xl p-3 cursor-pointer group"
        style={{ background: 'var(--apex-bg-elevated)', border: '1px solid var(--apex-border-subtle)' }}
      >
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 cursor-grab active:cursor-grabbing shrink-0"
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--apex-text-muted)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={12} />
          </button>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-text-primary)', marginBottom: 4 }}>
              {todo.title}
            </div>
            {todo.description && (
              <div style={{ fontSize: '11px', color: 'var(--apex-text-muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {todo.description}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={todo.priority} />
              {todo.tags?.slice(0, 2).map((tag) => (
                <span key={tag} style={{ fontSize: '10px', color: 'var(--apex-text-muted)', background: 'var(--apex-bg-surface)', padding: '1px 6px', borderRadius: 999 }}>
                  {tag}
                </span>
              ))}
              {todo.dueDate && (
                <span style={{ fontSize: '10px', color: new Date(todo.dueDate) < new Date() ? '#f43f5e' : 'var(--apex-text-muted)' }}>
                  {new Date(todo.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <SubtaskProgress todo={todo} />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(todo.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)', padding: 2 }}
          >
            <X size={12} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}

interface KanbanColumnProps {
  status: Todo['status']
  label: string
  color: string
  todos: Todo[]
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onAddTodo: (status: Todo['status']) => void
}

function KanbanColumn({ status, label, color, todos, onEdit, onDelete, onAddTodo }: KanbanColumnProps): React.ReactElement {
  const todoIds = todos.map((t) => t.id)

  return (
    <div className="flex flex-col rounded-xl overflow-hidden" style={{ minWidth: '240px', flex: 1, background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)' }}>
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid var(--apex-border-subtle)', borderLeft: `3px solid ${color}` }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apex-text-primary)' }}>{label}</span>
          <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px', background: `${color}20`, color }}>
            {todos.length}
          </span>
        </div>
        <button
          onClick={() => onAddTodo(status)}
          className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-white/5 transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)' }}
        >
          <Plus size={12} />
        </button>
      </div>

      <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2 overflow-y-auto flex-1" style={{ minHeight: '100px' }}>
          {todos.map((todo) => (
            <SortableTodoCard key={todo.id} todo={todo} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

interface TodoDetailProps {
  todo: Todo
  onClose: () => void
  onSave: (todo: Todo) => void
}

function TodoDetail({ todo: initialTodo, onClose, onSave }: TodoDetailProps): React.ReactElement {
  const [todo, setTodo] = useState({ ...initialTodo })
  const [subtaskInput, setSubtaskInput] = useState('')

  const addSubtask = () => {
    if (!subtaskInput.trim()) return
    const subtask = { id: `st_${Date.now()}`, title: subtaskInput.trim(), done: false }
    setTodo((t) => ({ ...t, subtasks: [...(t.subtasks || []), subtask] }))
    setSubtaskInput('')
  }

  const toggleSubtask = (id: string) => {
    setTodo((t) => ({ ...t, subtasks: t.subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s) }))
  }

  const priorities: Todo['priority'][] = ['critical', 'high', 'medium', 'low']

  return (
    <>
      <motion.div className="fixed inset-0 z-40" style={{ background: 'rgba(8,8,16,0.7)', backdropFilter: 'blur(4px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="flex flex-col overflow-hidden rounded-2xl"
          style={{ width: '580px', maxHeight: '85vh', background: 'var(--apex-bg-elevated)', border: '1px solid var(--apex-border-default)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--apex-border-subtle)' }}>
            <input
              value={todo.title}
              onChange={(e) => setTodo((t) => ({ ...t, title: e.target.value }))}
              className="flex-1 bg-transparent outline-none font-bold"
              style={{ fontSize: '16px', color: 'var(--apex-text-primary)' }}
              placeholder="Todo title..."
            />
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)' }}>
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Priority */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Flag size={12} color="var(--apex-text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</span>
              </div>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTodo((t) => ({ ...t, priority: p }))}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                      background: todo.priority === p ? `${PRIORITY_COLORS[p]}25` : 'transparent',
                      border: `1px solid ${todo.priority === p ? PRIORITY_COLORS[p] : 'var(--apex-border-default)'}`,
                      color: todo.priority === p ? PRIORITY_COLORS[p] : 'var(--apex-text-muted)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <div style={{ fontSize: '11px', color: 'var(--apex-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Description</div>
              <textarea
                value={todo.description}
                onChange={(e) => setTodo((t) => ({ ...t, description: e.target.value }))}
                placeholder="Add a description..."
                className="w-full rounded-xl outline-none resize-none selectable"
                style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '13px', padding: '10px 12px', minHeight: '80px', fontFamily: 'inherit' }}
              />
            </div>

            {/* Subtasks */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--apex-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Subtasks</div>
              <div className="flex flex-col gap-1.5 mb-3">
                {(todo.subtasks || []).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)' }}>
                    <button
                      onClick={() => toggleSubtask(s.id)}
                      className="shrink-0 flex items-center justify-center w-4 h-4 rounded"
                      style={{ background: s.done ? '#10b981' : 'transparent', border: `2px solid ${s.done ? '#10b981' : 'var(--apex-border-strong)'}`, cursor: 'pointer' }}
                    >
                      {s.done && <span style={{ color: 'white', fontSize: '9px' }}>✓</span>}
                    </button>
                    <span style={{ fontSize: '13px', color: s.done ? 'var(--apex-text-muted)' : 'var(--apex-text-primary)', textDecoration: s.done ? 'line-through' : 'none', flex: 1 }}>
                      {s.title}
                    </span>
                    <button
                      onClick={() => setTodo((t) => ({ ...t, subtasks: t.subtasks.filter((st) => st.id !== s.id) }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-disabled)', padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="Add subtask..."
                  className="flex-1 px-3 py-2 rounded-xl outline-none"
                  style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-primary)', fontSize: '12px' }}
                />
                <button
                  onClick={addSubtask}
                  style={{ padding: '8px 14px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, color: 'var(--apex-accent-primary)', cursor: 'pointer', fontSize: '12px' }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--apex-border-subtle)' }}>
            <button
              onClick={() => onSave(todo)}
              className="flex-1 py-2.5 rounded-xl font-semibold"
              style={{ background: 'var(--apex-accent-primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px' }}
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl"
              style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-default)', color: 'var(--apex-text-secondary)', cursor: 'pointer', fontSize: '13px' }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}

export function TodoBoard(): React.ReactElement {
  const { addNotification } = useAppStore()
  const { todos, setTodos, setLoading } = useTodoStore()
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const loadTodos = async () => {
    setLoading(true)
    try {
      const data = await window.apex.todos.read()
      setTodos(data as Todo[])
    } catch {
      addNotification({ type: 'error', title: 'Failed to load todos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTodos() }, [])

  const saveTodos = async (updated: Todo[]) => {
    await window.apex.todos.write(updated as unknown[])
    setTodos(updated)
  }

  const addTodo = async (status: Todo['status'] = 'todo') => {
    const newTodo: Todo = {
      id: `todo_${Date.now()}`,
      title: 'New Task',
      description: '',
      status,
      priority: 'medium',
      tags: [],
      projectPath: null,
      sessionId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      completedAt: null,
      subtasks: [],
    }
    const updated = [...todos, newTodo]
    await saveTodos(updated)
    setEditingTodo(newTodo)
  }

  const updateTodo = async (updated: Todo) => {
    const newList = todos.map((t) => t.id === updated.id ? updated : t)
    await saveTodos(newList)
    setEditingTodo(null)
    addNotification({ type: 'success', title: 'Todo updated' })
  }

  const deleteTodo = async (id: string) => {
    const updated = todos.filter((t) => t.id !== id)
    await saveTodos(updated)
    addNotification({ type: 'success', title: 'Todo deleted' })
  }

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string)
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over || active.id === over.id) return

    const activeIdx = todos.findIndex((t) => t.id === active.id)
    const overIdx = todos.findIndex((t) => t.id === over.id)

    if (activeIdx !== -1 && overIdx !== -1) {
      const reordered = arrayMove(todos, activeIdx, overIdx)
      // Check if column changed
      const overTodo = todos[overIdx]
      if (todos[activeIdx].status !== overTodo.status) {
        reordered[overIdx] = { ...reordered[overIdx], status: overTodo.status }
      }
      await saveTodos(reordered)
    }
  }

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) : null

  const overdueTodos = todos.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
  const completedThisWeek = todos.filter((t) => {
    if (!t.completedAt) return false
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(t.completedAt) > weekAgo
  }).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col h-full"
      style={{ background: 'var(--apex-bg-base)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--apex-border-subtle)' }}>
        <div className="flex items-center gap-3">
          <CheckSquare size={18} color="var(--apex-accent-primary)" />
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--apex-text-primary)' }}>Todo Board</h1>
          <div className="flex items-center gap-2">
            {overdueTodos > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)' }}>
                <AlertCircle size={11} color="#f43f5e" />
                <span style={{ fontSize: '10px', color: '#f43f5e' }}>{overdueTodos} overdue</span>
              </div>
            )}
            <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)' }}>{completedThisWeek} done this week</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--apex-border-default)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className="flex items-center gap-1.5 px-3 py-1.5 transition-colors"
              style={{ background: viewMode === 'kanban' ? 'rgba(99,102,241,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'kanban' ? 'var(--apex-accent-primary)' : 'var(--apex-text-muted)', fontSize: '12px' }}
            >
              <LayoutGrid size={12} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 transition-colors"
              style={{ background: viewMode === 'list' ? 'rgba(99,102,241,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? 'var(--apex-accent-primary)' : 'var(--apex-text-muted)', fontSize: '12px' }}
            >
              <List size={12} /> List
            </button>
          </div>
          <button
            onClick={() => addTodo()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--apex-accent-primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            <Plus size={14} />
            Add Todo
          </button>
        </div>
      </div>

      {/* Board */}
      {viewMode === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 flex-1 overflow-x-auto p-4" style={{ alignItems: 'flex-start' }}>
            {COLUMNS.map((col) => {
              const colTodos = todos.filter((t) => t.status === col.id)
              return (
                <KanbanColumn
                  key={col.id}
                  status={col.id}
                  label={col.label}
                  color={col.color}
                  todos={colTodos}
                  onEdit={setEditingTodo}
                  onDelete={deleteTodo}
                  onAddTodo={addTodo}
                />
              )
            })}
          </div>
          <DragOverlay>
            {activeTodo && (
              <div className="apex-drag-overlay rounded-xl p-3" style={{ background: 'var(--apex-bg-elevated)', border: '1px solid var(--apex-accent-primary)', width: '240px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apex-text-primary)' }}>{activeTodo.title}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {todos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <CheckSquare size={40} color="var(--apex-text-disabled)" />
              <div style={{ fontSize: '14px', color: 'var(--apex-text-secondary)' }}>No todos yet</div>
              <button onClick={() => addTodo()} className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--apex-accent-primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                <Plus size={14} /> Create First Todo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => setEditingTodo(todo)}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer hover:bg-opacity-80 transition-colors group"
                  style={{ background: 'var(--apex-bg-surface)', border: '1px solid var(--apex-border-subtle)' }}
                >
                  <div className="shrink-0 w-2 h-2 rounded-full" style={{ background: COLUMNS.find((c) => c.id === todo.status)?.color || '#475569' }} />
                  <div style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--apex-text-primary)' }}>{todo.title}</div>
                  <PriorityBadge priority={todo.priority} />
                  <span style={{ fontSize: '11px', color: 'var(--apex-text-muted)', whiteSpace: 'nowrap' }}>
                    {COLUMNS.find((c) => c.id === todo.status)?.label}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apex-text-muted)', padding: 2 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {editingTodo && (
          <TodoDetail todo={editingTodo} onClose={() => setEditingTodo(null)} onSave={updateTodo} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
