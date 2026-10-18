import { create } from 'zustand'

interface UIStoreState {
  isQuickCaptureOpen: boolean
  openQuickCapture: () => void
  closeQuickCapture: () => void
  toggleQuickCapture: () => void

  isCommandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void

  isWeeklyReviewOpen: boolean
  openWeeklyReview: () => void
  closeWeeklyReview: () => void
  toggleWeeklyReview: () => void
}

export const useUIStore = create<UIStoreState>((set) => ({
  isQuickCaptureOpen: false,
  openQuickCapture: () => set({ isQuickCaptureOpen: true, isCommandPaletteOpen: false }),
  closeQuickCapture: () => set({ isQuickCaptureOpen: false }),
  toggleQuickCapture: () =>
    set((state) => ({
      isQuickCaptureOpen: !state.isQuickCaptureOpen,
      isCommandPaletteOpen: false,
    })),

  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true, isQuickCaptureOpen: false }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((state) => ({
      isCommandPaletteOpen: !state.isCommandPaletteOpen,
      isQuickCaptureOpen: false,
    })),

  isWeeklyReviewOpen: false,
  openWeeklyReview: () => set({ isWeeklyReviewOpen: true }),
  closeWeeklyReview: () => set({ isWeeklyReviewOpen: false }),
  toggleWeeklyReview: () =>
    set((state) => ({ isWeeklyReviewOpen: !state.isWeeklyReviewOpen })),
}))
