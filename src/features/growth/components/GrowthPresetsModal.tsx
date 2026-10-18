import React, { useState, useEffect } from 'react'
import {
  X,
  Dumbbell,
  Utensils,
  Sparkles,
  Plus,
  Check,
  Trash2,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { GrowthPreset, GrowthPresetCategory } from '../types/presets'
import { useGrowthPresets, useApplyGrowthPreset } from '../useGrowthPresets'
import { cn } from '@/lib/utils'

interface GrowthPresetsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
}

type TabFilter = 'all' | GrowthPresetCategory | 'custom'

export const GrowthPresetsModal: React.FC<GrowthPresetsModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
}) => {
  const { presets, addCustomPreset, deleteCustomPreset } = useGrowthPresets()
  const applyPresetMutation = useApplyGrowthPreset()

  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null)
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null)

  // Custom preset form state
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customCategory, setCustomCategory] = useState<GrowthPresetCategory>('workout')
  const [customDuration, setCustomDuration] = useState<number>(30)
  const [customDetailsText, setCustomDetailsText] = useState('')
  const [customHabitsText, setCustomHabitsText] = useState('')

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredPresets = presets.filter((preset) => {
    if (activeTab === 'all') return true
    if (activeTab === 'custom') return preset.isCustom
    return preset.category === activeTab
  })

  const handleApply = async (preset: GrowthPreset) => {
    try {
      await applyPresetMutation.mutateAsync({ preset, date: selectedDate })
      setAppliedNotification(`Applied "${preset.title}" to ${selectedDate}!`)
      setTimeout(() => setAppliedNotification(null), 3500)
    } catch (err) {
      console.error('Failed to apply preset:', err)
    }
  }

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim()) return

    const details = customDetailsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const targetHabits = customHabitsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    addCustomPreset({
      title: customTitle.trim(),
      description: customDesc.trim() || 'Custom growth routine',
      category: customCategory,
      durationMin: customDuration > 0 ? customDuration : undefined,
      details: details.length > 0 ? details : ['Custom protocol step'],
      targetHabitNames: targetHabits.length > 0 ? targetHabits : ['workout', 'nutrition'],
      energyAuditNote: `Completed custom protocol: ${customTitle.trim()}`,
    })

    // Reset form
    setCustomTitle('')
    setCustomDesc('')
    setCustomDetailsText('')
    setCustomHabitsText('')
    setIsCreatingCustom(false)
    setActiveTab('custom')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-surface border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-growth/10 text-growth border border-growth/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text">Growth Routines & Presets</h2>
              <p className="text-xs text-text-muted">
                One-click apply to <span className="font-mono text-growth font-semibold">{selectedDate}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Applied Notification Banner */}
        {appliedNotification && (
          <div className="px-5 py-2.5 bg-growth/15 border-b border-growth/30 flex items-center space-x-2 text-growth text-xs font-medium animate-fadeIn">
            <Check className="w-4 h-4 shrink-0" />
            <span>{appliedNotification} Habit check-offs and Energy Audit note synced.</span>
          </div>
        )}

        {/* Filter Tabs & New Preset Action */}
        <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)] bg-surface-2/40 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center space-x-1.5">
            {(
              [
                { id: 'all', label: 'All Protocols' },
                { id: 'workout', label: 'Workouts' },
                { id: 'nutrition', label: 'Meal Prep' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setIsCreatingCustom(false)
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  activeTab === tab.id && !isCreatingCustom
                    ? 'bg-white/10 text-text border border-white/20'
                    : 'text-text-muted hover:text-text hover:bg-white/5'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingCustom(!isCreatingCustom)}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all border shrink-0',
              isCreatingCustom
                ? 'bg-growth text-black border-growth'
                : 'bg-growth/10 text-growth border-growth/30 hover:bg-growth/20'
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreatingCustom ? 'Browse Presets' : 'New Preset'}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isCreatingCustom ? (
            /* Custom Preset Creator Form */
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-[rgba(255,255,255,0.06)]">
                <Flame className="w-4 h-4 text-growth" />
                <h3 className="text-sm font-semibold text-text">Design Custom Routine Protocol</h3>
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">
                  Protocol Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Heavy Leg Day & Hamstrings"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text text-sm focus:outline-none focus:border-growth"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as GrowthPresetCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text text-sm focus:outline-none focus:border-growth"
                  >
                    <option value="workout">Workout</option>
                    <option value="nutrition">Nutrition / Meal Prep</option>
                    <option value="recovery">Recovery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">
                    Est. Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text text-sm focus:outline-none focus:border-growth"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">
                  Summary / Objective
                </label>
                <input
                  type="text"
                  placeholder="Brief description of the workout or meal plan"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text text-sm focus:outline-none focus:border-growth"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">
                  Exercise / Meal Steps (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder="Barbell Back Squats: 4x6&#10;Romanian Deadlifts: 3x8&#10;Walking Lunges: 3x12"
                  value={customDetailsText}
                  onChange={(e) => setCustomDetailsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text text-xs font-mono focus:outline-none focus:border-growth resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1 uppercase tracking-wider">
                  Target Habits (Comma-separated to auto check-off)
                </label>
                <input
                  type="text"
                  placeholder="workout, exercise, gym, hydration"
                  value={customHabitsText}
                  onChange={(e) => setCustomHabitsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.08)] text-text text-sm focus:outline-none focus:border-growth"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-growth text-black hover:bg-growth/90 transition-all font-mono"
                >
                  Save Preset
                </button>
              </div>
            </form>
          ) : filteredPresets.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No custom presets yet.</p>
              <button
                onClick={() => setIsCreatingCustom(true)}
                className="mt-3 text-xs font-mono text-growth underline underline-offset-4"
              >
                Create your first routine
              </button>
            </div>
          ) : (
            filteredPresets.map((preset) => {
              const isExpanded = expandedPresetId === preset.id
              const isPending =
                applyPresetMutation.isPending &&
                applyPresetMutation.variables?.preset.id === preset.id

              return (
                <div
                  key={preset.id}
                  className="p-4 rounded-xl bg-surface-2 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] transition-all space-y-3"
                >
                  {/* Top Line */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <span
                        className={cn(
                          'p-2 rounded-xl shrink-0 border',
                          preset.category === 'workout'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : preset.category === 'nutrition'
                              ? 'bg-growth/10 text-growth border-growth/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        )}
                      >
                        {preset.category === 'workout' ? (
                          <Dumbbell className="w-4 h-4" />
                        ) : (
                          <Utensils className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold text-text">{preset.title}</h4>
                          {preset.isCustom && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-text-muted border border-white/10">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{preset.description}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {preset.isCustom && (
                        <button
                          type="button"
                          onClick={() => deleteCustomPreset(preset.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-surface transition-colors"
                          title="Delete custom preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApply(preset)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center space-x-1.5 transition-all border',
                          'bg-growth/15 text-growth border-growth/40 hover:bg-growth hover:text-black',
                          isPending && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isPending ? 'Applying...' : 'Apply'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-text-muted pt-1">
                    <div className="flex items-center space-x-3">
                      {preset.durationMin && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-text-muted" />
                          <span>{preset.durationMin}m</span>
                        </span>
                      )}
                      <span className="capitalize text-text/80">{preset.category}</span>
                      <span>{preset.details.length} items</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedPresetId(isExpanded ? null : preset.id)}
                      className="flex items-center space-x-1 text-text-muted hover:text-text transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Protocol' : 'View Protocol'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Protocol Steps */}
                  {isExpanded && (
                    <div className="p-3 rounded-lg bg-surface/80 border border-[rgba(255,255,255,0.06)] space-y-1.5 text-xs font-mono animate-fadeIn">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-semibold">
                        Routine Breakdown:
                      </div>
                      {preset.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-text/90">
                          <span className="text-growth select-none">•</span>
                          <span>{detail}</span>
                        </div>
                      ))}

                      {preset.targetHabitNames.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center space-x-1.5 text-[11px]">
                          <span className="text-text-muted">Auto-checks habits:</span>
                          <span className="text-growth font-semibold">
                            {preset.targetHabitNames.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[rgba(255,255,255,0.08)] bg-surface-2/30 flex items-center justify-between text-xs text-text-muted">
          <span>Applying a preset updates today's Habit Logs and Energy Audit.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-text-muted hover:text-text bg-surface-2 border border-[rgba(255,255,255,0.06)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
