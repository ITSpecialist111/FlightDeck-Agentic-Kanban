/**
 * McProjectsService — Dataverse CRUD for mc_project table
 */
import type { Project } from "@/lib/types"
import { retrieveMultiple, retrieve, createRecord, updateRecord, deleteRecord } from "../dataverse-client"

const TABLE = "mc_projects"

interface DvProject {
  mc_projectid: string
  mc_name: string
  mc_description: string
  mc_color: string
  _mc_organizationlookup_value: string
}

function fromDv(row: DvProject): Project {
  return {
    id: row.mc_projectid,
    organizationId: row._mc_organizationlookup_value ?? "",
    name: row.mc_name ?? "",
    description: row.mc_description ?? "",
    color: row.mc_color ?? "#6b7280",
  }
}

function toDv(data: Partial<Project>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (data.name !== undefined) record.mc_name = data.name
  if (data.description !== undefined) record.mc_description = data.description
  if (data.color !== undefined) record.mc_color = data.color
  if (data.organizationId !== undefined) {
    record["mc_organizationlookup@odata.bind"] = `/mc_organizations(${data.organizationId})`
  }
  return record
}

export const McProjectsService = {
  async getAll(options?: { organizationId?: string }): Promise<Project[]> {
    const rows = await retrieveMultiple<DvProject>(TABLE, {
      select: ["mc_projectid", "mc_name", "mc_description", "mc_color", "_mc_organizationlookup_value"],
      filter: options?.organizationId
        ? `_mc_organizationlookup_value eq '${options.organizationId}'`
        : undefined,
    })
    return rows.map(fromDv)
  },

  async get(id: string): Promise<Project | null> {
    const row = await retrieve<DvProject>(TABLE, id, {
      select: ["mc_projectid", "mc_name", "mc_description", "mc_color", "_mc_organizationlookup_value"],
    })
    return row ? fromDv(row) : null
  },

  async create(project: Partial<Project>): Promise<Project> {
    const result = await createRecord<Record<string, unknown>, DvProject>(TABLE, toDv(project))
    return fromDv(result)
  },

  async update(id: string, changes: Partial<Project>): Promise<Project | null> {
    const result = await updateRecord<Record<string, unknown>, DvProject>(TABLE, id, toDv(changes))
    return fromDv(result)
  },

  async delete(id: string): Promise<void> {
    await deleteRecord(TABLE, id)
  },
}
