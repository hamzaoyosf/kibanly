import React, { useState } from 'react'
import { Coins } from 'lucide-react'
import { TransactionScope } from '@/data/ports/schemas'
import { useTransactions } from './useTransactions'
import { NetCashOverview } from './components/NetCashOverview'
import { QuickEntryCard } from './components/QuickEntryCard'
import { RecentTransactionsList } from './components/RecentTransactionsList'
import { CashFlowChart } from './components/CashFlowChart'
import { SubscriptionLedger } from './components/SubscriptionLedger'
import { MilestoneCard } from './components/MilestoneCard'

export const CapitalHubPage: React.FC = () => {
  const [selectedScope, setSelectedScope] = useState<'all' | TransactionScope>('all')
  const { data: transactions = [] } = useTransactions(selectedScope)

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2" data-hub="capital">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-capital/10 text-capital">
              <Coins className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Capital Hub
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Financial clarity & cash flow engine. Monitor net margin, track recurring commitments, and hit runway milestones.
          </p>
        </div>
      </div>

      {/* Net Cash Overview Stats & Scope Filter (SRS §3.7.6) */}
      <NetCashOverview
        transactions={transactions}
        selectedScope={selectedScope}
        onSelectScope={setSelectedScope}
      />

      {/* Main 12-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Cash Flow Trends & Transactions Ledger */}
        <div className="lg:col-span-7 space-y-5">
          <CashFlowChart
            transactions={transactions}
            selectedScope={selectedScope}
          />
          <RecentTransactionsList transactions={transactions} />
        </div>

        {/* Right Column (5 cols): Quick Entry & Subscription Ledger */}
        <div className="lg:col-span-5 space-y-5">
          <QuickEntryCard />
          <SubscriptionLedger selectedScope={selectedScope} />
        </div>
      </div>

      {/* Bottom Row: Milestone Targets */}
      <MilestoneCard />
    </div>
  )
}
