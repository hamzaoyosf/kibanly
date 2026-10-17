import React from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, ArrowUpRight, Clock, CheckCircle2, Circle } from 'lucide-react'
import { useTasks, useUpdateTask } from '@/features/action/useTasks'
import { useTimeBlocks } from '@/features/action/useTimeBlocks'
import { Task, TimeBlock } from '@/data/ports/schemas'
import { cn } from '@/lib/utils'

export const ActionWidget: React.FC = () => {
  const { data: tasks = [] } = useTasks()
  const { data: timeBlocks = [] } = useTimeBlocks()
  const updateTaskMutation = useUpdateTask()

  // High leverage active tasks (draft or in_progress, sorted by priority)
  const activeTasks = tasks
    .filter((t: Task) => t.status !== 'done')
    .sort((a: Task, b: Task) => {
      // High before medium before low
      const pOrder: Record<string, number> = { high: 1, medium: 2, low: 3 }
      const qOrder: Record<string, number> = { q1_do: 1, q2_plan: 2, q3_delegate: 3, q4_eliminate: 4 }
      const pDiff = (pOrder[a.priority] || 4) - (pOrder[b.priority] || 4)
      if (pDiff !== 0) return pDiff
      return (qOrder[a.quadrant || ''] || 5) - (qOrder[b.quadrant || ''] || 5)
    })
    .slice(0, 4)

  const completedTodayCount = tasks.filter((t: Task) => t.status === 'done').length

  // Filter timeblocks for today or upcoming
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayBlocks = timeBlocks
    .filter((b: TimeBlock) => b.start.startsWith(todayStr))
    .sort((a: TimeBlock, b: TimeBlock) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3)

  const handleToggleTask = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'draft' : 'done'
    updateTaskMutation.mutate({ id, patch: { status: nextStatus } })
  }

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return ''
    }
  }

  return (
    <div
      className="card p-5 bg-surface border border-[rgba(255,255,255,0.06)] hover:border-action/40 transition-all flex flex-col justify-between space-y-4"
      data-hub="action"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-action/10 text-action shadow-[0_0_12px_rgba(34,211,238,0.2)]">
              <CheckSquare className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-text">Execution & TimeGrid</h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-action/15 text-action font-mono font-medium">
                  {completedTodayCount} done today
                </span>
              </div>
              <p className="text-[11px] text-text-faint font-mono">Action Hub</p>
            </div>
          </div>
          <Link
            to="/action"
            className="p-1.5 rounded-lg text-text-faint hover:text-action hover:bg-surface-2 transition-colors"
            title="Open Action Hub"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Schedule Strip */}
        <div className="mt-3.5 space-y-2">
          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-text-faint">
            <Clock className="w-3.5 h-3.5 text-action" />
            <span>TODAY&apos;S SCHEDULE ({todayBlocks.length})</span>
          </div>

          {todayBlocks.length === 0 ? (
            <div className="p-3 rounded-xl bg-surface-2/40 border border-dashed border-[rgba(255,255,255,0.06)] text-center text-xs text-text-faint font-mono">
              No time blocks scheduled for today.{' '}
              <Link to="/action" className="text-action hover:underline">
                Plan on TimeGrid →
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {todayBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-2/60 border border-[rgba(255,255,255,0.04)] text-xs font-mono"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-action shrink-0" />
                    <span className="text-text font-medium truncate font-sans text-xs">
                      {block.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-faint shrink-0 ml-2">
                    {formatTime(block.start)} - {formatTime(block.end)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High-Leverage Tasks Section */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-faint">
            <span>PRIORITY EXECUTION</span>
            <span>{activeTasks.length} pending</span>
          </div>

          <div className="space-y-1.5">
            {activeTasks.length === 0 ? (
              <p className="p-3 rounded-xl bg-surface-2/30 text-center text-xs text-text-faint font-mono">
                All priority tasks completed. Great velocity!
              </p>
            ) : (
              activeTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t.id, t.status)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2/40 hover:bg-surface-2/80 border border-[rgba(255,255,255,0.04)] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <button
                      type="button"
                      className="text-text-faint group-hover:text-action transition-colors shrink-0"
                    >
                      {t.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-growth" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <span
                      className={cn(
                        'text-xs truncate transition-all',
                        t.status === 'done'
                          ? 'line-through text-text-faint'
                          : 'text-text group-hover:text-white'
                      )}
                    >
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 ml-2 font-mono text-[10px]">
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded font-semibold uppercase',
                        t.priority === 'high'
                          ? 'bg-danger/20 text-danger border border-danger/30'
                          : t.priority === 'medium'
                          ? 'bg-capital/20 text-capital border border-capital/30'
                          : 'bg-surface-2 text-text-faint'
                      )}
                    >
                      {t.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Deep-Link */}
      <div className="pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between text-xs">
        <span className="text-text-faint font-mono text-[11px]">Kanban & Eisenhower</span>
        <Link
          to="/action"
          className="text-action hover:underline font-medium flex items-center space-x-1 text-xs font-mono"
        >
          <span>Open Hub</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
