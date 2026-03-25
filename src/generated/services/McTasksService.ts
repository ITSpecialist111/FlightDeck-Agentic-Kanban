/**
 * McTasksService — Dataverse CRUD for mc_task table
 */
import type { KanbanTask, Priority, TaskSource } from "@/lib/types"
import { retrieveMultiple, retrieve, createRecord, updateRecord, deleteRecord } from "../dataverse-client"
import { choiceMap } from "../choice-maps"

const TABLE = "mc_tasks"

interface DvTask {
  mc_taskid: string
  mc_title: string
  mc_description: string
  mc_priority: number
  mc_sortorder: number
  mc_duedate: string | null
  mc_source: number
  mc_sourcereference: string
  mc_labels: string
  mc_meetingdate: string | null
  mc_completeddate: string | null
  mc_archiveddate: string | null
  mc_isblocked: boolean
  mc_blockedreason: string
  mc_assigneeid: string
  mc_assigneename: string
  createdon: string
  modifiedon: string
  _mc_columnlookup_value: string
  _mc_taskboardlookup_value: string
}

const SELECT_FIELDS = [
  "mc_taskid", "mc_title", "mc_description", "mc_priority", "mc_sortorder",
  "mc_duedate", "mc_source", "mc_sourcereference", "mc_labels",
  "mc_meetingdate", "mc_completeddate", "mc_archiveddate",
  "mc_isblocked", "mc_blockedreason", "mc_assigneeid", "mc_assigneename",
  "createdon", "modifiedon",
  "_mc_columnlookup_value", "_mc_taskboardlookup_value",
]

function fromDv(row: DvTask): KanbanTask {
  let labels: string[] = []
  try {
    labels = row.mc_labels ? JSON.parse(row.mc_labels) : []
  } catch {
    labels = row.mc_labels ? row.mc_labels.split(",").map((s) => s.trim()) : []
  }

  return {
    id: row.mc_taskid,
    title: row.mc_title ?? "",
    description: row.mc_description ?? "",
    columnId: row._mc_columnlookup_value ?? "",
    boardId: row._mc_taskboardlookup_value ?? "",
    assigneeId: row.mc_assigneeid ?? "",
    assigneeName: row.mc_assigneename ?? "",
    priority: choiceMap.priority.fromDv[row.mc_priority] ?? "medium",
    sortOrder: row.mc_sortorder ?? 0,
    dueDate: row.mc_duedate ?? null,
    source: choiceMap.source.fromDv[row.mc_source] ?? "manual",
    sourceReference: row.mc_sourcereference ?? "",
    labels,
    meetingDate: row.mc_meetingdate ?? null,
    completedDate: row.mc_completeddate ?? null,
    archivedDate: row.mc_archiveddate ?? null,
    isBlocked: row.mc_isblocked ?? false,
    blockedReason: row.mc_blockedreason ?? "",
    createdOn: row.createdon ?? new Date().toISOString(),
    modifiedOn: row.modifiedon ?? new Date().toISOString(),
  }
}

function toDv(data: Partial<KanbanTask>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (data.title !== undefined) record.mc_title = data.title
  if (data.description !== undefined) record.mc_description = data.description
  if (data.priority !== undefined) record.mc_priority = choiceMap.priority.toDv[data.priority as Priority]
  if (data.sortOrder !== undefined) record.mc_sortorder = data.sortOrder
  if (data.dueDate !== undefined) record.mc_duedate = data.dueDate
  if (data.source !== undefined) record.mc_source = choiceMap.source.toDv[data.source as TaskSource]
  if (data.sourceReference !== undefined) record.mc_sourcereference = data.sourceReference
  if (data.labels !== undefined) record.mc_labels = JSON.stringify(data.labels)
  if (data.meetingDate !== undefined) record.mc_meetingdate = data.meetingDate
  if (data.completedDate !== undefined) record.mc_completeddate = data.completedDate
  if (data.archivedDate !== undefined) record.mc_archiveddate = data.archivedDate
  if (data.isBlocked !== undefined) record.mc_isblocked = data.isBlocked
  if (data.blockedReason !== undefined) record.mc_blockedreason = data.blockedReason
  if (data.assigneeId !== undefined) record.mc_assigneeid = data.assigneeId
  if (data.assigneeName !== undefined) record.mc_assigneename = data.assigneeName
  if (data.columnId !== undefined) {
    record["mc_columnlookup@odata.bind"] = `/mc_columns(${data.columnId})`
  }
  if (data.boardId !== undefined) {
    record["mc_taskboardlookup@odata.bind"] = `/mc_boards(${data.boardId})`
  }
  return record
}

export const McTasksService = {
  async getAll(options?: { boardId?: string }): Promise<KanbanTask[]> {
    const queryOptions = {
      select: SELECT_FIELDS,
      filter: options?.boardId
        ? `_mc_taskboardlookup_value eq '${options.boardId}'`
        : undefined,
      orderBy: ["mc_sortorder asc"],
    }
    const rows = await retrieveMultiple<DvTask>(TABLE, queryOptions)
    return rows.map(fromDv)
  },

  async get(id: string): Promise<KanbanTask | null> {
    const row = await retrieve<DvTask>(TABLE, id, { select: SELECT_FIELDS })
    return row ? fromDv(row) : null
  },

  async create(task: Partial<KanbanTask>): Promise<KanbanTask> {
    const result = await createRecord<Record<string, unknown>, DvTask>(TABLE, toDv(task))
    return fromDv(result)
  },

  async update(id: string, changes: Partial<KanbanTask>): Promise<KanbanTask | null> {
    const result = await updateRecord<Record<string, unknown>, DvTask>(TABLE, id, toDv(changes))
    return fromDv(result)
  },

  async delete(id: string): Promise<void> {
    await deleteRecord(TABLE, id)
  },
}
