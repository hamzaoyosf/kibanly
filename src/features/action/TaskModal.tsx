import React, { useState, useEffect } from 'react'
import { X, CheckSquare } from 'lucide-react'
import { Task, TaskStatus, GTDList, EisenhowerQuadrant, Priority } from '@/data/ports/schemas'
import { useCreateTask, useUpdateTask } from './useTasks'
import { cn } from '@/lib/utils'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  taskToEdit?: Task | null
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskToEdit }) => {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TaskStatus>('draft')
  const [gtdList, setGtdList] = useState<GTDList>('next')
  const [quadrant, setQuadrant] = useState<EisenhowerQuadrant>(null)
  const [priority, setPriority] = useState<Priority>('medium')
  const [estimateMin, setEstimateMin] = useState<number>(15)

  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title)
      setNotes(taskToEdit.notes || '')
      setStatus(taskToEdit.status)
      setGtdList(taskToEdit.gtdList)
      setQuadrant(taskToEdit.quadrant)
      setPriority(taskToEdit.priority)
      setEstimateMin(taskToEdit.estimateMin || 15)
    } else {
      setTitle('')
      setNotes('')
      setStatus('draft')
      setGtdList('next')
      setQuadrant(null)
      setPriority('medium')
      setEstimateMin(15)
    }
  }, [taskToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (taskToEdit) {
      updateMutation.mutate({
        id: taskToEdit.id,
        patch: {
          title: title.trim(),
          notes: notes.trim(),
          status,
          gtdList,
          quadrant,
          priority,
          estimateMin,
        },
      })
    } else {
      createMutation.mutate({
        title: title.trim(),
        notes: notes.trim(),
        status,
        gtdList,
        quadrant,
        priority,
        estimateMin,
        dueDate: null,
        context: ['@computer'],
        tags: [],
        projectId: null,
        areaId: null,
        waitingFor: null,
        subtasks: [],
        calendarEventId: null,
        order: 1000,
        completedAt: null,
      })
    }

    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-lg card p-6 bg-surface border border-[rgba(255,255,255,0.12)] shadow-2xl space-y-4"
        data-hub="action"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-action" />
            <h2 className="text-base font-semibold text-text">
              {taskToEdit ? 'Edit Task' : 'Create Task'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-sm text-text focus:outline-none focus:border-action/60"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-sm text-text focus:outline-none focus:border-action/60 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Status */}
            <div>
              <label className="block font-medium text-text-muted mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text focus:outline-none focus:border-action/60"
              >
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* GTD List */}
            <div>
              <label className="block font-medium text-text-muted mb-1">GTD List</label>
              <select
                value={gtdList}
                onChange={(e) => setGtdList(e.target.value as GTDList)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text focus:outline-none focus:border-action/60"
              >
                <option value="next">Next Action</option>
                <option value="scheduled">Scheduled</option>
                <option value="waiting">Waiting For</option>
                <option value="someday">Someday</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block font-medium text-text-muted mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text focus:outline-none focus:border-action/60"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Quadrant */}
            <div>
              <label className="block font-medium text-text-muted mb-1">Quadrant</label>
              <select
                value={quadrant || ''}
                onChange={(e) => setQuadrant((e.target.value as EisenhowerQuadrant) || null)}
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text focus:outline-none focus:border-action/60"
              >
                <option value="">Unassigned</option>
                <option value="do">Q1: Do</option>
                <option value="schedule">Q2: Schedule</option>
                <option value="delegate">Q3: Delegate</option>
                <option value="delete">Q4: Eliminate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Estimate (Minutes)
            </label>
            <input
              type="number"
              min={0}
              step={5}
              value={estimateMin}
              onChange={(e) => setEstimateMin(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-sm text-text focus:outline-none focus:border-action/60 font-mono"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-chip text-xs font-medium text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!title.trim()}
              className={cn(
                'px-4 py-2 rounded-chip text-xs font-semibold bg-action text-black hover:brightness-110 active:scale-95 transition-all shadow-sm',
                !title.trim() && 'opacity-50 cursor-not-allowed'
              )}
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
