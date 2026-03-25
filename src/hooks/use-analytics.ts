import { useMemo } from "react"
import { useTasks } from "./use-tasks"
import { useColumns } from "./use-columns"
import { useActivityLog } from "./use-activity-log"
import { COLUMN_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG } from "@/lib/constants"
import { startOfDay, format, differenceInDays, parseISO } from "date-fns"
import { enGB } from "date-fns/locale"
import type { ColumnType, Priority, TaskSource } from "@/lib/types"

export interface AnalyticsData {
  tasksByStatus: Array<{ status: string; count: number; color: string }>
  tasksByPriority: Array<{ priority: string; count: number; color: string }>
  tasksBySource: Array<{ source: string; count: number; label: string }>
  activityOverTime: Array<{ date: string; total: number; agent: number; human: number }>
  summary: {
    totalTasks: number
    completionRate: number
    avgTaskAge: number
    agentContribution: number
    blockedCount: number
    overdueCount: number
  }
}

const SOURCE_COLORS: Record<TaskSource, string> = {
  manual: "var(--chart-1)",
  meeting_transcript: "var(--chart-2)",
  email: "var(--chart-3)",
  agent: "var(--chart-4)",
  import: "var(--chart-5)",
}

export function useAnalytics(boardId: string) {
  const { tasks, isLoading: tasksLoading } = useTasks(boardId)
  const { columns, isLoading: columnsLoading } = useColumns(boardId)
  const { activities, isLoading: activitiesLoading } = useActivityLog(boardId)

  const data = useMemo<AnalyticsData | null>(() => {
    if (tasks.length === 0 || columns.length === 0) return null

    // Build columnId → columnType lookup from loaded columns
    const columnTypeMap = new Map<string, ColumnType>()
    for (const col of columns) {
      columnTypeMap.set(col.id, col.columnType)
    }

    // Tasks by status (column)
    const statusCounts = new Map<string, number>()
    for (const task of tasks) {
      const colType = columnTypeMap.get(task.columnId) ?? "backlog"
      const label = COLUMN_CONFIG[colType]?.label ?? colType
      statusCounts.set(label, (statusCounts.get(label) ?? 0) + 1)
    }
    const tasksByStatus = Object.entries(COLUMN_CONFIG)
      .filter(([, cfg]) => statusCounts.has(cfg.label))
      .map(([, cfg]) => ({
        status: cfg.label,
        count: statusCounts.get(cfg.label) ?? 0,
        color: cfg.color,
      }))

    // Tasks by priority
    const priorityCounts = new Map<Priority, number>()
    for (const task of tasks) {
      priorityCounts.set(task.priority, (priorityCounts.get(task.priority) ?? 0) + 1)
    }
    const tasksByPriority = (Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => ({
      priority: PRIORITY_CONFIG[p].label,
      count: priorityCounts.get(p) ?? 0,
      color: PRIORITY_CONFIG[p].color,
    })).filter((d) => d.count > 0)

    // Tasks by source
    const sourceCounts = new Map<TaskSource, number>()
    for (const task of tasks) {
      sourceCounts.set(task.source, (sourceCounts.get(task.source) ?? 0) + 1)
    }
    const tasksBySource = (Object.keys(SOURCE_CONFIG) as TaskSource[]).map((s) => ({
      source: s,
      count: sourceCounts.get(s) ?? 0,
      label: SOURCE_CONFIG[s].label,
      color: SOURCE_COLORS[s],
    })).filter((d) => d.count > 0)

    // Activity over time (daily buckets)
    const dailyBuckets = new Map<string, { total: number; agent: number; human: number }>()
    for (const activity of activities) {
      const day = format(startOfDay(parseISO(activity.createdOn)), "yyyy-MM-dd", { locale: enGB })
      const bucket = dailyBuckets.get(day) ?? { total: 0, agent: 0, human: 0 }
      bucket.total++
      if (activity.isAgent) bucket.agent++
      else bucket.human++
      dailyBuckets.set(day, bucket)
    }
    const activityOverTime = Array.from(dailyBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date: format(parseISO(date), "dd MMM", { locale: enGB }),
        ...counts,
      }))

    // Summary metrics
    const now = new Date()
    const doneTasks = tasks.filter((t) => columnTypeMap.get(t.columnId) === "done")
    const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0

    const nonCompletedTasks = tasks.filter((t) => !t.completedDate)
    const avgTaskAge = nonCompletedTasks.length > 0
      ? Math.round(
          nonCompletedTasks.reduce((sum, t) => sum + differenceInDays(now, parseISO(t.createdOn)), 0) /
            nonCompletedTasks.length
        )
      : 0

    const agentActivities = activities.filter((a) => a.isAgent).length
    const agentContribution = activities.length > 0 ? Math.round((agentActivities / activities.length) * 100) : 0

    const blockedCount = tasks.filter((t) => t.isBlocked).length
    const overdueCount = tasks.filter((t) => {
      if (!t.dueDate || t.completedDate) return false
      return parseISO(t.dueDate) < startOfDay(now)
    }).length

    return {
      tasksByStatus,
      tasksByPriority,
      tasksBySource,
      activityOverTime,
      summary: {
        totalTasks: tasks.length,
        completionRate,
        avgTaskAge,
        agentContribution,
        blockedCount,
        overdueCount,
      },
    }
  }, [tasks, columns, activities])

  return {
    data,
    isLoading: tasksLoading || columnsLoading || activitiesLoading,
  }
}
