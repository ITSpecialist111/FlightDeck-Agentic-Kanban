import { create } from "zustand"
import type { FilterState } from "@/lib/types"
import { DEFAULT_FILTER_STATE } from "@/lib/constants"

interface UIState {
  // Panels
  telemetryBladeOpen: boolean
  chatPanelOpen: boolean
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Task detail
  selectedTaskId: string | null
  taskDetailOpen: boolean

  // Dialogs
  newTaskDialogOpen: boolean
  searchOpen: boolean
  shortcutsDialogOpen: boolean

  // Filters
  filters: FilterState

  // Panel toggles
  toggleTelemetryBlade: () => void
  toggleChatPanel: () => void
  toggleSidebar: () => void
  toggleSidebarCollapsed: () => void

  // Task detail
  openTaskDetail: (taskId: string) => void
  closeTaskDetail: () => void

  // Dialogs
  openNewTaskDialog: () => void
  closeNewTaskDialog: () => void
  toggleSearch: () => void
  toggleShortcutsDialog: () => void

  // Filters
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  clearFilters: () => void
}

export const useUIStore = create<UIState>((set) => ({
  telemetryBladeOpen: true,
  chatPanelOpen: false,
  sidebarOpen: true,
  sidebarCollapsed: false,
  selectedTaskId: null,
  taskDetailOpen: false,
  newTaskDialogOpen: false,
  searchOpen: false,
  shortcutsDialogOpen: false,
  filters: DEFAULT_FILTER_STATE,

  toggleTelemetryBlade: () => set((s) => ({ telemetryBladeOpen: !s.telemetryBladeOpen })),
  toggleChatPanel: () => set((s) => ({ chatPanelOpen: !s.chatPanelOpen })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  openTaskDetail: (taskId) => set({ selectedTaskId: taskId, taskDetailOpen: true }),
  closeTaskDetail: () => set({ selectedTaskId: null, taskDetailOpen: false }),

  openNewTaskDialog: () => set({ newTaskDialogOpen: true }),
  closeNewTaskDialog: () => set({ newTaskDialogOpen: false }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  toggleShortcutsDialog: () => set((s) => ({ shortcutsDialogOpen: !s.shortcutsDialogOpen })),

  setFilter: (key, value) => set((s) => ({
    filters: { ...s.filters, [key]: value },
  })),
  clearFilters: () => set({ filters: DEFAULT_FILTER_STATE }),
}))
