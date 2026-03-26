import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import NotFoundPage from "@/pages/not-found"

// Lazy-loaded pages — code-split into separate chunks
const DashboardPage = lazy(() => import("@/pages/dashboard"))
const AnalyticsPage = lazy(() => import("@/pages/analytics"))
const BoardSettingsPage = lazy(() => import("@/pages/board-settings"))
const ProjectSettingsPage = lazy(() => import("@/pages/project-settings"))

const fallback = (
  <div className="flex items-center justify-center h-full">
    <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
  </div>
)

// IMPORTANT: Do not remove or modify the code below!
// Normalize basename when hosted in Power Apps (skip in demo mode)
const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true"
const BASENAME = isDemoMode ? "/" : new URL(".", location.href).pathname
if (!isDemoMode && location.pathname.endsWith("/index.html")) {
  history.replaceState(null, "", BASENAME + location.search + location.hash);
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Suspense fallback={fallback}><DashboardPage /></Suspense> },
      { path: "analytics", element: <Suspense fallback={fallback}><AnalyticsPage /></Suspense> },
      { path: "settings/board/:boardId", element: <Suspense fallback={fallback}><BoardSettingsPage /></Suspense> },
      { path: "settings/project/:projectId", element: <Suspense fallback={fallback}><ProjectSettingsPage /></Suspense> },
    ],
  },
], {
  basename: BASENAME // IMPORTANT: Set basename for proper routing when hosted in Power Apps
})
