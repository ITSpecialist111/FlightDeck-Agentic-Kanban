import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { useTask } from "@/hooks/use-tasks"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { PriorityIcon } from "@/components/shared/PriorityIcon"
import { TaskDetailFields } from "./TaskDetailFields"
import { CommentsList } from "./CommentsList"
import { TaskActivityFeed } from "./TaskActivityFeed"

export function TaskDetailPanel() {
  const taskDetailOpen = useUIStore((s) => s.taskDetailOpen)
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)
  const closeTaskDetail = useUIStore((s) => s.closeTaskDetail)

  const { data: task, isLoading } = useTask(selectedTaskId)

  return (
    <DialogPrimitive.Root
      open={taskDetailOpen}
      onOpenChange={(open) => {
        if (!open) closeTaskDetail()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-black/30",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-[480px] max-w-full",
            "bg-background border-l shadow-xl",
            "flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "duration-300"
          )}
          onInteractOutside={(e) => {
            // Allow interaction with popovers/selects that render in portals
            const target = e.target as HTMLElement
            if (target?.closest("[data-radix-popper-content-wrapper]")) {
              e.preventDefault()
            }
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            {isLoading || !task ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <PriorityIcon priority={task.priority} className="size-4" />
                <DialogPrimitive.Title className="text-base font-semibold truncate">
                  {task.title}
                </DialogPrimitive.Title>
              </div>
            )}
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0 ml-2">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          {isLoading || !task ? (
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <Tabs defaultValue="details" className="flex-1 min-h-0 flex flex-col">
              <TabsList className="mx-6 mt-4 w-fit">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <Separator className="mt-2" />
              <TabsContent
                value="details"
                className="flex-1 overflow-y-auto px-6 py-4"
              >
                <TaskDetailFields task={task} />
              </TabsContent>
              <TabsContent
                value="comments"
                className="flex-1 min-h-0 flex flex-col"
              >
                <CommentsList taskId={task.id} />
              </TabsContent>
              <TabsContent
                value="activity"
                className="flex-1 overflow-y-auto px-6 py-4"
              >
                <TaskActivityFeed taskId={task.id} />
              </TabsContent>
            </Tabs>
          )}

          {/* Suppress the default Radix description warning */}
          <DialogPrimitive.Description className="sr-only">
            Task detail panel
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
