import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BoardMembersPopover } from "@/components/kanban/BoardMembersPopover"
import { FilterPopover } from "@/components/kanban/FilterPopover"
import { useBoardStore } from "@/stores/board-store"
import { useUIStore } from "@/stores/ui-store"
import { useQuery } from "@tanstack/react-query"
import { BoardsService } from "@/services/boards-service"

export function CommandBar() {
  const boardId = useBoardStore((s) => s.currentBoardId)
  const openNewTaskDialog = useUIStore((s) => s.openNewTaskDialog)
  const toggleSearch = useUIStore((s) => s.toggleSearch)

  const { data: board } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => BoardsService.get(boardId),
  })

  return (
    <div className="flex items-center gap-3 pb-4">
      <h2 className="text-lg font-semibold">{board?.name ?? "Board"}</h2>

      <BoardMembersPopover />

      <div className="flex-1" />

      {/* Search trigger */}
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground w-52 justify-start"
        onClick={toggleSearch}
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          Ctrl+K
        </kbd>
      </Button>

      <FilterPopover />

      <Button variant="default" size="sm" className="gap-1.5" onClick={openNewTaskDialog}>
        <Plus className="size-3.5" />
        New Task
      </Button>
    </div>
  )
}
