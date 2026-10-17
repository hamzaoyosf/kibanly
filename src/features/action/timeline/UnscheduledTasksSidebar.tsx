import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Clock, GripVertical } from 'lucide-react'
import { Task } from '@/data/ports/schemas'
import { cn } from '@/lib/utils'

interface DraggableSidebarTaskProps {
  task: Task
}

const DraggableSidebarTask: React.FC<DraggableSidebarTaskProps> = ({ task }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'group card p-3 relative cursor-grab active:cursor-grabbing select-none',
        'border border-[rgba(255,255,255,0.06)] bg-surface hover:bg-surface-2/60 transition-colors',
        'hover:border-border-strong flex items-start space-x-2',
        isDragging && 'opacity-30 border-action/40 ring-1 ring-action/40 pointer-events-none'
      )}
    >
      <GripVertical className="w-4 h-4 text-text-faint group-hover:text-action shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text leading-snug truncate">
          {task.title}
        </p>

        <div className="mt-2 flex items-center space-x-1.5 text-[10px] font-mono">
          <span className="px-1.5 py-0.2 rounded bg-surface-2 text-text-faint flex items-center space-x-1">
            <Clock className="w-3 h-3 text-action" />
            <span>{task.estimateMin || 45}m</span>
          </span>

          <span className="px-1.5 py-0.2 rounded border border-[rgba(255,255,255,0.06)] text-text-muted capitalize">
            {task.priority}
          </span>
        </div>
      </div>
    </div>
  )
}

interface UnscheduledTasksSidebarProps {
  tasks: Task[]
}

export const UnscheduledTasksSidebar: React.FC<UnscheduledTasksSidebarProps> = ({ tasks }) => {
  return (
    <div className="card p-4 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col h-full">
      <div className="pb-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Unscheduled Tasks</h2>
          <p className="text-[11px] text-text-faint mt-0.5">
            Drag a task onto the schedule to block time
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full font-mono text-xs font-semibold bg-action/10 text-action">
          {tasks.length}
        </span>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 max-h-[700px] pr-1">
        {tasks.map((task) => (
          <DraggableSidebarTask key={task.id} task={task} />
        ))}

        {tasks.length === 0 && (
          <div className="p-6 text-center text-xs text-text-faint border border-dashed border-[rgba(255,255,255,0.08)] rounded-tile">
            All tasks are scheduled for today!
          </div>
        )}
      </div>
    </div>
  )
}
