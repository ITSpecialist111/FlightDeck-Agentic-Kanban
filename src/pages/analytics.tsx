import { LayoutDashboard, TrendingUp, Bot, AlertTriangle } from "lucide-react"
import { useBoardStore } from "@/stores/board-store"
import { useAnalytics } from "@/hooks/use-analytics"
import { useTasks } from "@/hooks/use-tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorBoundary, ChartErrorFallback } from "@/components/shared/ErrorBoundary"
import { TasksByStatusChart } from "@/components/analytics/TasksByStatusChart"
import { TasksByPriorityChart } from "@/components/analytics/TasksByPriorityChart"
import { TasksBySourceChart } from "@/components/analytics/TasksBySourceChart"
import { ActivityOverTimeChart } from "@/components/analytics/ActivityOverTimeChart"
import { ChartSkeleton } from "@/components/analytics/ChartSkeleton"
import { TasksDataTable } from "@/components/analytics/TasksDataTable"
import { cn } from "@/lib/utils"

export default function AnalyticsPage() {
  const boardId = useBoardStore((s) => s.currentBoardId)
  const { data, isLoading } = useAnalytics(boardId)
  const { tasks, isLoading: tasksLoading } = useTasks(boardId)

  if (isLoading) {
    return <AnalyticsLoadingSkeleton />
  }

  if (!data) {
    return (
      <div className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-2">
          <LayoutDashboard className="size-10" />
          <p className="text-lg font-medium">No analytics data</p>
          <p className="text-sm">Add some tasks to your board to see analytics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Board performance and task insights
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Tasks"
          value={data.summary.totalTasks.toString()}
          icon={LayoutDashboard}
        />
        <SummaryCard
          title="Completion Rate"
          value={`${data.summary.completionRate}%`}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Agent Contribution"
          value={`${data.summary.agentContribution}%`}
          icon={Bot}
        />
        <SummaryCard
          title="Overdue"
          value={data.summary.overdueCount.toString()}
          icon={AlertTriangle}
          destructive={data.summary.overdueCount > 0}
        />
      </div>

      {/* Tabs: Charts | Data Table */}
      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="data-table">Data Table</TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <ErrorBoundary fallback={<ChartErrorFallback />}>
              <TasksByStatusChart data={data.tasksByStatus} />
            </ErrorBoundary>
            <ErrorBoundary fallback={<ChartErrorFallback />}>
              <TasksByPriorityChart data={data.tasksByPriority} />
            </ErrorBoundary>
            <ErrorBoundary fallback={<ChartErrorFallback />}>
              <TasksBySourceChart data={data.tasksBySource} />
            </ErrorBoundary>
            <ErrorBoundary fallback={<ChartErrorFallback />}>
              <ActivityOverTimeChart data={data.activityOverTime} />
            </ErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="data-table">
          <div className="mt-4">
            {tasksLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <TasksDataTable tasks={tasks} boardId={boardId} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  destructive = false,
}: {
  title: string
  value: string
  icon: typeof LayoutDashboard
  destructive?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            "size-4",
            destructive ? "text-destructive" : "text-muted-foreground"
          )}
        />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold",
            destructive && "text-destructive"
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-[160px]" />
        <Skeleton className="h-4 w-[260px] mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  )
}
