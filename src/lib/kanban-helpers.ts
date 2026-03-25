import { SORT_ORDER_GAP } from "./constants"
import type { KanbanTask } from "./types"

export function calculateSortOrder(
  tasks: KanbanTask[],
  targetIndex: number
): number {
  if (tasks.length === 0) return SORT_ORDER_GAP

  if (targetIndex === 0) {
    return tasks[0].sortOrder / 2
  }

  if (targetIndex >= tasks.length) {
    return tasks[tasks.length - 1].sortOrder + SORT_ORDER_GAP
  }

  const prev = tasks[targetIndex - 1].sortOrder
  const next = tasks[targetIndex].sortOrder
  return (prev + next) / 2
}

export function groupTasksByColumn(tasks: KanbanTask[]): Map<string, KanbanTask[]> {
  const grouped = new Map<string, KanbanTask[]>()
  for (const task of tasks) {
    const existing = grouped.get(task.columnId) ?? []
    existing.push(task)
    grouped.set(task.columnId, existing)
  }
  for (const [key, value] of grouped) {
    grouped.set(key, value.sort((a, b) => a.sortOrder - b.sortOrder))
  }
  return grouped
}
