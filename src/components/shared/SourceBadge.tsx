import { Pencil, Mic, Mail, Bot, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { TaskSource } from "@/lib/types"
import { SOURCE_CONFIG } from "@/lib/constants"

const ICONS: Record<string, typeof Pencil> = {
  pencil: Pencil,
  mic: Mic,
  mail: Mail,
  bot: Bot,
  download: Download,
}

export function SourceBadge({ source }: { source: TaskSource }) {
  const config = SOURCE_CONFIG[source]
  if (!config) return null
  const Icon = ICONS[config.icon] ?? Pencil

  return (
    <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0">
      <Icon className="size-2.5" />
      {config.label}
    </Badge>
  )
}
