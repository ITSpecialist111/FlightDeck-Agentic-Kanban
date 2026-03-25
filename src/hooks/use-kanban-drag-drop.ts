import { useState, useCallback } from "react"
import type { DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core"
import type { KanbanTask } from "@/lib/types"
import { calculateSortOrder } from "@/lib/kanban-helpers"
import { useTasks } from "./use-tasks"
import { useColumns } from "./use-columns"
import { toast } from "sonner"

export function useKanbanDragDrop(boardId: string) {
  const { tasks, updateTask } = useTasks(boardId)
  const { columns } = useColumns(boardId)
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }, [tasks])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback handled by dnd-kit's collision detection
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const draggedTask = tasks.find((t) => t.id === activeId)
    if (!draggedTask) return

    // Determine target column
    let targetColumnId: string
    let targetIndex: number

    const overTask = tasks.find((t) => t.id === overId)
    if (overTask) {
      // Dropped over another task
      targetColumnId = overTask.columnId
      const columnTasks = tasks
        .filter((t) => t.columnId === targetColumnId && t.id !== activeId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      targetIndex = columnTasks.findIndex((t) => t.id === overId)
      if (targetIndex === -1) targetIndex = columnTasks.length
    } else {
      // Dropped over a column (empty or at the end)
      targetColumnId = overId
      const columnTasks = tasks
        .filter((t) => t.columnId === targetColumnId && t.id !== activeId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      targetIndex = columnTasks.length
    }

    if (draggedTask.columnId === targetColumnId && !overTask) return

    const columnTasks = tasks
      .filter((t) => t.columnId === targetColumnId && t.id !== activeId)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const newSortOrder = calculateSortOrder(columnTasks, targetIndex)

    const previousColumnId = draggedTask.columnId

    // WIP limit enforcement: block drop if target column is at capacity
    if (previousColumnId !== targetColumnId) {
      const targetColumn = columns.find((c) => c.id === targetColumnId)
      if (targetColumn && targetColumn.wipLimit > 0) {
        const currentCount = tasks.filter((t) => t.columnId === targetColumnId).length
        if (currentCount >= targetColumn.wipLimit) {
          toast.error(
            `Cannot move to "${targetColumn.name}" — WIP limit of ${targetColumn.wipLimit} reached`
          )
          return
        }
      }
    }

    updateTask.mutate(
      { id: activeId, changes: { columnId: targetColumnId, sortOrder: newSortOrder } },
      {
        onSuccess: () => {
          if (previousColumnId !== targetColumnId) {
            toast.success(`Moved "${draggedTask.title}" to new column`)
          }
        },
      }
    )
  }, [tasks, updateTask])

  return {
    activeTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  }
}
