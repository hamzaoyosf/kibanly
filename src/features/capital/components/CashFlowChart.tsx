import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { LineChart as ChartIcon, Table, BarChart2 } from 'lucide-react'
import { Transaction, TransactionScope } from '@/data/ports/schemas'
import { cn } from '@/lib/utils'

interface CashFlowChartProps {
  transactions: Transaction[]
  selectedScope: 'all' | TransactionScope
}

interface CashFlowDataPoint {
  date: string // MM/DD
  fullDate: string
  income: number
  expense: number
  net: number
}

const CustomCashFlowTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length && payload[0]?.payload) {
    const data: CashFlowDataPoint = payload[0].payload
    return (
      <div className="card p-2.5 bg-surface-2/95 border border-capital/40 shadow-xl backdrop-blur-md text-xs font-mono space-y-1">
        <p className="font-semibold text-text">{data.fullDate || 'Date'}</p>
        <p className="text-growth flex justify-between space-x-3">
          <span>Inflow:</span>
          <span>${(data.income ?? 0).toFixed(2)}</span>
        </p>
        <p className="text-danger flex justify-between space-x-3">
          <span>Outflow:</span>
          <span>${(data.expense ?? 0).toFixed(2)}</span>
        </p>
        <div className="border-t border-[rgba(255,255,255,0.08)] pt-1 flex justify-between space-x-3 text-text font-bold">
          <span>Net:</span>
          <span className={(data.net ?? 0) >= 0 ? 'text-capital' : 'text-danger'}>
            ${(data.net ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  transactions,
  selectedScope,
}) => {
  const [showTableView, setShowTableView] = useState(false)

  // Filter transactions by selected scope (case-insensitive & defensively handled)
  const filtered = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return []
    const targetScope = (selectedScope || 'all').toLowerCase()
    if (targetScope === 'all') return transactions

    // If transactions were already filtered to target scope by parent hook, keep them all
    const allMatchTarget = transactions.every(
      (t) => (t.scope || 'business').toLowerCase() === targetScope
    )
    if (allMatchTarget) return transactions

    return transactions.filter(
      (t) => (t.scope || 'business').toLowerCase() === targetScope
    )
  }, [transactions, selectedScope])

  // Aggregate daily transactions into sorted timeline series
  const chartData: CashFlowDataPoint[] = useMemo(() => {
    if (!filtered || filtered.length === 0) return []

    const map = new Map<string, { incomeMinor: number; expenseMinor: number }>()

    filtered.forEach((t) => {
      const dateKey = t.date || new Date().toISOString().slice(0, 10)
      if (!map.has(dateKey)) {
        map.set(dateKey, { incomeMinor: 0, expenseMinor: 0 })
      }
      const entry = map.get(dateKey)!
      if (t.type === 'income') {
        entry.incomeMinor += t.amountMinor || 0
      } else {
        entry.expenseMinor += t.amountMinor || 0
      }
    })

    const dates = Array.from(map.keys()).sort()
    if (dates.length === 0) return []

    return dates.map((d) => {
      const entry = map.get(d) || { incomeMinor: 0, expenseMinor: 0 }
      const income = (entry.incomeMinor || 0) / 100
      const expense = (entry.expenseMinor || 0) / 100
      const net = income - expense
      return {
        date: d.length >= 5 ? d.slice(5) : d, // MM-DD
        fullDate: d,
        income,
        expense,
        net,
      }
    })
  }, [filtered])

  return (
    <div className="card p-5 bg-surface/50 border border-[rgba(255,255,255,0.06)] flex flex-col space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <ChartIcon className="w-5 h-5 text-capital" />
            <h2 className="text-base font-semibold text-text">Cash Flow Trends</h2>
          </div>
          <p className="text-xs text-text-faint mt-1">
            Inflows (Solid Amber) vs Outflows (Dashed Rose)
          </p>
        </div>

        {/* Accessible Table Toggle */}
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

      {showTableView ? (
        /* Accessible Table View (WCAG) */
        <div className="overflow-x-auto py-2">
          <table
            className="w-full text-xs text-left border-collapse font-mono"
            aria-label="Cash flow data table"
          >
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-text-muted">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3 text-right">Inflow ($)</th>
                <th className="py-2 px-3 text-right">Outflow ($)</th>
                <th className="py-2 px-3 text-right">Net Flow ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {chartData.map((d) => (
                <tr key={d.fullDate} className="hover:bg-surface-2/40">
                  <td className="py-2 px-3 font-semibold text-text">{d.fullDate}</td>
                  <td className="py-2 px-3 text-right text-growth">${d.income.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right text-danger">${d.expense.toFixed(2)}</td>
                  <td
                    className={cn(
                      'py-2 px-3 text-right font-bold',
                      d.net >= 0 ? 'text-capital' : 'text-danger'
                    )}
                  >
                    ${d.net.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Recharts Dual-Series Area Chart */
        <div className="w-full h-64 sm:h-72 relative">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-text-faint font-mono">
              No cash flow records to display for this scope.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB7185" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FB7185" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#A1A1AA', fontSize: 10, fontFamily: 'monospace' }}
                  stroke="rgba(255, 255, 255, 0.08)"
                />
                <YAxis
                  tick={{ fill: '#6B6B76', fontSize: 10, fontFamily: 'monospace' }}
                  stroke="rgba(255, 255, 255, 0.08)"
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomCashFlowTooltip />} />
                {/* Income: Solid line with amber fill */}
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#FBBF24"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGradient)"
                  name="Inflow"
                />
                {/* Expense: Dashed line per SRS §3.7.5 (not color alone) */}
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#FB7185"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                  name="Outflow"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}
