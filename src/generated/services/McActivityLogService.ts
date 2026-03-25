/**
 * McActivityLogService — Dataverse CRUD for mc_activitylog table
 */
import type { ActivityLogEntry, ActivityAction } from "@/lib/types"
import { retrieveMultiple, retrieve, createRecord, updateRecord, deleteRecord } from "../dataverse-client"
import { choiceMap } from "../choice-maps"

const TABLE = "mc_activitylogs"

interface DvActivityLog {
  mc_activitylogid: string
  mc_action: number
  mc_description: string
  mc_actorid: string
  mc_actorname: string
  mc_isagent: boolean
  mc_previousvalue: string
  mc_newvalue: string
  createdon: string
  _mc_tasklookup_value: string
  _mc_boardlookup_value: string
}

const SELECT_FIELDS = [
  "mc_activitylogid", "mc_action", "mc_description", "mc_actorid",
  "mc_actorname", "mc_isagent", "mc_previousvalue", "mc_newvalue",
  "createdon", "_mc_tasklookup_value", "_mc_boardlookup_value",
]

function fromDv(row: DvActivityLog): ActivityLogEntry {
  return {
    id: row.mc_activitylogid,
    boardId: row._mc_boardlookup_value ?? "",
    taskId: row._mc_tasklookup_value ?? null,
    action: choiceMap.action.fromDv[row.mc_action] ?? "created",
    description: row.mc_description ?? "",
    actorId: row.mc_actorid ?? "",
    actorName: row.mc_actorname ?? "",
    isAgent: row.mc_isagent ?? false,
    previousValue: row.mc_previousvalue ?? "",
    newValue: row.mc_newvalue ?? "",
    createdOn: row.createdon ?? new Date().toISOString(),
  }
}

function toDv(data: Partial<ActivityLogEntry>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (data.action !== undefined) record.mc_action = choiceMap.action.toDv[data.action as ActivityAction]
  if (data.description !== undefined) record.mc_description = data.description
  if (data.actorId !== undefined) record.mc_actorid = data.actorId
  if (data.actorName !== undefined) record.mc_actorname = data.actorName
  if (data.isAgent !== undefined) record.mc_isagent = data.isAgent
  if (data.previousValue !== undefined) record.mc_previousvalue = data.previousValue
  if (data.newValue !== undefined) record.mc_newvalue = data.newValue
  if (data.boardId !== undefined) {
    record["mc_boardlookup@odata.bind"] = `/mc_boards(${data.boardId})`
  }
  if (data.taskId !== undefined && data.taskId !== null) {
    record["mc_tasklookup@odata.bind"] = `/mc_tasks(${data.taskId})`
  }
  return record
}

export const McActivityLogService = {
  async getAll(options?: { boardId?: string; taskId?: string }): Promise<ActivityLogEntry[]> {
    const filters: string[] = []
    if (options?.boardId) filters.push(`_mc_boardlookup_value eq '${options.boardId}'`)
    if (options?.taskId) filters.push(`_mc_tasklookup_value eq '${options.taskId}'`)

    const rows = await retrieveMultiple<DvActivityLog>(TABLE, {
      select: SELECT_FIELDS,
      filter: filters.length > 0 ? filters.join(" and ") : undefined,
      orderBy: ["createdon desc"],
    })
    return rows.map(fromDv)
  },

  async get(id: string): Promise<ActivityLogEntry | null> {
    const row = await retrieve<DvActivityLog>(TABLE, id, { select: SELECT_FIELDS })
    return row ? fromDv(row) : null
  },

  async create(entry: Omit<ActivityLogEntry, "id" | "createdOn">): Promise<ActivityLogEntry> {
    const result = await createRecord<Record<string, unknown>, DvActivityLog>(TABLE, toDv(entry))
    return fromDv(result)
  },

  async update(id: string, changes: Partial<ActivityLogEntry>): Promise<ActivityLogEntry | null> {
    const result = await updateRecord<Record<string, unknown>, DvActivityLog>(TABLE, id, toDv(changes))
    return fromDv(result)
  },

  async delete(id: string): Promise<void> {
    await deleteRecord(TABLE, id)
  },
}
