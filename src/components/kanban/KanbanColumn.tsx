import { useRef } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"
import type { KanbanColumn as ColumnType } from "@/lib/types"
import type { KanbanTask } from "@/lib/types"
import { KanbanCard } from "./KanbanCard"
import { NewTaskInline } from "./NewTaskInline"

/** Virtualise when a column has more than this many tasks */
const VIRTUAL_THRESHOLD = 30
const ESTIMATED_CARD_HEIGHT = 100

export function KanbanColumn({
  column,
  tasks,
  boardId,
}: {
  column: ColumnType
  tasks: KanbanTask[]
  boardId: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds = tasks.map((t) => t.id)
  const isOverWip = column.wipLimit > 0 && tasks.length >= column.wipLimit
  const scrollRef = useRef<HTMLDivElement>(null)
  const useVirtual = tasks.length > VIRTUAL_THRESHOLD

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: 5,
    enabled: useVirtual,
  })

  return (
    <div
      className="flex flex-col w-72 shrink-0"
      role="group"
      aria-label={`${column.name} column, ${tasks.length} task${tasks.length !== 1 ? "s" : ""}${column.wipLimit > 0 ? `, WIP limit ${column.wipLimit}` : ""}`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <div
          className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="text-sm font-semibold text-foreground">{column.name}</h3>
        <span
          className={cn(
            "ml-auto text-xs tabular-nums font-medium rounded-full px-2 py-0.5",
            isOverWip
              ? "bg-destructive/10 text-destructive"
              : "bg-secondary text-muted-foreground"
          )}
          aria-label={`${tasks.length} task${tasks.length !== 1 ? "s" : ""}${column.wipLimit > 0 ? ` of ${column.wipLimit} limit` : ""}`}
        >
          {tasks.length}
          {column.wipLimit > 0 && ` / ${column.wipLimit}`}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={(node) => {
          setNodeRef(node)
          // Also use as scroll container for virtualiser
          ;(scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        className={cn(
          "flex-1 rounded-lg bg-muted/50 p-2 min-h-32 transition-colors duration-150 overflow-y-auto",
          isOver && "bg-primary/5 ring-1 ring-primary/20",
          isOverWip && "ring-1 ring-destructive/20 bg-destructive/5"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {useVirtual ? (
            <div
              style={{ height: virtualizer.getTotalSize(), position: "relative" }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const task = tasks[virtualItem.index]
                return (
                  <div
                    key={task.id}
                    style={{
                      position: "absolute",
                      top: virtualItem.start,
                      left: 0,
                      right: 0,
                      paddingBottom: 8,
                    }}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                  >
                    <KanbanCard task={task} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <KanbanCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
            Drop items here
          </div>
        )}

        <NewTaskInline columnId={column.id} boardId={boardId} />
      </div>
    </div>
  )
}
