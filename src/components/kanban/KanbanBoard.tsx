import { useMemo } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useColumns } from "@/hooks/use-columns"
import { useTasks } from "@/hooks/use-tasks"
import { useKanbanDragDrop } from "@/hooks/use-kanban-drag-drop"
import { useBoardStore } from "@/stores/board-store"
import { useUIStore } from "@/stores/ui-store"
import { groupTasksByColumn } from "@/lib/kanban-helpers"
import { KanbanColumn } from "./KanbanColumn"
import { KanbanCard } from "./KanbanCard"
import { Skeleton } from "@/components/ui/skeleton"

export function KanbanBoard() {
  const boardId = useBoardStore((s) => s.currentBoardId)
  const filters = useUIStore((s) => s.filters)
  const { columns, isLoading: columnsLoading } = useColumns(boardId)
  const { tasks, isLoading: tasksLoading } = useTasks(boardId)
  const { activeTask, handleDragStart, handleDragOver, handleDragEnd } =
    useKanbanDragDrop(boardId)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredTasks = useMemo(() => {
    let result = tasks

    // Filter by search text (title + description, case-insensitive)
    if (filters.search) {
      const query = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      )
    }

    // Filter by assignee IDs
    if (filters.assigneeIds.length > 0) {
      result = result.filter((t) => filters.assigneeIds.includes(t.assigneeId))
    }

    // Filter by priorities
    if (filters.priorities.length > 0) {
      result = result.filter((t) => filters.priorities.includes(t.priority))
    }

    // Filter by sources
    if (filters.sources.length > 0) {
      result = result.filter((t) => filters.sources.includes(t.source))
    }

    return result
  }, [tasks, filters])

  const tasksByColumn = groupTasksByColumn(filteredTasks)

  if (columnsLoading || tasksLoading) {
    return (
      <div className="flex gap-4 p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-72 space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex gap-4 h-full overflow-x-auto pb-4 px-1"
        role="region"
        aria-label="Kanban board"
      >
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasksByColumn.get(col.id) ?? []}
            boardId={boardId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && <KanbanCard task={activeTask} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
