/**
 * McBoardMembersService — Dataverse CRUD for mc_boardmember table
 */
import type { BoardMember, BoardMemberRole } from "@/lib/types"
import { retrieveMultiple, retrieve, createRecord, updateRecord, deleteRecord } from "../dataverse-client"
import { choiceMap } from "../choice-maps"

const TABLE = "mc_boardmembers"

interface DvBoardMember {
  mc_boardmemberid: string
  mc_name: string
  mc_email: string
  mc_role: number
  mc_avatarurl: string
  _mc_boardlookup_value: string
}

const SELECT_FIELDS = [
  "mc_boardmemberid", "mc_name", "mc_email", "mc_role",
  "mc_avatarurl", "_mc_boardlookup_value",
]

function fromDv(row: DvBoardMember): BoardMember {
  return {
    id: row.mc_boardmemberid?.toLowerCase() ?? "",
    boardId: row._mc_boardlookup_value?.toLowerCase() ?? "",
    name: row.mc_name ?? "",
    email: row.mc_email ?? "",
    role: choiceMap.role.fromDv[row.mc_role] ?? "member",
    avatarUrl: row.mc_avatarurl ?? "",
  }
}

function toDv(data: Partial<BoardMember>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (data.name !== undefined) record.mc_name = data.name
  if (data.email !== undefined) record.mc_email = data.email
  if (data.role !== undefined) record.mc_role = choiceMap.role.toDv[data.role as BoardMemberRole]
  if (data.avatarUrl !== undefined) record.mc_avatarurl = data.avatarUrl
  if (data.boardId !== undefined) {
    record["mc_boardlookup@odata.bind"] = `/mc_boards(${data.boardId})`
  }
  return record
}

export const McBoardMembersService = {
  async getAll(options?: { boardId?: string }): Promise<BoardMember[]> {
    const rows = await retrieveMultiple<DvBoardMember>(TABLE, {
      select: SELECT_FIELDS,
      filter: options?.boardId
        ? `_mc_boardlookup_value eq '${options.boardId}'`
        : undefined,
    })
    return rows.map(fromDv)
  },

  async get(id: string): Promise<BoardMember | null> {
    const row = await retrieve<DvBoardMember>(TABLE, id, { select: SELECT_FIELDS })
    return row ? fromDv(row) : null
  },

  async create(member: Omit<BoardMember, "id">): Promise<BoardMember> {
    const result = await createRecord<Record<string, unknown>, DvBoardMember>(TABLE, toDv(member))
    return fromDv(result)
  },

  async update(id: string, changes: Partial<BoardMember>): Promise<BoardMember | null> {
    const result = await updateRecord<Record<string, unknown>, DvBoardMember>(TABLE, id, toDv(changes))
    return fromDv(result)
  },

  async delete(id: string): Promise<void> {
    await deleteRecord(TABLE, id)
  },
}
