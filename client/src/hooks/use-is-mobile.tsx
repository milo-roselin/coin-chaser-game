import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      // Check for mobile breakpoint OR touch capability (includes iPad)
      const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsMobile(isSmallScreen || hasTouchScreen)
    }
    mql.addEventListener("change", onChange)
    // Initialize with both screen size and touch capability check
    const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsMobile(isSmallScreen || hasTouchScreen)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
