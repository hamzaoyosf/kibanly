import React from 'react'
import { DashboardHeader } from './components/DashboardHeader'
import { TopMetricStrip } from './components/TopMetricStrip'
import { ContributionGraph } from './components/ContributionGraph'
import { ActionWidget } from './components/ActionWidget'
import { GrowthWidget } from './components/GrowthWidget'

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn pb-12" data-hub="core">
      {/* Executive Command Header */}
      <DashboardHeader />

      {/* Top 4 Uniform Hub Metric Summary Cards */}
      <TopMetricStrip />

      {/* 365-Day GitHub-Style Activity & Output Graph */}
      <ContributionGraph />

      {/* 12-Column Uniform Execution & Habit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (6 Cols): Execution & TimeGrid */}
        <div className="lg:col-span-6">
          <ActionWidget />
        </div>

        {/* Right Column (6 Cols): Habits & Daily Condition */}
        <div className="lg:col-span-6">
          <GrowthWidget />
        </div>
      </div>
    </div>
  )
}
