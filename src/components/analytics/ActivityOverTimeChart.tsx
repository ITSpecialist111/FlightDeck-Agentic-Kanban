import { Area, AreaChart, XAxis, YAxis } from "recharts"
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

interface ActivityOverTimeChartProps {
  data: Array<{ date: string; total: number; agent: number; human: number }>
}

const chartConfig: ChartConfig = {
  agent: {
    label: "Agent",
    color: "hsl(var(--primary))",
  },
  human: {
    label: "Human",
    color: "var(--chart-2)",
  },
}

export function ActivityOverTimeChart({ data }: ActivityOverTimeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart data={data} accessibilityLayer>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Area
              dataKey="agent"
              type="monotone"
              fill="var(--color-agent)"
              fillOpacity={0.4}
              stroke="var(--color-agent)"
              stackId="a"
            />
            <Area
              dataKey="human"
              type="monotone"
              fill="var(--color-human)"
              fillOpacity={0.4}
              stroke="var(--color-human)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
