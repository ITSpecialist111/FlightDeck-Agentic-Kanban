import { useState } from "react"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTasks } from "@/hooks/use-tasks"
import { SORT_ORDER_GAP } from "@/lib/constants"
import { toast } from "sonner"

export function NewTaskInline({
  columnId,
  boardId,
}: {
  columnId: string
  boardId: string
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState("")
  const { tasks, createTask } = useTasks(boardId)

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setIsAdding(false)
      return
    }

    const columnTasks = tasks.filter((t) => t.columnId === columnId)
    const maxSort = columnTasks.length > 0
      ? Math.max(...columnTasks.map((t) => t.sortOrder))
      : 0

    createTask.mutate({
      title: trimmed,
      columnId,
      sortOrder: maxSort + SORT_ORDER_GAP,
    })

    toast.success("Task added")
    setTitle("")
    setIsAdding(false)
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground rounded-md hover:bg-card transition-colors"
      >
        <Plus className="size-3.5" />
        Add task
      </button>
    )
  }

  return (
    <div className="p-0.5">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit()
          if (e.key === "Escape") { setIsAdding(false); setTitle("") }
        }}
        onBlur={handleSubmit}
        placeholder="Task title..."
        className="h-8 text-sm"
      />
    </div>
  )
}
