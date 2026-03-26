/**
 * McColumnsService — Dataverse CRUD for mc_column table
 */
import type { KanbanColumn, ColumnType } from "@/lib/types"
import { retrieveMultiple, retrieve, createRecord, updateRecord, deleteRecord } from "../dataverse-client"
import { choiceMap } from "../choice-maps"

const TABLE = "mc_columns"

interface DvColumn {
  mc_columnid: string
  mc_name: string
  mc_columntype: number
  mc_sortorder: number
  mc_color: string
  mc_wiplimit: number
  _mc_boardlookup_value: string
}

function fromDv(row: DvColumn): KanbanColumn {
  return {
    id: row.mc_columnid?.toLowerCase() ?? "",
    name: row.mc_name ?? "",
    boardId: row._mc_boardlookup_value?.toLowerCase() ?? "",
    sortOrder: row.mc_sortorder ?? 0,
    color: row.mc_color ?? "#6b7280",
    wipLimit: row.mc_wiplimit ?? 0,
    columnType: choiceMap.columnType.fromDv[row.mc_columntype] ?? "backlog",
  }
}

function toDv(data: Partial<KanbanColumn>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (data.name !== undefined) record.mc_name = data.name
  if (data.columnType !== undefined) record.mc_columntype = choiceMap.columnType.toDv[data.columnType as ColumnType]
  if (data.sortOrder !== undefined) record.mc_sortorder = data.sortOrder
  if (data.color !== undefined) record.mc_color = data.color
  if (data.wipLimit !== undefined) record.mc_wiplimit = data.wipLimit
  if (data.boardId !== undefined) {
    record["mc_boardlookup@odata.bind"] = `/mc_boards(${data.boardId})`
  }
  return record
}

export const McColumnsService = {
  async getAll(options?: { boardId?: string }): Promise<KanbanColumn[]> {
    const rows = await retrieveMultiple<DvColumn>(TABLE, {
      select: ["mc_columnid", "mc_name", "mc_columntype", "mc_sortorder", "mc_color", "mc_wiplimit", "_mc_boardlookup_value"],
      filter: options?.boardId
        ? `_mc_boardlookup_value eq '${options.boardId}'`
        : undefined,
      orderBy: ["mc_sortorder asc"],
    })
    return rows.map(fromDv)
  },

  async get(id: string): Promise<KanbanColumn | null> {
    const row = await retrieve<DvColumn>(TABLE, id, {
      select: ["mc_columnid", "mc_name", "mc_columntype", "mc_sortorder", "mc_color", "mc_wiplimit", "_mc_boardlookup_value"],
    })
    return row ? fromDv(row) : null
  },

  async create(column: Partial<KanbanColumn>): Promise<KanbanColumn> {
    const result = await createRecord<Record<string, unknown>, DvColumn>(TABLE, toDv(column))
    return fromDv(result)
  },

  async update(id: string, changes: Partial<KanbanColumn>): Promise<KanbanColumn | null> {
    const result = await updateRecord<Record<string, unknown>, DvColumn>(TABLE, id, toDv(changes))
    return fromDv(result)
  },

  async delete(id: string): Promise<void> {
    await deleteRecord(TABLE, id)
  },
}
