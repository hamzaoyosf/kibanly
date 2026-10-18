import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { HubRail } from './HubRail'
import { QuickCaptureModal } from '@/features/inbox/QuickCaptureModal'
import { CommandPalette } from '@/features/command/CommandPalette'
import { useUIStore } from '@/app/store/uiStore'

export const BentoShell: React.FC = () => {
  // Global keyboard shortcuts:
  // - Cmd+K / Ctrl+K opens Command Palette
  // - 'q' or 'i' opens Quick Capture (SRS FR-INB-01 / PRD AH-1)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check for Cmd+K / Ctrl+K Command Palette trigger
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        useUIStore.getState().toggleCommandPalette()
        return
      }

      // Ignore single-key shortcuts when modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return

      // Don't trigger if command palette or quick capture is already open
      const { isCommandPaletteOpen, isQuickCaptureOpen } = useUIStore.getState()
      if (isCommandPaletteOpen || isQuickCaptureOpen) return

      // Strictly verify that document.activeElement is not an INPUT or TEXTAREA
      const activeElement = document.activeElement as HTMLElement | null
      const activeTag = activeElement?.tagName?.toUpperCase()

      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeElement?.isContentEditable) {
        return
      }

      const key = e.key.toLowerCase()
      if (key === 'q' || key === 'i') {
        e.preventDefault()
        useUIStore.getState().openQuickCapture()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col md:flex-row antialiased selection:bg-action/20 selection:text-action">
      {/* Left Navigation Sidebar */}
      <HubRail />

      {/* Main Viewport Container */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-6">
        <div className="max-w-[1440px] mx-auto w-full p-2.5 sm:p-3 md:p-4 lg:p-4">
          <React.Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-2 border-action/20 border-t-action animate-spin" />
                  <div className="absolute inset-1.5 rounded-full border-2 border-knowledge/20 border-b-knowledge animate-spin [animation-direction:reverse]" />
                </div>
                <p className="text-xs font-mono uppercase tracking-widest text-text-muted animate-pulse">
                  Loading Command Deck...
                </p>
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </div>
      </main>

      {/* Global Quick Capture Modal */}
      <QuickCaptureModal />

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  )
}
