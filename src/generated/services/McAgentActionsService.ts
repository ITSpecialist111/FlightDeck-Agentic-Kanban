/**
 * McAgentActionsService — Dataverse CRUD for mc_agentaction table
 */
import type { AgentAction, AgentActionStatus } from "@/lib/types"
import { retrieveMultiple, retrieve, createRecord, updateRecord, deleteRecord } from "../dataverse-client"
import { choiceMap } from "../choice-maps"

const TABLE = "mc_agentactions"

interface DvAgentAction {
  mc_agentactionid: string
  mc_agentname: string
  mc_actiontype: string
  mc_status: number
  mc_confidence: number
  mc_durationms: number
  mc_name: string // mc_name is the primary column, used for mcpSource
  createdon: string
  _mc_tasklookup_value: string
  _mc_boardlookup_value: string
}

const SELECT_FIELDS = [
  "mc_agentactionid", "mc_agentname", "mc_actiontype", "mc_status",
  "mc_confidence", "mc_durationms", "mc_name", "createdon",
  "_mc_tasklookup_value", "_mc_boardlookup_value",
]

function fromDv(row: DvAgentAction): AgentAction {
  return {
    id: row.mc_agentactionid?.toLowerCase() ?? "",
    agentName: row.mc_agentname ?? "",
    actionType: row.mc_actiontype ?? "",
    boardId: row._mc_boardlookup_value?.toLowerCase() ?? "",
    taskId: row._mc_tasklookup_value?.toLowerCase() ?? null,
    status: choiceMap.agentStatus.fromDv[row.mc_status] ?? "pending",
    confidence: row.mc_confidence ?? 0,
    durationMs: row.mc_durationms ?? 0,
    mcpSource: row.mc_name ?? "",
    createdOn: row.createdon ?? new Date().toISOString(),
  }
}

function toDv(data: Partial<AgentAction>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (data.agentName !== undefined) record.mc_agentname = data.agentName
  if (data.actionType !== undefined) record.mc_actiontype = data.actionType
  if (data.status !== undefined) record.mc_status = choiceMap.agentStatus.toDv[data.status as AgentActionStatus]
  if (data.confidence !== undefined) record.mc_confidence = data.confidence
  if (data.durationMs !== undefined) record.mc_durationms = data.durationMs
  if (data.mcpSource !== undefined) record.mc_name = data.mcpSource
  if (data.boardId !== undefined) {
    record["mc_boardlookup@odata.bind"] = `/mc_boards(${data.boardId})`
  }
  if (data.taskId !== undefined && data.taskId !== null) {
    record["mc_tasklookup@odata.bind"] = `/mc_tasks(${data.taskId})`
  }
  return record
}

export const McAgentActionsService = {
  async getAll(options?: { boardId?: string; status?: AgentActionStatus }): Promise<AgentAction[]> {
    const filters: string[] = []
    if (options?.boardId) filters.push(`_mc_boardlookup_value eq '${options.boardId}'`)
    if (options?.status) filters.push(`mc_status eq ${choiceMap.agentStatus.toDv[options.status]}`)

    const rows = await retrieveMultiple<DvAgentAction>(TABLE, {
      select: SELECT_FIELDS,
      filter: filters.length > 0 ? filters.join(" and ") : undefined,
      orderBy: ["createdon desc"],
    })
    return rows.map(fromDv)
  },

  async get(id: string): Promise<AgentAction | null> {
    const row = await retrieve<DvAgentAction>(TABLE, id, { select: SELECT_FIELDS })
    return row ? fromDv(row) : null
  },

  async create(action: Partial<AgentAction>): Promise<AgentAction> {
    const result = await createRecord<Record<string, unknown>, DvAgentAction>(TABLE, toDv(action))
    return fromDv(result)
  },

  async update(id: string, changes: Partial<AgentAction>): Promise<AgentAction | null> {
    const result = await updateRecord<Record<string, unknown>, DvAgentAction>(TABLE, id, toDv(changes))
    return fromDv(result)
  },

  async delete(id: string): Promise<void> {
    await deleteRecord(TABLE, id)
  },
}
