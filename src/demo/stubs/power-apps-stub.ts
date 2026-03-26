/**
 * Stub for @microsoft/power-apps/* imports in demo mode.
 * Exports empty implementations so imports don't crash.
 */

// @microsoft/power-apps/data stubs
export function getClient() {
  throw new Error("Power Apps SDK not available in demo mode")
}
export type DataClient = never
export type IOperationOptions = {
  select?: string[]
  filter?: string
  orderBy?: string[]
}

// @microsoft/power-apps/app stubs
export async function getContext() {
  throw new Error("Power Apps context not available in demo mode")
}
