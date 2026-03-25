import { create } from "zustand"

interface BoardState {
  currentOrgId: string
  currentProjectId: string
  currentBoardId: string
  setCurrentOrg: (id: string) => void
  setCurrentProject: (id: string) => void
  setCurrentBoardId: (id: string) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  currentOrgId: "93ea2089-1928-f111-8341-000d3a3b1746",
  currentProjectId: "b3ec2089-1928-f111-8341-000d3a3b1746",
  currentBoardId: "4908e091-1928-f111-8341-000d3a3b1746",
  setCurrentOrg: (id) => set({ currentOrgId: id }),
  setCurrentProject: (id) => set({ currentProjectId: id }),
  setCurrentBoardId: (id) => set({ currentBoardId: id }),
}))
