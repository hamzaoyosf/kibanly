import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Activity, Flame, Trophy, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { repos } from '@/data'
import { cn } from '@/lib/utils'

interface DayActivity {
  date: string // YYYY-MM-DD
  dayOfWeek: number // 0 = Sun, 6 = Sat
  score: number
  tasksDone: number
  habitsDone: number
  energyLogged: boolean
  deepWorkMin: number
}

export const ContributionGraph: React.FC = () => {
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const matrixInnerRef = useRef<HTMLDivElement>(null)

  // Query tasks, habit logs, energy logs, and time blocks for the past 365 days
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => repos.tasks.list(),
  })

  const { data: habitLogs = [] } = useQuery({
    queryKey: ['habitLogs', 'all'],
    queryFn: () => repos.habitLogs.list(),
  })

  const { data: energyLogs = [] } = useQuery({
    queryKey: ['energyLogs', 'all'],
    queryFn: () => repos.energyLogs.list(),
  })

  const { data: timeBlocks = [] } = useQuery({
    queryKey: ['timeBlocks', 'all'],
    queryFn: () => repos.timeBlocks.list(),
  })

  // Generate 53 weeks x 7 days ending on today
  const { weeks, stats, monthLabels } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Index daily activity metrics by YYYY-MM-DD
    const activityMap = new Map<string, {
      tasksDone: number
      habitsDone: number
      energyLogged: boolean
      deepWorkMin: number
    }>()

    // 1. Tally completed tasks
    for (const t of tasks) {
      if (t.status === 'done' || t.completedAt) {
        const dateKey = t.completedAt?.slice(0, 10) || t.dueDate || t.updatedAt?.slice(0, 10)
        if (dateKey) {
          const prev = activityMap.get(dateKey) || { tasksDone: 0, habitsDone: 0, energyLogged: false, deepWorkMin: 0 }
          prev.tasksDone += 1
          activityMap.set(dateKey, prev)
        }
      }
    }

    // 2. Tally habit logs
    for (const hl of habitLogs) {
      if (hl.done && hl.date) {
        const prev = activityMap.get(hl.date) || { tasksDone: 0, habitsDone: 0, energyLogged: false, deepWorkMin: 0 }
        prev.habitsDone += 1
        activityMap.set(hl.date, prev)
      }
    }

    // 3. Tally energy logs & deep work
    for (const el of energyLogs) {
      if (el.date) {
        const prev = activityMap.get(el.date) || { tasksDone: 0, habitsDone: 0, energyLogged: false, deepWorkMin: 0 }
        prev.energyLogged = true
        prev.deepWorkMin += el.deepWorkMin || 0
        activityMap.set(el.date, prev)
      }
    }

    // 4. Tally deep work from time blocks
    for (const tb of timeBlocks) {
      if (tb.category === 'deep_work' && tb.start) {
        const dateKey = tb.start.slice(0, 10)
        const prev = activityMap.get(dateKey) || { tasksDone: 0, habitsDone: 0, energyLogged: false, deepWorkMin: 0 }
        const start = new Date(tb.start).getTime()
        const end = new Date(tb.end).getTime()
        const durMin = Math.round((end - start) / (1000 * 60))
        if (durMin > 0 && durMin < 600) {
          prev.deepWorkMin += durMin
        }
        activityMap.set(dateKey, prev)
      }
    }

    // Build the grid of 53 weeks (371 days ending on this week's Saturday)
    // Align grid to week containing today
    const currentDayOfWeek = today.getDay() // 0 = Sun, 6 = Sat
    const gridEnd = new Date(today)
    gridEnd.setDate(gridEnd.getDate() + (6 - currentDayOfWeek)) // end of current week (Saturday)

    const totalDays = 53 * 7
    const gridStart = new Date(gridEnd)
    gridStart.setDate(gridStart.getDate() - totalDays + 1)

    const generatedWeeks: DayActivity[][] = []
    let currentWeek: DayActivity[] = []

    let totalPoints = 0
    let totalActiveDays = 0
    let maxPointsDay: { date: string; score: number } = { date: '', score: 0 }

    const iterDate = new Date(gridStart)
    const monthHeaders: { label: string; weekIndex: number }[] = []
    let lastMonth = -1

    for (let i = 0; i < totalDays; i++) {
      const year = iterDate.getFullYear()
      const month = String(iterDate.getMonth() + 1).padStart(2, '0')
      const day = String(iterDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      const dayOfWeek = iterDate.getDay()
      const weekIdx = Math.floor(i / 7)

      // Record month changes on the first week they appear
      if (iterDate.getMonth() !== lastMonth && dayOfWeek === 0) {
        monthHeaders.push({
          label: iterDate.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex: weekIdx,
        })
        lastMonth = iterDate.getMonth()
      }

      const isFuture = iterDate > today
      const raw = activityMap.get(dateStr) || { tasksDone: 0, habitsDone: 0, energyLogged: false, deepWorkMin: 0 }

      // Score formula
      const score = isFuture
        ? 0
        : raw.tasksDone * 2 + raw.habitsDone + (raw.energyLogged ? 1 : 0) + Math.floor(raw.deepWorkMin / 30)

      if (score > 0) {
        totalPoints += score
        totalActiveDays += 1
        if (score > maxPointsDay.score) {
          maxPointsDay = { date: dateStr, score }
        }
      }

      const dayActivity: DayActivity = {
        date: dateStr,
        dayOfWeek,
        score,
        tasksDone: raw.tasksDone,
        habitsDone: raw.habitsDone,
        energyLogged: raw.energyLogged,
        deepWorkMin: raw.deepWorkMin,
      }

      currentWeek.push(dayActivity)

      if (currentWeek.length === 7) {
        generatedWeeks.push(currentWeek)
        currentWeek = []
      }

      iterDate.setDate(iterDate.getDate() + 1)
    }

    // Calculate current active streak ending today or yesterday
    let streak = 0
    const checkDate = new Date(today)
    while (true) {
      const dStr = checkDate.toISOString().slice(0, 10)
      const act = activityMap.get(dStr)
      const hasAct = act && (act.tasksDone > 0 || act.habitsDone > 0 || act.energyLogged)
      if (hasAct) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        // If today has no activity yet, check yesterday before breaking
        if (dStr === today.toISOString().slice(0, 10)) {
          checkDate.setDate(checkDate.getDate() - 1)
          const yStr = checkDate.toISOString().slice(0, 10)
          const yAct = activityMap.get(yStr)
          if (yAct && (yAct.tasksDone > 0 || yAct.habitsDone > 0 || yAct.energyLogged)) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
            continue
          }
        }
        break
      }
    }

    return {
      weeks: generatedWeeks,
      stats: {
        totalPoints,
        totalActiveDays,
        currentStreak: streak,
        maxScore: maxPointsDay.score,
        bestDate: maxPointsDay.date,
      },
      monthLabels: monthHeaders,
    }
  }, [tasks, habitLogs, energyLogs, timeBlocks])

  // Intensity color mapper
  const getCellClass = (score: number, dateStr: string) => {
    const isToday = dateStr === new Date().toISOString().slice(0, 10)
    const ring = isToday ? 'ring-1 ring-emerald-400 ring-offset-1 ring-offset-gray-900' : ''

    if (score === 0) return cn('bg-gray-800/90 hover:bg-gray-700/80 border border-gray-700/40', ring)
    if (score <= 2) return cn('bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-900/60', ring)
    if (score <= 5) return cn('bg-emerald-800 hover:bg-emerald-700 border border-emerald-700/60', ring)
    if (score <= 9) return cn('bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/60', ring)
    return cn('bg-emerald-400 hover:bg-emerald-300 border border-emerald-300/80', ring)
  }

  const handleMouseEnter = (e: React.MouseEvent, day: DayActivity) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPopoverPos({ x: rect.left + rect.width / 2, y: rect.top })
    setHoveredDay(day)
  }

  const handleMouseLeave = () => {
    setHoveredDay(null)
    setPopoverPos(null)
  }

  // Auto-scroll to far right on mount so most recent days / current month are visible immediately
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    let userInteracted = false
    const handleUserScroll = () => {
      userInteracted = true
    }
    el.addEventListener('pointerdown', handleUserScroll, { passive: true })
    el.addEventListener('touchstart', handleUserScroll, { passive: true })

    const scrollToFarRight = () => {
      if (!el || userInteracted) return
      if (el.scrollWidth > el.clientWidth) {
        el.scrollLeft = el.scrollWidth
      }
    }

    scrollToFarRight()
    const raf1 = requestAnimationFrame(scrollToFarRight)
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(scrollToFarRight))
    const t1 = setTimeout(scrollToFarRight, 50)
    const t2 = setTimeout(scrollToFarRight, 150)
    const t3 = setTimeout(scrollToFarRight, 300)
    const t4 = setTimeout(scrollToFarRight, 600)

    // ResizeObserver watches both container and inner element to trigger as soon as layout dimensions expand
    const resizeObserver = new ResizeObserver(() => {
      scrollToFarRight()
    })
    resizeObserver.observe(el)
    if (matrixInnerRef.current) {
      resizeObserver.observe(matrixInnerRef.current)
    }

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      el.removeEventListener('pointerdown', handleUserScroll)
      el.removeEventListener('touchstart', handleUserScroll)
      resizeObserver.disconnect()
    }
  }, [weeks])

  return (
    <div className="card p-5 relative overflow-hidden" data-hub="action">
      {/* Top Header & Metrics Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 rounded-lg bg-surface-2 text-emerald-400 border border-border">
            <Activity className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-text">Annual Contribution & Output Graph</h3>
            <p className="text-xs text-text-muted">
              Consolidated 365-day execution velocity across Tasks, Habits, Energy, and Deep Work
            </p>
          </div>
        </div>

        {/* Micro-metrics */}
        <div className="flex items-center space-x-3 text-xs font-mono self-start sm:self-auto">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-border">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-text-muted">Streak:</span>
            <span className="text-emerald-400 font-semibold">{stats.currentStreak}d</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-border">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-text-muted">Active:</span>
            <span className="text-text font-semibold">{stats.totalActiveDays}d</span>
          </div>
        </div>
      </div>

      {/* 365-Day Matrix (Scrollable horizontally on smaller screens, sticky day labels) */}
      <div
        ref={scrollContainerRef}
        className="pt-4 overflow-x-auto pb-1 hide-scrollbar relative scroll-auto"
      >
        <div ref={matrixInnerRef} className="min-w-[780px] inline-flex flex-col">
          {/* Month labels */}
          <div className="flex items-center text-[10px] font-mono text-text-muted mb-1 relative">
            <div className="sticky left-0 z-20 bg-surface w-7 shrink-0" aria-hidden="true" />
            <div className="relative flex">
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  style={{
                    marginLeft:
                      idx === 0
                        ? `${m.weekIndex * 14}px`
                        : `${(m.weekIndex - monthLabels[idx - 1].weekIndex - 2) * 14}px`,
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Grid with Day of Week labels sticky on left */}
          <div className="flex items-start relative">
            {/* Day labels column (Sun, Tue, Thu, Sat) - sticky left */}
            <div className="sticky left-0 z-20 bg-surface flex flex-col justify-between text-[9px] font-mono text-text-faint h-[98px] pr-2 select-none w-7 shrink-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.5)]">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={handleMouseLeave}
                      className={cn(
                        'w-[11px] h-[11px] rounded-[2px] transition-colors cursor-pointer',
                        getCellClass(day.score, day.date)
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Explanatory note & GitHub Legend */}
      <div className="pt-3.5 mt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-text-faint" />
          <span className="text-[11px]">
            {stats.totalPoints} total output points recorded over the past year
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-1.5 text-[10px] font-mono select-none">
          <span className="text-text-faint mr-1">Less</span>
          <span className="w-2.5 h-2.5 rounded-[2px] bg-gray-800 border border-gray-700/50" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-950 border border-emerald-900/60" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-800 border border-emerald-700/60" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 border border-emerald-500/60" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300/80" />
          <span className="text-text-faint ml-1">More</span>
        </div>
      </div>

      {/* Floating Interactive Hover Tooltip */}
      {hoveredDay && popoverPos && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 rounded-lg bg-gray-950 border border-border text-xs text-text shadow-xl animate-fadeIn whitespace-nowrap"
          style={{ left: `${popoverPos.x}px`, top: `${popoverPos.y - 8}px` }}
        >
          <div className="font-semibold text-text-primary text-[11px]">
            {new Date(hoveredDay.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="font-mono text-emerald-400 text-xs mt-0.5 font-bold">
            {hoveredDay.score === 0 ? 'No activity recorded' : `${hoveredDay.score} activity points`}
          </div>
          {hoveredDay.score > 0 && (
            <div className="text-[10px] text-text-muted mt-1 space-y-0.5 font-mono">
              {hoveredDay.tasksDone > 0 && <div>• {hoveredDay.tasksDone} tasks completed</div>}
              {hoveredDay.habitsDone > 0 && <div>• {hoveredDay.habitsDone} daily habits logged</div>}
              {hoveredDay.deepWorkMin > 0 && <div>• {hoveredDay.deepWorkMin}m deep work interval</div>}
              {hoveredDay.energyLogged && <div>• Energy audit submitted</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
