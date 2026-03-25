import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { KanbanTask, ColumnType } from "@/lib/types"
import { COLUMN_CONFIG, PRIORITY_CONFIG } from "@/lib/constants"
import { formatUKDate, isOverdue } from "@/lib/date-utils"
import { PriorityIcon } from "@/components/shared/PriorityIcon"
import { SourceBadge } from "@/components/shared/SourceBadge"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function SortableHeader({
  column,
  label,
}: {
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void }
  label: string
}) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
      )}
    </Button>
  )
}

export function createColumns(columnTypeMap: Map<string, ColumnType>): ColumnDef<KanbanTask>[] {
  return [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate font-medium">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "columnId",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const columnId = row.getValue("columnId") as string
      const colType = columnTypeMap.get(columnId) ?? "backlog"
      const config = COLUMN_CONFIG[colType]
      return (
        <div className="flex items-center gap-2">
          <div
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: config?.color }}
          />
          <span className="text-sm">{config?.label ?? colType}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <SortableHeader column={column} label="Priority" />,
    cell: ({ row }) => {
      const priority = row.original.priority
      const config = PRIORITY_CONFIG[priority]
      return (
        <div className="flex items-center gap-1.5">
          <PriorityIcon priority={priority} />
          <span className="text-sm">{config?.label ?? priority}</span>
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const orderA = PRIORITY_CONFIG[rowA.original.priority]?.order ?? 99
      const orderB = PRIORITY_CONFIG[rowB.original.priority]?.order ?? 99
      return orderA - orderB
    },
  },
  {
    accessorKey: "assigneeName",
    header: ({ column }) => <SortableHeader column={column} label="Assignee" />,
    cell: ({ row }) => {
      const name = row.original.assigneeName
      if (!name) {
        return <span className="text-muted-foreground text-sm">Unassigned</span>
      }
      return (
        <div className="flex items-center gap-2">
          <UserAvatar name={name} size="xs" />
          <span className="text-sm">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "source",
    header: ({ column }) => <SortableHeader column={column} label="Source" />,
    cell: ({ row }) => <SourceBadge source={row.original.source} />,
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => <SortableHeader column={column} label="Due Date" />,
    cell: ({ row }) => {
      const dueDate = row.original.dueDate
      if (!dueDate) {
        return <span className="text-muted-foreground text-sm">--</span>
      }
      const overdue = isOverdue(dueDate) && !row.original.completedDate
      return (
        <span className={cn("text-sm", overdue && "text-destructive font-medium")}>
          {formatUKDate(dueDate)}
        </span>
      )
    },
  },
  {
    accessorKey: "createdOn",
    header: ({ column }) => <SortableHeader column={column} label="Created" />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatUKDate(row.original.createdOn)}
      </span>
    ),
  },
  {
    accessorKey: "isBlocked",
    header: ({ column }) => <SortableHeader column={column} label="Blocked" />,
    cell: ({ row }) => {
      if (!row.original.isBlocked) return null
      return (
        <Badge
          variant="outline"
          className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 py-0"
        >
          Blocked
        </Badge>
      )
    },
  },
]
}
