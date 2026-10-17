import React from 'react'
import { DashboardHeader } from './components/DashboardHeader'
import { ActionWidget } from './components/ActionWidget'
import { GrowthWidget } from './components/GrowthWidget'
import { CapitalWidget } from './components/CapitalWidget'
import { KnowledgeWidget } from './components/KnowledgeWidget'

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-12" data-hub="core">
      {/* Executive Command Header */}
      <DashboardHeader />

      {/* 12-Column Responsive Quad-Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (6 Cols): Execution (Action) & Liquidity (Capital) */}
        <div className="lg:col-span-6 space-y-5">
          <ActionWidget />
          <CapitalWidget />
        </div>

        {/* Right Column (6 Cols): Vitality (Growth) & Second Brain (Knowledge) */}
        <div className="lg:col-span-6 space-y-5">
          <GrowthWidget />
          <KnowledgeWidget />
        </div>
      </div>
    </div>
  )
}
