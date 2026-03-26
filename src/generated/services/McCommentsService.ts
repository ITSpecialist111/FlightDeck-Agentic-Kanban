/**
 * McCommentsService — Dataverse CRUD for mc_comment table
 */
import type { Comment } from "@/lib/types"
import { retrieveMultiple, retrieve, createRecord, updateRecord, deleteRecord } from "../dataverse-client"

const TABLE = "mc_comments"

interface DvComment {
  mc_commentid: string
  mc_content: string
  mc_authorid: string
  mc_authorname: string
  mc_isagent: boolean
  createdon: string
  modifiedon: string
  _mc_tasklookup_value: string
}

const SELECT_FIELDS = [
  "mc_commentid", "mc_content", "mc_authorid", "mc_authorname",
  "mc_isagent", "createdon", "modifiedon", "_mc_tasklookup_value",
]

function fromDv(row: DvComment): Comment {
  return {
    id: row.mc_commentid?.toLowerCase() ?? "",
    taskId: row._mc_tasklookup_value?.toLowerCase() ?? "",
    authorId: row.mc_authorid ?? "",
    authorName: row.mc_authorname ?? "",
    isAgent: row.mc_isagent ?? false,
    content: row.mc_content ?? "",
    createdOn: row.createdon ?? new Date().toISOString(),
    modifiedOn: row.modifiedon ?? new Date().toISOString(),
  }
}

function toDv(data: Partial<Comment>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (data.content !== undefined) record.mc_content = data.content
  if (data.authorId !== undefined) record.mc_authorid = data.authorId
  if (data.authorName !== undefined) record.mc_authorname = data.authorName
  if (data.isAgent !== undefined) record.mc_isagent = data.isAgent
  if (data.taskId !== undefined) {
    record["mc_tasklookup@odata.bind"] = `/mc_tasks(${data.taskId})`
  }
  return record
}

export const McCommentsService = {
  async getAll(options?: { taskId?: string }): Promise<Comment[]> {
    const rows = await retrieveMultiple<DvComment>(TABLE, {
      select: SELECT_FIELDS,
      filter: options?.taskId
        ? `_mc_tasklookup_value eq '${options.taskId}'`
        : undefined,
      orderBy: ["createdon asc"],
    })
    return rows.map(fromDv)
  },

  async get(id: string): Promise<Comment | null> {
    const row = await retrieve<DvComment>(TABLE, id, { select: SELECT_FIELDS })
    return row ? fromDv(row) : null
  },

  async create(comment: Partial<Comment>): Promise<Comment> {
    const result = await createRecord<Record<string, unknown>, DvComment>(TABLE, toDv(comment))
    return fromDv(result)
  },

  async update(id: string, changes: Partial<Comment>): Promise<Comment | null> {
    const result = await updateRecord<Record<string, unknown>, DvComment>(TABLE, id, toDv(changes))
    return fromDv(result)
  },

  async delete(id: string): Promise<void> {
    await deleteRecord(TABLE, id)
  },
}
