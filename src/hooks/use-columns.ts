import { useQuery } from "@tanstack/react-query"
import { ColumnsService } from "@/services/columns-service"

export function useColumns(boardId: string) {
  const query = useQuery({
    queryKey: ["columns", boardId],
    queryFn: () => ColumnsService.getAll({ boardId }),
    enabled: !!boardId,
  })

  return {
    columns: query.data ?? [],
    isLoading: query.isLoading,
  }
}
