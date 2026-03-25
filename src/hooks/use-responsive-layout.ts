import { useState, useEffect } from "react"

interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isCompact: boolean
}

export function useResponsiveLayout(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => ({
    isMobile: typeof window !== "undefined" ? window.innerWidth < 768 : false,
    isTablet: typeof window !== "undefined" ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
    isCompact: typeof window !== "undefined" ? window.innerWidth < 1280 : false,
  }))

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)")
    const tabletQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023px)")
    const desktopQuery = window.matchMedia("(min-width: 1024px)")
    const compactQuery = window.matchMedia("(max-width: 1279px)")

    function update() {
      setState({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: desktopQuery.matches,
        isCompact: compactQuery.matches,
      })
    }

    mobileQuery.addEventListener("change", update)
    tabletQuery.addEventListener("change", update)
    desktopQuery.addEventListener("change", update)
    compactQuery.addEventListener("change", update)

    return () => {
      mobileQuery.removeEventListener("change", update)
      tabletQuery.removeEventListener("change", update)
      desktopQuery.removeEventListener("change", update)
      compactQuery.removeEventListener("change", update)
    }
  }, [])

  return state
}
