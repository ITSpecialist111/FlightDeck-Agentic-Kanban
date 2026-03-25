import type { ColumnType, Priority, TaskSource, FilterState } from "./types"

export const COLUMN_CONFIG: Record<ColumnType, { label: string; color: string; sortOrder: number }> = {
  backlog: { label: "Backlog", color: "#6b7280", sortOrder: 0 },
  todo: { label: "To Do", color: "#3b82f6", sortOrder: 1 },
  in_progress: { label: "In Progress", color: "#f59e0b", sortOrder: 2 },
  review: { label: "Review", color: "#8b5cf6", sortOrder: 3 },
  done: { label: "Done", color: "#10b981", sortOrder: 4 },
  archived: { label: "Archived", color: "#9ca3af", sortOrder: 5 },
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; order: number }> = {
  critical: { label: "Critical", color: "#ef4444", order: 0 },
  high: { label: "High", color: "#f97316", order: 1 },
  medium: { label: "Medium", color: "#eab308", order: 2 },
  low: { label: "Low", color: "#6b7280", order: 3 },
}

export const SOURCE_CONFIG: Record<TaskSource, { label: string; icon: string }> = {
  manual: { label: "Manual", icon: "pencil" },
  meeting_transcript: { label: "Meeting", icon: "mic" },
  email: { label: "Email", icon: "mail" },
  agent: { label: "Agent", icon: "bot" },
  import: { label: "Import", icon: "download" },
}

export const DEFAULT_COLUMNS: ColumnType[] = ["backlog", "todo", "in_progress", "review", "done"]

export const SORT_ORDER_GAP = 65536

export const DEFAULT_FILTER_STATE: FilterState = {
  search: "",
  assigneeIds: [],
  priorities: [],
  sources: [],
}
