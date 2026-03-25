import { format, formatDistanceToNow, isBefore, parseISO, startOfDay } from "date-fns"
import { enGB } from "date-fns/locale"

function toDate(date: string | Date): Date {
  return typeof date === "string" ? parseISO(date) : date
}

/** "24/03/2026" */
export function formatUKDate(date: string | Date): string {
  return format(toDate(date), "dd/MM/yyyy", { locale: enGB })
}

/** "24 Mar 2026" */
export function formatUKDateShort(date: string | Date): string {
  return format(toDate(date), "dd MMM yyyy", { locale: enGB })
}

/** "24 Mar 2026, 14:30" */
export function formatUKDateTime(date: string | Date): string {
  return format(toDate(date), "dd MMM yyyy, HH:mm", { locale: enGB })
}

/** "2 hours ago" */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true, locale: enGB })
}

/** "24 Mar" */
export function formatUKDateCompact(date: string | Date): string {
  return format(toDate(date), "dd MMM", { locale: enGB })
}

/** "18 Mar" - chart axis label */
export function formatChartDate(date: string | Date): string {
  return format(toDate(date), "dd/MM", { locale: enGB })
}

/** Check if a date string is in the past (overdue) */
export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return isBefore(startOfDay(parseISO(dateStr)), startOfDay(new Date()))
}
