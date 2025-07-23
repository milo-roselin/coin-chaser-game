import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DeviceType = 'phone' | 'tablet' | 'desktop' | 'auto';

interface DevicePreferenceState {
  selectedDevice: DeviceType;
  setSelectedDevice: (device: DeviceType) => void;
  getScreenDimensions: () => { width: number; height: number };
  getIsMobile: () => boolean;
}

export const useDevicePreference = create<DevicePreferenceState>()(
  persist(
    (set, get) => ({
      selectedDevice: 'auto',
      
      setSelectedDevice: (device: DeviceType) => {
        set({ selectedDevice: device });
      },
      
      getScreenDimensions: () => {
        const { selectedDevice } = get();
        
        switch (selectedDevice) {
          case 'phone':
            return { width: 375, height: 667 }; // iPhone dimensions
          case 'tablet':
            return { width: 768, height: 1024 }; // iPad dimensions
          case 'desktop':
            return { width: 1920, height: 1080 }; // Desktop dimensions
          case 'auto':
          default:
            return { width: window.innerWidth, height: window.innerHeight };
        }
      },
      
      getIsMobile: () => {
        const { selectedDevice } = get();
        
        switch (selectedDevice) {
          case 'phone':
          case 'tablet':
            return true;
          case 'desktop':
            return false;
          case 'auto':
          default:
            // Fall back to original detection logic
            const isSmallScreen = window.innerWidth < 768;
            const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isTablet = window.innerWidth <= 1024 && hasTouchScreen;
            const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            
            return isSmallScreen || hasTouchScreen || isTablet || isIPad;
        }
      }
    }),
    {
      name: 'device-preference-storage',
      version: 1,
    }
  )
);