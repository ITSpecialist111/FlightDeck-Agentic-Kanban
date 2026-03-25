import { useMemo } from "react"
import { Pie, PieChart, Cell, Label } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface TasksByPriorityChartProps {
  data: Array<{ priority: string; count: number; color: string }>
}

export function TasksByPriorityChart({ data }: TasksByPriorityChartProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.count, 0),
    [data]
  )

  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {}
    for (const item of data) {
      config[item.priority] = {
        label: item.priority,
        color: item.color,
      }
    }
    return config
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Priority</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
          <PieChart accessibilityLayer>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="priority" hideLabel />}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="priority"
              innerRadius="60%"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Tasks
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="priority" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
