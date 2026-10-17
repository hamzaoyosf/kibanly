import React, { useState, useEffect } from 'react'
import { Activity, Moon, Check, Dumbbell, Zap } from 'lucide-react'
import { useEnergyLogByDate, useSaveEnergyLog } from '../useEnergyLogs'
import { cn } from '@/lib/utils'

interface EnergyAuditCardProps {
  selectedDate: string // YYYY-MM-DD
}

const RATING_SCALE = [
  { value: 1, label: '1 - Low' },
  { value: 2, label: '2 - Fair' },
  { value: 3, label: '3 - Moderate' },
  { value: 4, label: '4 - High' },
  { value: 5, label: '5 - Peak' },
]

const SLEEP_PRESETS = [6.0, 7.0, 7.5, 8.0, 8.5]

export const EnergyAuditCard: React.FC<EnergyAuditCardProps> = ({ selectedDate }) => {
  const { log: existingLog, isLoading } = useEnergyLogByDate(selectedDate)
  const saveMutation = useSaveEnergyLog()

  const [energy, setEnergy] = useState<number>(4)
  const [mood, setMood] = useState<number>(4)
  const [focus, setFocus] = useState<number>(4)
  const [sleepHours, setSleepHours] = useState<number>(7.5)
  const [workoutDone, setWorkoutDone] = useState<boolean>(false)
  const [note, setNote] = useState<string>('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Populate form with existing log data if present
  useEffect(() => {
    if (existingLog) {
      setEnergy(existingLog.energy)
      setMood(existingLog.mood)
      setFocus(existingLog.focus)
      setSleepHours(existingLog.sleepHours)
      setWorkoutDone(existingLog.workoutDone)
      setNote(existingLog.note || '')
    } else {
      // Default reset for new day
      setEnergy(4)
      setMood(4)
      setFocus(4)
      setSleepHours(7.5)
      setWorkoutDone(false)
      setNote('')
    }
    setSavedSuccess(false)
  }, [existingLog, selectedDate])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(
      {
        date: selectedDate,
        energy,
        mood,
        focus,
        sleepHours,
        workoutDone,
        tasksCompleted: existingLog?.tasksCompleted || 0,
        deepWorkMin: existingLog?.deepWorkMin || 0,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          setSavedSuccess(true)
          setTimeout(() => setSavedSuccess(false), 2500)
        },
      }
    )
  }

  return (
    <div className="card p-5 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-growth" />
            <h2 className="text-base font-semibold text-text">Daily Energy Audit</h2>
          </div>
          <p className="text-xs text-text-faint mt-1">
            30-second check-in (FR-ENG-01: edits overwrite for selected date)
          </p>
        </div>

        {existingLog && (
          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] text-growth bg-growth/10 border border-growth/20">
            Recorded
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-48 rounded-xl animate-pulse bg-surface-2/40" />
      ) : (
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Energy (1 - 5) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-text-muted flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-action" />
                <span>Energy Level</span>
              </span>
              <span className="font-mono text-action font-semibold">{energy} / 5</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {RATING_SCALE.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setEnergy(r.value)}
                  className={cn(
                    'py-2 rounded-lg font-mono text-xs font-medium transition-all border',
                    energy === r.value
                      ? 'bg-action/20 text-action border-action/60 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                      : 'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.06)] hover:text-text'
                  )}
                >
                  {r.value}
                </button>
              ))}
            </div>
          </div>

          {/* Mood (1 - 5) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-text-muted">Mood & Outlook</span>
              <span className="font-mono text-growth font-semibold">{mood} / 5</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {RATING_SCALE.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setMood(r.value)}
                  className={cn(
                    'py-2 rounded-lg font-mono text-xs font-medium transition-all border',
                    mood === r.value
                      ? 'bg-growth/20 text-growth border-growth/60 shadow-[0_0_10px_rgba(52,245,164,0.2)]'
                      : 'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.06)] hover:text-text'
                  )}
                >
                  {r.value}
                </button>
              ))}
            </div>
          </div>

          {/* Focus (1 - 5) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-text-muted">Focus & Mental Clarity</span>
              <span className="font-mono text-capital font-semibold">{focus} / 5</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {RATING_SCALE.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setFocus(r.value)}
                  className={cn(
                    'py-2 rounded-lg font-mono text-xs font-medium transition-all border',
                    focus === r.value
                      ? 'bg-capital/20 text-capital border-capital/60 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                      : 'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.06)] hover:text-text'
                  )}
                >
                  {r.value}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-text-muted flex items-center space-x-1">
                <Moon className="w-3.5 h-3.5 text-knowledge" />
                <span>Sleep Duration</span>
              </span>
              <span className="font-mono text-knowledge font-semibold">{sleepHours} hrs</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-24 px-3 py-1.5 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] font-mono text-text focus:outline-none focus:border-growth/60 text-xs"
              />

              {/* Preset buttons */}
              <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
                {SLEEP_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSleepHours(p)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-[11px] font-mono border transition-all',
                      sleepHours === p
                        ? 'bg-knowledge/20 text-knowledge border-knowledge/50'
                        : 'bg-surface-2 text-text-muted border-[rgba(255,255,255,0.06)] hover:text-text'
                    )}
                  >
                    {p}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Workout Completed Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2/60 border border-[rgba(255,255,255,0.06)]">
            <span className="font-medium text-text flex items-center space-x-2">
              <Dumbbell className="w-4 h-4 text-growth" />
              <span>Workout Completed Today</span>
            </span>
            <button
              type="button"
              onClick={() => setWorkoutDone(!workoutDone)}
              className={cn(
                'w-10 h-6 rounded-full transition-colors relative p-0.5 border',
                workoutDone
                  ? 'bg-growth border-growth'
                  : 'bg-surface border-[rgba(255,255,255,0.1)]'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full transition-transform',
                  workoutDone ? 'translate-x-4 bg-black' : 'translate-x-0 bg-text-muted'
                )}
              />
            </button>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block font-medium text-text-muted mb-1">Daily Reflection / Note</label>
            <input
              type="text"
              placeholder="e.g. Clean flow state in morning, rested well..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text text-xs focus:outline-none focus:border-growth/60 placeholder:text-text-faint"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-mono text-text-faint">
              {savedSuccess ? (
                <span className="text-growth flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Audit Saved!</span>
                </span>
              ) : existingLog ? (
                'Last saved: Today'
              ) : (
                'Pending check-in'
              )}
            </span>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className={cn(
                'flex items-center space-x-1.5 px-4 py-2 rounded-chip font-semibold text-xs transition-all shadow-md',
                savedSuccess
                  ? 'bg-growth/20 text-growth border border-growth/40'
                  : 'bg-growth text-black hover:brightness-110 active:scale-95'
              )}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{savedSuccess ? 'Saved' : 'Save Energy Audit'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
