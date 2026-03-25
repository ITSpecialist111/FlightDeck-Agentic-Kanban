import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChatService } from "@/services/chat-service"

export function useChat() {
  const queryClient = useQueryClient()

  const conversationQuery = useQuery({
    queryKey: ["chat", "conversation"],
    queryFn: () => ChatService.getConversation(),
  })

  const sendMessage = useMutation({
    mutationFn: (content: string) => ChatService.sendMessage(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversation"] })
    },
  })

  const clearConversation = useMutation({
    mutationFn: () => ChatService.clearConversation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversation"] })
    },
  })

  return {
    messages: conversationQuery.data?.messages ?? [],
    isLoading: conversationQuery.isLoading,
    sendMessage,
    clearConversation,
    isSending: sendMessage.isPending,
  }
}
