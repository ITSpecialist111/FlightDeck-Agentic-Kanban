/**
 * DemoOrchestrator — drives the auto-animation timeline.
 * Executes DemoAction[] sequentially, interacts with:
 * - Mock dataverse store (data mutations)
 * - TanStack Query client (cache invalidation → re-render)
 * - Zustand UI store (panel toggles)
 * - Chat service (message injection)
 */
import type { QueryClient } from "@tanstack/react-query"
import type { DemoAction } from "./demo-script"
import { DEMO_SCRIPT } from "./demo-script"
import { seedDemoData } from "./demo-seed-data"
import {
  seedRecord,
  getAllRecords,
  clearAllTables,
  updateRecord,
} from "./mock-dataverse-client"
import { useUIStore } from "@/stores/ui-store"

// ---------------------------------------------------------------------------
// Chat injection helper
// ---------------------------------------------------------------------------

// We import ChatService lazily to avoid circular deps
let _chatServiceModule: typeof import("@/services/chat-service") | null = null

async function getChatService() {
  if (!_chatServiceModule) {
    _chatServiceModule = await import("@/services/chat-service")
  }
  return _chatServiceModule.ChatService
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export class DemoOrchestrator {
  private running = false
  private paused = false
  private currentStep = 0
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private queryClient: QueryClient

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  start(): void {
    this.running = true
    this.paused = false
    this.currentStep = 0
    this.tick()
  }

  stop(): void {
    this.running = false
    this.paused = false
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  pause(): void {
    if (!this.running) return
    this.paused = true
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  resume(): void {
    if (!this.running || !this.paused) return
    this.paused = false
    this.tick()
  }

  private async tick(): Promise<void> {
    if (!this.running || this.paused) return

    // Loop: if we've finished the script, reset and start over
    if (this.currentStep >= DEMO_SCRIPT.length) {
      await this.reset()
      this.currentStep = 0
      // Wait before restarting the loop
      this.timeoutId = setTimeout(() => this.tick(), 5000)
      return
    }

    const action = DEMO_SCRIPT[this.currentStep]
    this.currentStep++

    if (action.type === "wait") {
      this.timeoutId = setTimeout(() => this.tick(), action.ms)
      return
    }

    await this.executeAction(action)

    // Small delay between non-wait actions for visual pacing
    this.timeoutId = setTimeout(() => this.tick(), 150)
  }

  private async executeAction(action: DemoAction): Promise<void> {
    switch (action.type) {
      case "create_task": {
        seedRecord("mc_tasks", action.id, {
          ...action.data,
          createdon: new Date().toISOString(),
          modifiedon: new Date().toISOString(),
        })
        this.invalidateQueries(["tasks"])
        break
      }

      case "move_task": {
        const tasks = getAllRecords("mc_tasks")
        const task = tasks.find(
          (t) => t.mc_taskid === action.taskId,
        )
        if (task) {
          await updateRecord<Record<string, unknown>, Record<string, unknown>>(
            "mc_tasks",
            action.taskId,
            { _mc_columnlookup_value: action.toColumn },
          )
        }
        this.invalidateQueries(["tasks"])
        break
      }

      case "update_task": {
        await updateRecord<Record<string, unknown>, Record<string, unknown>>(
          "mc_tasks",
          action.taskId,
          action.changes,
        )
        this.invalidateQueries(["tasks"])
        break
      }

      case "create_agent_action": {
        seedRecord("mc_agentactions", action.id, {
          ...action.data,
          mc_agentactionid: action.id,
          createdon: new Date().toISOString(),
        })
        this.invalidateQueries(["agent-actions"])
        break
      }

      case "update_agent_action": {
        await updateRecord<Record<string, unknown>, Record<string, unknown>>(
          "mc_agentactions",
          action.id,
          action.changes,
        )
        this.invalidateQueries(["agent-actions"])
        break
      }

      case "create_activity": {
        seedRecord("mc_activitylogs", action.id, {
          ...action.data,
          mc_activitylogid: action.id,
          createdon: new Date().toISOString(),
        })
        this.invalidateQueries(["activity"])
        break
      }

      case "inject_chat": {
        const chatService = await getChatService()
        // Access the conversation directly and inject the message
        const conv = await chatService.getConversation()
        conv.messages.push({
          id: `msg-demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: action.role,
          content: action.content,
          agentName: action.agentName ?? null,
          createdOn: new Date().toISOString(),
        })
        this.invalidateQueries(["chat"])
        break
      }

      case "open_chat": {
        const uiState = useUIStore.getState()
        if (!uiState.chatPanelOpen) {
          uiState.toggleChatPanel()
        }
        break
      }

      case "close_chat": {
        const uiState = useUIStore.getState()
        if (uiState.chatPanelOpen) {
          uiState.toggleChatPanel()
        }
        break
      }

      case "open_task_detail": {
        useUIStore.getState().openTaskDetail(action.taskId)
        break
      }

      case "close_task_detail": {
        useUIStore.getState().closeTaskDetail()
        break
      }
    }
  }

  private invalidateQueries(keys: string[]): void {
    for (const key of keys) {
      this.queryClient.invalidateQueries({ queryKey: [key] })
    }
  }

  private async reset(): Promise<void> {
    // Clear all data and re-seed
    clearAllTables()
    seedDemoData()

    // Clear chat conversation
    try {
      const chatService = await getChatService()
      await chatService.clearConversation()
    } catch {
      // Chat service may not be loaded yet — OK
    }

    // Reset UI state
    const ui = useUIStore.getState()
    if (ui.chatPanelOpen) ui.toggleChatPanel()
    if (ui.taskDetailOpen) ui.closeTaskDetail()
    if (!ui.telemetryBladeOpen) ui.toggleTelemetryBlade()

    // Invalidate everything
    this.queryClient.invalidateQueries()
  }
}
