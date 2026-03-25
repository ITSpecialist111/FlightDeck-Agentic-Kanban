import { useQuery } from "@tanstack/react-query"
import { OrganizationsService } from "@/services/organizations-service"
import { ProjectsService } from "@/services/projects-service"
import { BoardsService } from "@/services/boards-service"

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => OrganizationsService.getAll(),
  })
}

export function useProjects(orgId: string) {
  return useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => ProjectsService.getAll({ organizationId: orgId }),
    enabled: !!orgId,
  })
}

export function useBoards(projectId: string) {
  return useQuery({
    queryKey: ["boards", projectId],
    queryFn: () => BoardsService.getAll({ projectId }),
    enabled: !!projectId,
  })
}
