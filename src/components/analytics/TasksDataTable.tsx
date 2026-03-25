import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table"
import type { KanbanTask, ColumnType } from "@/lib/types"
import { createColumns } from "./data-table-columns"
import { useColumns } from "@/hooks/use-columns"
import { useUIStore } from "@/stores/ui-store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface TasksDataTableProps {
  tasks: KanbanTask[]
  boardId: string
}

export function TasksDataTable({ tasks, boardId }: TasksDataTableProps) {
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)
  const { columns: boardColumns } = useColumns(boardId)

  const columnTypeMap = useMemo(() => {
    const m = new Map<string, ColumnType>()
    for (const col of boardColumns) {
      m.set(col.id, col.columnType)
    }
    return m
  }, [boardColumns])

  const columns = useMemo(() => createColumns(columnTypeMap), [columnTypeMap])
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdOn", desc: true },
  ])

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn("cursor-pointer")}
                  onClick={() => openTaskDetail(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {table.getFilteredRowModel().rows.length} tasks
      </div>
    </div>
  )
}
