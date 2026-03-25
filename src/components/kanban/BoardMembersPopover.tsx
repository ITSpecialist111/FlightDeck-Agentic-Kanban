import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { useBoardMembers } from "@/hooks/use-board-members"
import { useBoardStore } from "@/stores/board-store"
import { cn } from "@/lib/utils"
import type { BoardMemberRole } from "@/lib/types"

const ROLE_VARIANT: Record<BoardMemberRole, { variant: "default" | "secondary" | "outline"; className?: string }> = {
  owner: { variant: "default" },
  admin: { variant: "outline", className: "border-blue-500/50 text-blue-600 dark:text-blue-400" },
  member: { variant: "outline" },
  viewer: { variant: "secondary" },
}

export function BoardMembersPopover() {
  const boardId = useBoardStore((s) => s.currentBoardId)
  const { members } = useBoardMembers(boardId)

  const visibleMembers = members.slice(0, 4)
  const overflowCount = members.length - visibleMembers.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex -space-x-1.5 items-center hover:opacity-80 transition-opacity cursor-pointer">
          {visibleMembers.map((member) => (
            <UserAvatar
              key={member.id}
              name={member.name}
              size="xs"
              className="ring-2 ring-background"
            />
          ))}
          {overflowCount > 0 && (
            <div className="size-5 rounded-full bg-muted text-[9px] font-medium flex items-center justify-center ring-2 ring-background text-muted-foreground">
              +{overflowCount}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Board Members
        </h4>
        <div className="space-y-2">
          {members.map((member) => {
            const roleStyle = ROLE_VARIANT[member.role]
            return (
              <div key={member.id} className="flex items-center gap-2.5">
                <UserAvatar name={member.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{member.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{member.email}</div>
                </div>
                <Badge
                  variant={roleStyle.variant}
                  className={cn("text-[10px] px-1.5 py-0 capitalize", roleStyle.className)}
                >
                  {member.role}
                </Badge>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
