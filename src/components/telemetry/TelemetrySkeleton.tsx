import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export function TelemetrySkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Agent Status skeleton */}
      <div className="px-4 py-3">
        <Skeleton className="h-3.5 w-24 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-1.5 rounded-full" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="ml-auto h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Board Metrics skeleton */}
      <div className="px-4 py-3">
        <Skeleton className="h-3.5 w-24 mb-3" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-md border bg-background p-2">
              <Skeleton className="h-5 w-8 mb-1" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-2.5 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>

      <Separator />

      {/* Activity Timeline skeleton */}
      <div className="px-4 py-3">
        <Skeleton className="h-3.5 w-24 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-[15px] shrink-0 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
