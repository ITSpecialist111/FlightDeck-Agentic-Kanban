/**
 * McBoardsService — Dataverse CRUD for mc_board table
 */
import type { KanbanBoard } from "@/lib/types"
import { retrieveMultiple, retrieve, createRecord, updateRecord, deleteRecord } from "../dataverse-client"

const TABLE = "mc_boards"

interface DvBoard {
  mc_boardid: string
  mc_name: string
  mc_description: string
  mc_isdefault: boolean
  mc_agentsenabled: boolean
  mc_pollinterval: number
  _mc_projectlookup_value: string
}

function fromDv(row: DvBoard): KanbanBoard {
  return {
    id: row.mc_boardid?.toLowerCase() ?? "",
    name: row.mc_name ?? "",
    description: row.mc_description ?? "",
    projectId: row._mc_projectlookup_value?.toLowerCase() ?? "",
    isDefault: row.mc_isdefault ?? false,
    agentsEnabled: row.mc_agentsenabled ?? false,
    pollInterval: row.mc_pollinterval ?? 15000,
  }
}

function toDv(data: Partial<KanbanBoard>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (data.name !== undefined) record.mc_name = data.name
  if (data.description !== undefined) record.mc_description = data.description
  if (data.isDefault !== undefined) record.mc_isdefault = data.isDefault
  if (data.agentsEnabled !== undefined) record.mc_agentsenabled = data.agentsEnabled
  if (data.pollInterval !== undefined) record.mc_pollinterval = data.pollInterval
  if (data.projectId !== undefined) {
    record["mc_projectlookup@odata.bind"] = `/mc_projects(${data.projectId})`
  }
  return record
}

export const McBoardsService = {
  async getAll(options?: { projectId?: string }): Promise<KanbanBoard[]> {
    const rows = await retrieveMultiple<DvBoard>(TABLE, {
      select: ["mc_boardid", "mc_name", "mc_description", "mc_isdefault", "mc_agentsenabled", "mc_pollinterval", "_mc_projectlookup_value"],
      filter: options?.projectId
        ? `_mc_projectlookup_value eq '${options.projectId}'`
        : undefined,
    })
    return rows.map(fromDv)
  },

  async get(id: string): Promise<KanbanBoard | null> {
    const row = await retrieve<DvBoard>(TABLE, id, {
      select: ["mc_boardid", "mc_name", "mc_description", "mc_isdefault", "mc_agentsenabled", "mc_pollinterval", "_mc_projectlookup_value"],
    })
    return row ? fromDv(row) : null
  },

  async create(board: Partial<KanbanBoard>): Promise<KanbanBoard> {
    const result = await createRecord<Record<string, unknown>, DvBoard>(TABLE, toDv(board))
    return fromDv(result)
  },

  async update(id: string, changes: Partial<KanbanBoard>): Promise<KanbanBoard | null> {
    const result = await updateRecord<Record<string, unknown>, DvBoard>(TABLE, id, toDv(changes))
    return fromDv(result)
  },

  async delete(id: string): Promise<void> {
    await deleteRecord(TABLE, id)
  },
}
