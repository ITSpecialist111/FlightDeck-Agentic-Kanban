import {
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
} from "lucide-react"
import type { Priority } from "@/lib/types"
import { PRIORITY_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils"

const ICONS: Record<Priority, typeof ArrowUp> = {
  critical: AlertTriangle,
  high: ArrowUp,
  medium: ArrowRight,
  low: ArrowDown,
}

export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority
  className?: string
}) {
  const Icon = ICONS[priority] ?? Minus
  const config = PRIORITY_CONFIG[priority]

  return (
    <Icon
      className={cn("size-3.5 shrink-0", className)}
      style={{ color: config?.color }}
      aria-label={config?.label}
    />
  )
}
