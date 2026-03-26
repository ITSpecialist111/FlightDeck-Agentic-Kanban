/**
 * DemoProvider — side-effect-only React component that:
 * 1. Seeds mock data on mount
 * 2. Starts the demo orchestrator
 * 3. Pauses on user interaction, resumes after 10s idle
 * 4. Cleans up on unmount
 */
import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { DemoOrchestrator } from "./demo-orchestrator"
import { seedDemoData } from "./demo-seed-data"

const IDLE_RESUME_MS = 10_000 // Resume after 10s of no interaction
const START_DELAY_MS = 2_000 // Wait for initial render before starting

export function DemoProvider() {
  const queryClient = useQueryClient()
  const orchestratorRef = useRef<DemoOrchestrator | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Seed initial data immediately
    seedDemoData()

    // Force all queries to refetch so components pick up the seed data
    queryClient.invalidateQueries()

    // Create orchestrator and start after a short delay
    const orch = new DemoOrchestrator(queryClient)
    orchestratorRef.current = orch

    const startTimer = setTimeout(() => {
      orch.start()
    }, START_DELAY_MS)

    return () => {
      clearTimeout(startTimer)
      orch.stop()
      orchestratorRef.current = null
    }
  }, [queryClient])

  // Pause on user interaction, resume after idle
  useEffect(() => {
    const handleInteraction = () => {
      const orch = orchestratorRef.current
      if (!orch) return

      orch.pause()

      // Clear any existing idle timer
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current)
      }

      // Set new idle timer to resume
      idleTimerRef.current = setTimeout(() => {
        orch.resume()
        idleTimerRef.current = null
      }, IDLE_RESUME_MS)
    }

    window.addEventListener("pointerdown", handleInteraction)
    window.addEventListener("keydown", handleInteraction)

    return () => {
      window.removeEventListener("pointerdown", handleInteraction)
      window.removeEventListener("keydown", handleInteraction)
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [])

  // This component is side-effect-only — no UI
  return null
}
