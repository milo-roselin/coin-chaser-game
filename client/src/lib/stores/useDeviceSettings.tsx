import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DeviceProfile {
  id: string;
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  description: string;
  category: 'mobile' | 'tablet' | 'desktop';
}

export const deviceProfiles: DeviceProfile[] = [
  // Mobile Devices
  { id: 'iphone-15', name: 'iPhone 15', width: 393, height: 852, pixelRatio: 3, description: 'iPhone 15 / 15 Pro', category: 'mobile' },
  { id: 'iphone-14', name: 'iPhone 14', width: 390, height: 844, pixelRatio: 3, description: 'iPhone 14 / 14 Pro', category: 'mobile' },
  { id: 'iphone-13', name: 'iPhone 13', width: 390, height: 844, pixelRatio: 3, description: 'iPhone 13 / 13 Pro', category: 'mobile' },
  { id: 'iphone-12', name: 'iPhone 12', width: 390, height: 844, pixelRatio: 3, description: 'iPhone 12 / 12 Pro', category: 'mobile' },
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, pixelRatio: 2, description: 'iPhone SE (2nd/3rd gen)', category: 'mobile' },
  { id: 'samsung-s24', name: 'Samsung S24', width: 384, height: 854, pixelRatio: 3, description: 'Samsung Galaxy S24', category: 'mobile' },
  { id: 'samsung-s23', name: 'Samsung S23', width: 360, height: 780, pixelRatio: 3, description: 'Samsung Galaxy S23', category: 'mobile' },
  { id: 'pixel-8', name: 'Pixel 8', width: 412, height: 915, pixelRatio: 2.6, description: 'Google Pixel 8', category: 'mobile' },
  { id: 'pixel-7', name: 'Pixel 7', width: 412, height: 915, pixelRatio: 2.6, description: 'Google Pixel 7', category: 'mobile' },
  
  // Tablets
  { id: 'ipad-pro-12', name: 'iPad Pro 12.9"', width: 1024, height: 1366, pixelRatio: 2, description: 'iPad Pro 12.9-inch', category: 'tablet' },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"', width: 834, height: 1194, pixelRatio: 2, description: 'iPad Pro 11-inch', category: 'tablet' },
  { id: 'ipad-air', name: 'iPad Air', width: 820, height: 1180, pixelRatio: 2, description: 'iPad Air 10.9-inch', category: 'tablet' },
  { id: 'ipad-mini', name: 'iPad Mini', width: 744, height: 1133, pixelRatio: 2, description: 'iPad Mini 8.3-inch', category: 'tablet' },
  { id: 'ipad-regular', name: 'iPad', width: 810, height: 1080, pixelRatio: 2, description: 'iPad 10.2-inch', category: 'tablet' },
  { id: 'surface-pro', name: 'Surface Pro', width: 912, height: 1368, pixelRatio: 2, description: 'Microsoft Surface Pro', category: 'tablet' },
  { id: 'galaxy-tab-s9', name: 'Galaxy Tab S9', width: 800, height: 1280, pixelRatio: 2, description: 'Samsung Galaxy Tab S9', category: 'tablet' },
  
  // Desktop/Laptop
  { id: 'desktop-1080', name: 'Desktop 1080p', width: 1920, height: 1080, pixelRatio: 1, description: 'Standard 1080p Desktop', category: 'desktop' },
  { id: 'desktop-1440', name: 'Desktop 1440p', width: 2560, height: 1440, pixelRatio: 1, description: 'QHD Desktop Display', category: 'desktop' },
  { id: 'desktop-4k', name: 'Desktop 4K', width: 3840, height: 2160, pixelRatio: 1, description: '4K Desktop Display', category: 'desktop' },
  { id: 'macbook-air', name: 'MacBook Air', width: 1440, height: 900, pixelRatio: 2, description: 'MacBook Air 13-inch', category: 'desktop' },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14"', width: 1512, height: 982, pixelRatio: 2, description: 'MacBook Pro 14-inch', category: 'desktop' },
  { id: 'macbook-pro-16', name: 'MacBook Pro 16"', width: 1728, height: 1117, pixelRatio: 2, description: 'MacBook Pro 16-inch', category: 'desktop' },
  { id: 'surface-laptop', name: 'Surface Laptop', width: 1536, height: 1024, pixelRatio: 1.5, description: 'Microsoft Surface Laptop', category: 'desktop' },
  { id: 'auto-detect', name: 'Auto Detect', width: 0, height: 0, pixelRatio: 1, description: 'Use device native settings', category: 'desktop' }
];

interface DeviceSettingsState {
  selectedDevice: DeviceProfile | null;
  showDeviceSelector: boolean;
  setSelectedDevice: (device: DeviceProfile) => void;
  setShowDeviceSelector: (show: boolean) => void;
  getCurrentDevice: () => DeviceProfile;
  applyDeviceSettings: (device: DeviceProfile) => void;
}

export const useDeviceSettings = create<DeviceSettingsState>()(
  persist(
    (set, get) => ({
      selectedDevice: null,
      showDeviceSelector: false,
      
      setSelectedDevice: (device: DeviceProfile) => {
        set({ selectedDevice: device });
        get().applyDeviceSettings(device);
      },
      
      setShowDeviceSelector: (show: boolean) => {
        set({ showDeviceSelector: show });
      },
      
      getCurrentDevice: () => {
        const { selectedDevice } = get();
        if (selectedDevice && selectedDevice.id !== 'auto-detect') {
          return selectedDevice;
        }
        
        // Auto-detect current device
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;
        
        return {
          id: 'current-device',
          name: 'Current Device',
          width,
          height,
          pixelRatio,
          description: `${width}x${height} (${pixelRatio}x)`,
          category: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
        };
      },
      
      applyDeviceSettings: (device: DeviceProfile) => {
        if (device.id === 'auto-detect') {
          // Reset to natural window size
          document.body.style.width = '';
          document.body.style.height = '';
          document.body.style.transform = '';
          document.body.style.transformOrigin = '';
          return;
        }
        
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        
        // Calculate scale to fit device dimensions within current window
        const scaleX = currentWidth / device.width;
        const scaleY = currentHeight / device.height;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
        
        // Apply device dimensions with scaling
        document.body.style.width = `${device.width}px`;
        document.body.style.height = `${device.height}px`;
        document.body.style.transform = `scale(${scale})`;
        document.body.style.transformOrigin = 'top left';
        
        // Update viewport meta tag if it exists
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 
            `width=${device.width}, height=${device.height}, initial-scale=${scale}, maximum-scale=${scale}, user-scalable=no`
          );
        }
      }
    }),
    {
      name: 'device-settings',
      partialize: (state) => ({
        selectedDevice: state.selectedDevice
      })
    }
  )
);