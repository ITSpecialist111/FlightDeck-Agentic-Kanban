import { Building2, ChevronsLeft, ChevronsRight, LayoutDashboard, BarChart3, Settings } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useBoardStore } from "@/stores/board-store"
import { useUIStore } from "@/stores/ui-store"
import { useOrganizations, useProjects, useBoards } from "@/hooks/use-navigation"

export function Sidebar() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebarCollapsed = useUIStore((s) => s.toggleSidebarCollapsed)
  const location = useLocation()
  const navigate = useNavigate()

  const currentOrgId = useBoardStore((s) => s.currentOrgId)
  const currentProjectId = useBoardStore((s) => s.currentProjectId)
  const currentBoardId = useBoardStore((s) => s.currentBoardId)
  const setCurrentOrg = useBoardStore((s) => s.setCurrentOrg)
  const setCurrentProject = useBoardStore((s) => s.setCurrentProject)
  const setCurrentBoardId = useBoardStore((s) => s.setCurrentBoardId)

  const { data: organizations } = useOrganizations()
  const { data: projects } = useProjects(currentOrgId)

  const currentOrg = organizations?.find((o) => o.id === currentOrgId)

  return (
    <aside
      aria-label="Project navigation"
      className={cn(
        "shrink-0 border-r bg-card/50 flex flex-col transition-all duration-200 overflow-hidden",
        sidebarCollapsed ? "w-14" : "w-56"
      )}
    >
      {/* Organisation selector */}
      <div className="px-2 pt-3 pb-2 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 h-9",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <Building2 className="size-4 shrink-0 text-primary" />
              {!sidebarCollapsed && (
                <span className="truncate text-sm font-medium">
                  {currentOrg?.name ?? "Select Org"}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            {organizations?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => setCurrentOrg(org.id)}
                className={cn(
                  org.id === currentOrgId && "bg-accent"
                )}
              >
                <Building2 className="size-4 mr-2" />
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Projects and boards */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {projects?.map((project) => (
          <ProjectSection
            key={project.id}
            projectId={project.id}
            projectName={project.name}
            projectColor={project.color}
            isCurrentProject={project.id === currentProjectId}
            currentBoardId={currentBoardId}
            collapsed={sidebarCollapsed}
            isOnBoard={location.pathname === "/"}
            onSelectProject={setCurrentProject}
            onSelectBoard={(id) => {
              setCurrentBoardId(id)
              if (location.pathname !== "/") navigate("/")
            }}
          />
        ))}
      </nav>

      {/* Analytics link */}
      <div className="px-2">
        <Separator className="mb-2" />
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/analytics"
                className={cn(
                  "flex items-center justify-center w-full h-8 rounded-md transition-colors",
                  location.pathname === "/analytics"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <BarChart3 className="size-4 shrink-0" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Analytics</TooltipContent>
          </Tooltip>
        ) : (
          <Link
            to="/analytics"
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
              location.pathname === "/analytics"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <BarChart3 className="size-4 shrink-0" />
            <span>Analytics</span>
          </Link>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebarCollapsed}
          className={cn(
            "w-full h-8",
            sidebarCollapsed ? "justify-center px-0" : "justify-start gap-2"
          )}
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <>
              <ChevronsLeft className="size-4" />
              <span className="text-xs text-muted-foreground">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}

function ProjectSection({
  projectId,
  projectName,
  projectColor,
  isCurrentProject,
  currentBoardId,
  collapsed,
  isOnBoard,
  onSelectProject,
  onSelectBoard,
}: {
  projectId: string
  projectName: string
  projectColor: string
  isCurrentProject: boolean
  currentBoardId: string
  collapsed: boolean
  isOnBoard: boolean
  onSelectProject: (id: string) => void
  onSelectBoard: (id: string) => void
}) {
  const { data: boards } = useBoards(projectId)

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onSelectProject(projectId)}
            className={cn(
              "flex items-center justify-center w-full h-8 rounded-md transition-colors",
              isCurrentProject ? "bg-accent" : "hover:bg-accent/50"
            )}
          >
            <div
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: projectColor }}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{projectName}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="space-y-0.5">
      {/* Project name */}
      <div className="flex items-center group">
        <button
          onClick={() => onSelectProject(projectId)}
          className={cn(
            "flex items-center gap-2 flex-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors min-w-0",
            isCurrentProject
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <div
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: projectColor }}
          />
          <span className="truncate">{projectName}</span>
        </button>
        <Link
          to={`/settings/project/${projectId}`}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground transition-opacity"
        >
          <Settings className="size-3" />
        </Link>
      </div>

      {/* Boards under this project */}
      {boards?.map((board) => (
        <div key={board.id} className="flex items-center group">
          <button
            onClick={() => {
              onSelectProject(projectId)
              onSelectBoard(board.id)
            }}
            className={cn(
              "flex items-center gap-2 flex-1 pl-6 pr-1 py-1 rounded-md text-sm transition-colors min-w-0",
              board.id === currentBoardId && isOnBoard
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <LayoutDashboard className="size-3.5 shrink-0" />
            <span className="truncate">{board.name}</span>
          </button>
          <Link
            to={`/settings/board/${board.id}`}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Settings className="size-3" />
          </Link>
        </div>
      ))}
    </div>
  )
}
