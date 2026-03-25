import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { PriorityIcon } from "@/components/shared/PriorityIcon"
import { useUIStore } from "@/stores/ui-store"
import { useBoardStore } from "@/stores/board-store"
import { useTasks } from "@/hooks/use-tasks"

export function SearchDialog() {
  const searchOpen = useUIStore((s) => s.searchOpen)
  const toggleSearch = useUIStore((s) => s.toggleSearch)
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)
  const boardId = useBoardStore((s) => s.currentBoardId)
  const { tasks } = useTasks(boardId)

  function handleSelect(taskId: string) {
    openTaskDetail(taskId)
    toggleSearch()
  }

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={toggleSearch}
      title="Search Tasks"
      description="Search for tasks by title or description"
    >
      <CommandInput placeholder="Search tasks..." />
      <CommandList>
        <CommandEmpty>No tasks found.</CommandEmpty>
        <CommandGroup heading="Tasks">
          {tasks.map((task) => (
            <CommandItem
              key={task.id}
              value={`${task.title} ${task.description}`}
              onSelect={() => handleSelect(task.id)}
              className="gap-2"
            >
              <PriorityIcon priority={task.priority} />
              <span className="flex-1 truncate">{task.title}</span>
              {task.assigneeName && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {task.assigneeName}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
