import { useState, useRef, type KeyboardEvent } from "react"
import { formatDistanceToNow } from "date-fns"
import { useComments } from "@/hooks/use-comments"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot, Send } from "lucide-react"

export function CommentsList({ taskId }: { taskId: string }) {
  const { comments, isLoading, addComment } = useComments(taskId)
  const [content, setContent] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed) return
    addComment.mutate(
      { taskId, content: trimmed },
      {
        onSuccess: () => {
          setContent("")
          // Scroll to bottom after new comment
          setTimeout(() => {
            scrollRef.current?.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: "smooth",
            })
          }, 100)
        },
      }
    )
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Comment list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Start the conversation below.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "flex gap-3",
                comment.isAgent && "border-l-2 border-primary pl-3"
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <UserAvatar name={comment.authorName} size="md" />
                {comment.isAgent && (
                  <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot className="size-2.5" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium truncate">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(comment.createdOn), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="border-t px-6 py-3 shrink-0">
        <div className="flex gap-2">
          <Textarea
            placeholder="Write a comment... (Ctrl+Enter to send)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm min-h-10 max-h-32 resize-none"
            rows={2}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!content.trim() || addComment.isPending}
            className="shrink-0 self-end"
          >
            <Send className="size-4" />
            <span className="sr-only">Send comment</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
