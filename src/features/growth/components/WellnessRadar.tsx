import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts'
import { ShieldCheck, Table, BarChart2 } from 'lucide-react'
import { useEnergyLogs } from '../useEnergyLogs'
import { useHabits, useHabitLogs } from '../useHabits'
import { calculateWellnessRadar, RadarDataPoint } from '@/lib/wellnessScore'
import { cn } from '@/lib/utils'

interface WellnessRadarProps {
  selectedDate: string // YYYY-MM-DD
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: RadarDataPoint; value: number }>
}

const CustomRadarTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="card p-2.5 bg-surface-2/95 border border-growth/40 shadow-xl backdrop-blur-md text-xs font-mono">
        <p className="font-semibold text-growth">{data.axis}</p>
        <p className="text-text-muted mt-0.5">
          Score: <span className="text-text font-bold">{data.score}</span> / 100
        </p>
      </div>
    )
  }
  return null
}

export const WellnessRadar: React.FC<WellnessRadarProps> = ({ selectedDate }) => {
  const { data: energyLogs = [] } = useEnergyLogs()
  const { data: habits = [] } = useHabits()
  const { data: habitLogs = [] } = useHabitLogs()

  const [showTableView, setShowTableView] = useState(false)

  const referenceDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedDate])

  // Calculate 5-axis normalized radar points
  const radarData: RadarDataPoint[] = useMemo(() => {
    return calculateWellnessRadar(energyLogs, habits, habitLogs, referenceDateObj)
  }, [energyLogs, habits, habitLogs, referenceDateObj])

  // Overall average score
  const overallScore = useMemo(() => {
    if (radarData.length === 0) return 0
    const sum = radarData.reduce((acc, p) => acc + p.score, 0)
    return Math.round(sum / radarData.length)
  }, [radarData])

  return (
    <div className="card p-5 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-growth" />
            <h2 className="text-base font-semibold text-text">Wellness Radar</h2>
          </div>
          <p className="text-xs text-text-faint mt-1">
            7-day rolling equilibrium across 5 core lifestyle pillars
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Overall score badge */}
          <span className="px-2.5 py-1 rounded-full font-mono text-xs font-bold bg-growth/15 text-growth border border-growth/30 shadow-[0_0_8px_rgba(52,245,164,0.15)]">
            {overallScore}%
          </span>

          {/* Accessible Table View Toggle (SRS §3.7.5) */}
          <button
            type="button"
            onClick={() => setShowTableView(!showTableView)}
            className="p-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 text-text-muted hover:text-text hover:bg-surface transition-colors"
            title={showTableView ? 'Show Chart' : 'Show Data Table (Accessible)'}
            aria-label="Toggle accessible data table view"
          >
            {showTableView ? <BarChart2 className="w-4 h-4" /> : <Table className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Visualization / Data Table */}
      {showTableView ? (
        /* Accessible Table View */
        <div className="overflow-x-auto py-2">
          <table
            className="w-full text-xs text-left border-collapse font-mono"
            aria-label="Wellness radar score table"
          >
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-text-muted">
                <th className="py-2 px-3">Pillar</th>
                <th className="py-2 px-3 text-right">Score</th>
                <th className="py-2 px-3 text-right">Max</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {radarData.map((d) => (
                <tr key={d.axis} className="hover:bg-surface-2/40">
                  <td className="py-2.5 px-3 font-semibold text-text">{d.axis}</td>
                  <td className="py-2.5 px-3 text-right text-growth font-bold">{d.score}</td>
                  <td className="py-2.5 px-3 text-right text-text-faint">100</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-sans font-medium',
                        d.score >= 80
                          ? 'bg-growth/15 text-growth'
                          : d.score >= 60
                          ? 'bg-action/15 text-action'
                          : 'bg-capital/15 text-capital'
                      )}
                    >
                      {d.score >= 80 ? 'Optimal' : d.score >= 60 ? 'Moderate' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Recharts Radar Chart */
        <div className="w-full h-64 sm:h-72 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                type="number"
                tick={{ fill: '#6B6B76', fontSize: 9, fontFamily: 'monospace' }}
                stroke="rgba(255, 255, 255, 0.05)"
              />
              <Tooltip content={<CustomRadarTooltip />} />
              <Radar
                name="Wellness"
                dataKey="score"
                stroke="#34F5A4"
                strokeWidth={2}
                fill="#34F5A4"
                fillOpacity={0.25}
                dot={{
                  r: 3.5,
                  fill: '#34F5A4',
                  stroke: '#0F0F12',
                  strokeWidth: 1.5,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Axis Quick Badges Footer */}
      <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        {radarData.map((d) => (
          <div
            key={d.axis}
            className="p-1.5 rounded-lg bg-surface-2/60 border border-[rgba(255,255,255,0.04)] text-center font-mono"
          >
            <p className="text-[10px] text-text-faint truncate">{d.axis}</p>
            <p className="text-xs font-semibold text-growth mt-0.5">{d.score}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
