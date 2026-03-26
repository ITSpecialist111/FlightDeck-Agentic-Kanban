/**
 * McOrganizationsService — Dataverse CRUD for mc_organization table
 */
import type { Organization } from "@/lib/types"
import { retrieveMultiple, retrieve, createRecord, updateRecord, deleteRecord } from "../dataverse-client"

const TABLE = "mc_organizations"

interface DvOrganization {
  mc_organizationid: string
  mc_name: string
  mc_logourl: string
}

function fromDv(row: DvOrganization): Organization {
  return {
    id: row.mc_organizationid?.toLowerCase() ?? "",
    name: row.mc_name ?? "",
    logoUrl: row.mc_logourl ?? "",
  }
}

function toDv(data: Partial<Organization>): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  if (data.name !== undefined) record.mc_name = data.name
  if (data.logoUrl !== undefined) record.mc_logourl = data.logoUrl
  return record
}

export const McOrganizationsService = {
  async getAll(): Promise<Organization[]> {
    const rows = await retrieveMultiple<DvOrganization>(TABLE, {
      select: ["mc_organizationid", "mc_name", "mc_logourl"],
    })
    return rows.map(fromDv)
  },

  async get(id: string): Promise<Organization | null> {
    const row = await retrieve<DvOrganization>(TABLE, id, {
      select: ["mc_organizationid", "mc_name", "mc_logourl"],
    })
    return row ? fromDv(row) : null
  },

  async create(org: Partial<Organization>): Promise<Organization> {
    const result = await createRecord<Record<string, unknown>, DvOrganization>(TABLE, toDv(org))
    return fromDv(result)
  },

  async update(id: string, changes: Partial<Organization>): Promise<Organization | null> {
    const result = await updateRecord<Record<string, unknown>, DvOrganization>(TABLE, id, toDv(changes))
    return fromDv(result)
  },

  async delete(id: string): Promise<void> {
    await deleteRecord(TABLE, id)
  },
}
