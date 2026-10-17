import { create } from 'zustand'

interface UIStoreState {
  isQuickCaptureOpen: boolean
  openQuickCapture: () => void
  closeQuickCapture: () => void
  toggleQuickCapture: () => void
}

export const useUIStore = create<UIStoreState>((set) => ({
  isQuickCaptureOpen: false,
  openQuickCapture: () => set({ isQuickCaptureOpen: true }),
  closeQuickCapture: () => set({ isQuickCaptureOpen: false }),
  toggleQuickCapture: () =>
    set((state) => ({ isQuickCaptureOpen: !state.isQuickCaptureOpen })),
}))
