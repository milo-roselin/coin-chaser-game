import * as React from "react"
import { useDevicePreference } from "@/lib/stores/useDevicePreference"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [autoDetectedMobile, setAutoDetectedMobile] = React.useState<boolean | undefined>(undefined)
  const { getIsMobile } = useDevicePreference()

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      // Enhanced detection for mobile devices and tablets
      const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isTablet = window.innerWidth <= 1024 && hasTouchScreen
      const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      
      setAutoDetectedMobile(isSmallScreen || hasTouchScreen || isTablet || isIPad)
    }
    mql.addEventListener("change", onChange)
    
    // Initialize with comprehensive device detection
    const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isTablet = window.innerWidth <= 1024 && hasTouchScreen
    const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    
    setAutoDetectedMobile(isSmallScreen || hasTouchScreen || isTablet || isIPad)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Use device preference if available, otherwise fall back to auto-detection
  return getIsMobile()
}
