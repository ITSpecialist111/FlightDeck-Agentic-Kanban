/**
 * Shared Dataverse client — wraps @microsoft/power-apps DataClient for CRUD operations.
 * Handles the IOperationResult unwrapping so service callers get clean data.
 */
import { getClient } from "@microsoft/power-apps/data"
import type { DataClient, IOperationOptions } from "@microsoft/power-apps/data"

let _client: DataClient | null = null

function client(): DataClient {
  if (!_client) {
    _client = getClient(undefined as never)
  }
  return _client
}

export async function retrieveMultiple<T>(
  table: string,
  options?: IOperationOptions,
): Promise<T[]> {
  const result = await client().retrieveMultipleRecordsAsync<T>(table, options)
  if (!result.success) {
    throw result.error ?? new Error(`Failed to retrieve ${table} records`)
  }
  return result.data
}

export async function retrieve<T>(
  table: string,
  id: string,
  options?: IOperationOptions,
): Promise<T | null> {
  try {
    const result = await client().retrieveRecordAsync<T>(table, id, options)
    if (!result.success) return null
    return result.data
  } catch {
    return null
  }
}

export async function createRecord<TIn, TOut>(
  table: string,
  record: TIn,
): Promise<TOut> {
  const result = await client().createRecordAsync<TIn, TOut>(table, record)
  if (!result.success) {
    throw result.error ?? new Error(`Failed to create ${table} record`)
  }
  return result.data
}

export async function updateRecord<TIn, TOut>(
  table: string,
  id: string,
  changes: TIn,
): Promise<TOut> {
  const result = await client().updateRecordAsync<TIn, TOut>(table, id, changes)
  if (!result.success) {
    throw result.error ?? new Error(`Failed to update ${table} record`)
  }
  return result.data
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const result = await client().deleteRecordAsync(table, id)
  if (!result.success) {
    throw result.error ?? new Error(`Failed to delete ${table} record`)
  }
}
