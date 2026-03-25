import { Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { PriorityIcon } from "@/components/shared/PriorityIcon"
import { SourceBadge } from "@/components/shared/SourceBadge"
import { useUIStore } from "@/stores/ui-store"
import { useBoardStore } from "@/stores/board-store"
import { useBoardMembers } from "@/hooks/use-board-members"
import { PRIORITY_CONFIG, SOURCE_CONFIG } from "@/lib/constants"
import type { Priority, TaskSource } from "@/lib/types"

export function FilterPopover() {
  const boardId = useBoardStore((s) => s.currentBoardId)
  const { members } = useBoardMembers(boardId)
  const filters = useUIStore((s) => s.filters)
  const setFilter = useUIStore((s) => s.setFilter)
  const clearFilters = useUIStore((s) => s.clearFilters)

  const hasActiveFilters =
    filters.assigneeIds.length > 0 ||
    filters.priorities.length > 0 ||
    filters.sources.length > 0

  const activeFilterCount =
    filters.assigneeIds.length + filters.priorities.length + filters.sources.length

  function toggleAssignee(userId: string) {
    const current = filters.assigneeIds
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    setFilter("assigneeIds", next)
  }

  function togglePriority(priority: Priority) {
    const current = filters.priorities
    const next = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority]
    setFilter("priorities", next)
  }

  function toggleSource(source: TaskSource) {
    const current = filters.sources
    const next = current.includes(source)
      ? current.filter((s) => s !== source)
      : [...current, source]
    setFilter("sources", next)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="size-3.5" />
          Filter
          {hasActiveFilters && (
            <Badge variant="default" className="size-4 p-0 text-[10px] justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4" align="end">
        {/* Assignee section */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Assignee
          </h4>
          <div className="space-y-1.5">
            {members.map((member) => (
              <label
                key={member.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded-md px-1.5 py-1 -mx-1.5"
              >
                <Checkbox
                  checked={filters.assigneeIds.includes(member.id)}
                  onCheckedChange={() => toggleAssignee(member.id)}
                />
                <UserAvatar name={member.name} size="xs" />
                <span className="text-sm">{member.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Priority section */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Priority
          </h4>
          <div className="space-y-1.5">
            {(Object.entries(PRIORITY_CONFIG) as [Priority, (typeof PRIORITY_CONFIG)[Priority]][]).map(
              ([key, config]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded-md px-1.5 py-1 -mx-1.5"
                >
                  <Checkbox
                    checked={filters.priorities.includes(key)}
                    onCheckedChange={() => togglePriority(key)}
                  />
                  <PriorityIcon priority={key} />
                  <span className="text-sm">{config.label}</span>
                </label>
              )
            )}
          </div>
        </div>

        {/* Source section */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Source
          </h4>
          <div className="space-y-1.5">
            {(Object.keys(SOURCE_CONFIG) as TaskSource[]).map((source) => (
              <label
                key={source}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded-md px-1.5 py-1 -mx-1.5"
              >
                <Checkbox
                  checked={filters.sources.includes(source)}
                  onCheckedChange={() => toggleSource(source)}
                />
                <SourceBadge source={source} />
              </label>
            ))}
          </div>
        </div>

        <Separator />

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          Clear all
        </Button>
      </PopoverContent>
    </Popover>
  )
}
