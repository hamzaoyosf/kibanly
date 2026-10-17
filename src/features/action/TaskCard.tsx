import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { Task, Priority, GTDList } from '@/data/ports/schemas'
import { useUpdateTask, useDeleteTask } from './useTasks'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  isOverlay?: boolean
  onEdit?: (task: Task) => void
}

function getPriorityBadge(priority: Priority) {
  switch (priority) {
    case 'high':
      return {
        label: 'High',
        className: 'text-danger bg-danger/10 border-danger/30',
      }
    case 'medium':
      return {
        label: 'Med',
        className: 'text-capital bg-capital/10 border-capital/30',
      }
    case 'low':
      return {
        label: 'Low',
        className: 'text-text-muted bg-surface-2 border-[rgba(255,255,255,0.08)]',
      }
  }
}

function getGTDListBadge(gtdList: GTDList) {
  switch (gtdList) {
    case 'next':
      return { label: 'Next Action', className: 'text-action border-action/30 bg-action/10' }
    case 'scheduled':
      return { label: 'Scheduled', className: 'text-knowledge border-knowledge/30 bg-knowledge/10' }
    case 'waiting':
      return { label: 'Waiting For', className: 'text-capital border-capital/30 bg-capital/10' }
    case 'someday':
      return { label: 'Someday', className: 'text-text-muted border-[rgba(255,255,255,0.08)] bg-surface-2' }
  }
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, isOverlay = false, onEdit }) => {
  const updateMutation = useUpdateTask()
  const deleteMutation = useDeleteTask()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
    disabled: isOverlay,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityMeta = getPriorityBadge(task.priority)
  const gtdMeta = getGTDListBadge(task.gtdList)
  const isDone = task.status === 'done'

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextStatus = isDone ? 'in_progress' : 'done'
    updateMutation.mutate({
      id: task.id,
      patch: {
        status: nextStatus,
        completedAt: nextStatus === 'done' ? new Date().toISOString() : null,
      },
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteMutation.mutate(task.id)
  }

  const completedSubtasks = task.subtasks?.filter((s) => s.done).length || 0
  const totalSubtasks = task.subtasks?.length || 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit?.(task)}
      className={cn(
        'group card p-3.5 relative cursor-grab active:cursor-grabbing select-none',
        'border border-[rgba(255,255,255,0.06)] bg-surface hover:bg-surface-2/60 transition-colors',
        'hover:border-border-strong',
        isDragging && 'opacity-30 border-action/40',
        isOverlay && 'shadow-2xl border-action/50 bg-surface-2 ring-1 ring-action/50 cursor-grabbing rotate-1',
        isDone && 'opacity-60 bg-surface/30'
      )}
      data-hub="action"
    >
      {/* Top Header: Checkbox + Title + Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start space-x-2.5 min-w-0">
          <button
            type="button"
            onClick={handleToggleDone}
            className="mt-0.5 text-text-faint hover:text-action transition-colors shrink-0"
            title={isDone ? 'Mark as in progress' : 'Mark as done'}
          >
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-growth" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>

          <span
            className={cn(
              'text-sm font-medium leading-snug break-words text-text',
              isDone && 'line-through text-text-muted'
            )}
          >
            {task.title}
          </span>
        </div>

        {/* Hover Delete Action */}
        <button
          type="button"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-text-faint hover:text-danger rounded hover:bg-danger/10 transition-opacity"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notes preview */}
      {task.notes && (
        <p className="mt-1.5 ml-6.5 text-xs text-text-muted line-clamp-2 leading-relaxed">
          {task.notes}
        </p>
      )}

      {/* Metadata Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[rgba(255,255,255,0.04)] text-[11px] font-mono">
        {/* GTD List */}
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-chip border text-[10px] font-medium tracking-wide',
            gtdMeta.className
          )}
        >
          {gtdMeta.label}
        </span>

        {/* Priority */}
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-chip border text-[10px] uppercase font-semibold tracking-wider',
            priorityMeta.className
          )}
        >
          {priorityMeta.label}
        </span>

        {/* Estimate */}
        {task.estimateMin && task.estimateMin > 0 ? (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-surface-2 text-text-faint text-[10px]">
            <Clock className="w-3 h-3" />
            <span>{task.estimateMin}m</span>
          </span>
        ) : null}

        {/* Subtask count */}
        {totalSubtasks > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-surface-2 text-text-faint text-[10px]">
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}
      </div>
    </div>
  )
}
