import React from 'react'
import { FileText, Zap, CheckCircle2 } from 'lucide-react'
import { Task } from '@/data/ports/schemas'
import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  tasks: Task[]
  onEditTask?: (task: Task) => void
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onEditTask }) => {
  const draftTasks = tasks.filter((t) => t.status === 'draft')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const doneTasks = tasks.filter((t) => t.status === 'done')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
      <KanbanColumn
        id="draft"
        title="Draft"
        icon={<FileText className="w-4 h-4" />}
        accentColor="var(--text-muted)"
        tasks={draftTasks}
        onEditTask={onEditTask}
      />

      <KanbanColumn
        id="in_progress"
        title="In Progress"
        icon={<Zap className="w-4 h-4" />}
        accentColor="var(--action)"
        tasks={inProgressTasks}
        onEditTask={onEditTask}
      />

      <KanbanColumn
        id="done"
        title="Done"
        icon={<CheckCircle2 className="w-4 h-4" />}
        accentColor="var(--growth)"
        tasks={doneTasks}
        onEditTask={onEditTask}
      />
    </div>
  )
}
