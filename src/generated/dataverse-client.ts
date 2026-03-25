/**
 * Shared Dataverse client — uses @microsoft/power-apps SDK.
 * The SDK communicates with the Power Apps host via postMessage,
 * bypassing the CSP connect-src restriction that blocks raw fetch().
 */

import { getClient } from "@microsoft/power-apps/data"
import { dataSourcesInfo } from "../../.power/schemas/appschemas/dataSourcesInfo"
import type { DataClient } from "@microsoft/power-apps/data"
import type { IOperationOptions } from "@microsoft/power-apps/data"

export type { IOperationOptions }

// Singleton SDK client
let _client: DataClient | null = null

function getDataClient(): DataClient {
  if (!_client) {
    _client = getClient(dataSourcesInfo)
  }
  return _client
}

// No need to strip _..._value lookup fields — the SDK bridge handles them correctly.
// (Raw OData rejects them in $select, but the Power Apps bridge does not.)

export async function retrieveMultiple<T>(
  table: string,
  options?: IOperationOptions,
): Promise<T[]> {
  const client = getDataClient()
  const result = await client.retrieveMultipleRecordsAsync<T>(table, options)
  if (!result.success) {
    throw result.error ?? new Error(`retrieveMultiple failed for ${table}`)
  }
  return result.data ?? []
}

export async function retrieve<T>(
  table: string,
  id: string,
  options?: IOperationOptions,
): Promise<T | null> {
  try {
    const client = getDataClient()
    const result = await client.retrieveRecordAsync<T>(table, id, options)
    if (!result.success) return null
    return result.data ?? null
  } catch {
    return null
  }
}

export async function createRecord<TIn, TOut>(
  table: string,
  record: TIn,
): Promise<TOut> {
  const client = getDataClient()
  const result = await client.createRecordAsync<TIn, TOut>(table, record)
  if (!result.success) {
    throw result.error ?? new Error(`createRecord failed for ${table}`)
  }
  return result.data
}

export async function updateRecord<TIn, TOut>(
  table: string,
  id: string,
  changes: TIn,
): Promise<TOut> {
  const client = getDataClient()
  const result = await client.updateRecordAsync<TIn, TOut>(table, id, changes)
  if (!result.success) {
    throw result.error ?? new Error(`updateRecord failed for ${table}`)
  }
  return result.data
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const client = getDataClient()
  const result = await client.deleteRecordAsync(table, id)
  if (!result.success) {
    throw result.error ?? new Error(`deleteRecord failed for ${table}`)
  }
}
