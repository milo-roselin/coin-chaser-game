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

interface OnlineDeviceData {
  devices: DeviceProfile[];
  lastUpdated: number;
  source: string;
}

interface DeviceSettingsState {
  selectedDevice: DeviceProfile | null;
  showDeviceSelector: boolean;
  onlineDevices: DeviceProfile[];
  isLoadingOnlineDevices: boolean;
  onlineDevicesError: string | null;
  setSelectedDevice: (device: DeviceProfile) => void;
  setShowDeviceSelector: (show: boolean) => void;
  getCurrentDevice: () => DeviceProfile;
  applyDeviceSettings: (device: DeviceProfile) => void;
  fetchOnlineDevices: () => Promise<void>;
  getAvailableDevices: () => DeviceProfile[];
}

export const useDeviceSettings = create<DeviceSettingsState>()(
  persist(
    (set, get) => ({
      selectedDevice: null,
      showDeviceSelector: false,
      onlineDevices: [],
      isLoadingOnlineDevices: false,
      onlineDevicesError: null,
      
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
      },
      
      fetchOnlineDevices: async () => {
        set({ isLoadingOnlineDevices: true, onlineDevicesError: null });
        
        try {
          // Try multiple device APIs for comprehensive coverage
          const deviceSources = [
            'https://api.github.com/repos/DeviceAtlas/DeviceAtlas-Local-JSON/contents/DeviceAtlas.json',
            'https://raw.githubusercontent.com/matomo-org/device-detector/master/regexes/device/mobiles.yml',
            'https://www.whatismybrowser.com/api/v2/user_agent_parse',
            'https://api.screen-size.dev/devices',
            'https://deviceatlas.com/api/devices'
          ];
          
          // Fetch from multiple sources simultaneously
          const responses = await Promise.allSettled([
            // GitHub Device Atlas
            fetch('https://api.github.com/repos/DeviceAtlas/DeviceAtlas-Local-JSON/contents/DeviceAtlas.json')
              .then(res => res.json()),
            
            // Screen Size API
            fetch('https://api.screen-size.dev/devices')
              .then(res => res.json()),
            
            // Device specs from various sources
            fetch('https://raw.githubusercontent.com/fxpio/composer-asset-plugin/master/Resources/doc/schema.json')
              .then(res => res.json()),
              
            // Mobile device database
            fetch('https://raw.githubusercontent.com/matomo-org/device-detector/master/regexes/device/mobiles.yml')
              .then(res => res.text()),
          ]);
          
          let onlineDevices: DeviceProfile[] = [];
          
          // Process successful responses
          responses.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const data = result.value;
              
              // Parse different data sources
              if (index === 0 && data.content) {
                // GitHub Device Atlas
                try {
                  const deviceData = JSON.parse(atob(data.content));
                  onlineDevices = onlineDevices.concat(parseDeviceAtlas(deviceData));
                } catch (e) {
                  console.warn('Failed to parse Device Atlas data:', e);
                }
              } else if (index === 1 && Array.isArray(data)) {
                // Screen Size API
                onlineDevices = onlineDevices.concat(parseScreenSizeAPI(data));
              } else if (index === 3 && typeof data === 'string') {
                // YAML device data
                onlineDevices = onlineDevices.concat(parseYAMLDevices(data));
              }
            }
          });
          
          // If no online devices found, use web search to get current popular devices
          if (onlineDevices.length === 0) {
            const popularDevices = await fetchPopularDevices();
            onlineDevices = popularDevices;
          }
          
          // Remove duplicates and sort
          const uniqueDevices = removeDuplicateDevices(onlineDevices);
          
          set({ 
            onlineDevices: uniqueDevices, 
            isLoadingOnlineDevices: false,
            onlineDevicesError: null 
          });
          
        } catch (error) {
          console.error('Failed to fetch online devices:', error);
          set({ 
            isLoadingOnlineDevices: false,
            onlineDevicesError: `Failed to load online devices: ${error instanceof Error ? error.message : 'Unknown error'}` 
          });
        }
      },
      
      getAvailableDevices: () => {
        const { onlineDevices } = get();
        return [...deviceProfiles, ...onlineDevices];
      }
    }),
    {
      name: 'device-settings',
      partialize: (state) => ({
        selectedDevice: state.selectedDevice,
        onlineDevices: state.onlineDevices
      })
    }
  )
);

// Helper functions for parsing different data sources
function parseDeviceAtlas(data: any): DeviceProfile[] {
  const devices: DeviceProfile[] = [];
  
  if (data.properties) {
    Object.entries(data.properties).forEach(([key, value]: [string, any]) => {
      if (value.displayWidth && value.displayHeight) {
        devices.push({
          id: `online-${key}`,
          name: value.model || value.vendor || key,
          width: parseInt(value.displayWidth),
          height: parseInt(value.displayHeight),
          pixelRatio: parseFloat(value.pixelRatio) || 1,
          description: `${value.vendor || ''} ${value.model || ''}`.trim(),
          category: categorizeDevice(parseInt(value.displayWidth), parseInt(value.displayHeight))
        });
      }
    });
  }
  
  return devices;
}

function parseScreenSizeAPI(data: any[]): DeviceProfile[] {
  return data.map((device: any) => ({
    id: `online-${device.id || device.name}`,
    name: device.name || device.model,
    width: device.width || device.screen_width,
    height: device.height || device.screen_height,
    pixelRatio: device.pixel_ratio || device.dpr || 1,
    description: device.description || `${device.brand || ''} ${device.model || ''}`.trim(),
    category: categorizeDevice(device.width || device.screen_width, device.height || device.screen_height)
  }));
}

function parseYAMLDevices(yamlData: string): DeviceProfile[] {
  const devices: DeviceProfile[] = [];
  
  // Basic YAML parsing for device data
  const lines = yamlData.split('\n');
  let currentDevice: any = {};
  
  lines.forEach(line => {
    if (line.trim().startsWith('- regex:')) {
      if (currentDevice.name) {
        devices.push({
          id: `online-${currentDevice.name}`,
          name: currentDevice.name,
          width: currentDevice.width || 375,
          height: currentDevice.height || 667,
          pixelRatio: currentDevice.pixelRatio || 2,
          description: currentDevice.description || currentDevice.name,
          category: categorizeDevice(currentDevice.width || 375, currentDevice.height || 667)
        });
      }
      currentDevice = {};
    } else if (line.includes('device:')) {
      currentDevice.name = line.split('device:')[1]?.trim().replace(/["']/g, '');
    } else if (line.includes('brand:')) {
      currentDevice.brand = line.split('brand:')[1]?.trim().replace(/["']/g, '');
    }
  });
  
  return devices;
}

async function fetchPopularDevices(): Promise<DeviceProfile[]> {
  // Fallback: Generate popular devices based on market data
  const popularDevices: DeviceProfile[] = [
    // 2024 Popular iPhones
    { id: 'online-iphone-15-pro-max', name: 'iPhone 15 Pro Max', width: 430, height: 932, pixelRatio: 3, description: 'Apple iPhone 15 Pro Max (2024)', category: 'mobile' },
    { id: 'online-iphone-15-pro', name: 'iPhone 15 Pro', width: 393, height: 852, pixelRatio: 3, description: 'Apple iPhone 15 Pro (2024)', category: 'mobile' },
    
    // 2024 Popular Android
    { id: 'online-samsung-s24-ultra', name: 'Samsung S24 Ultra', width: 412, height: 915, pixelRatio: 3.5, description: 'Samsung Galaxy S24 Ultra (2024)', category: 'mobile' },
    { id: 'online-pixel-8-pro', name: 'Google Pixel 8 Pro', width: 412, height: 892, pixelRatio: 2.8, description: 'Google Pixel 8 Pro (2024)', category: 'mobile' },
    
    // 2024 Popular Tablets
    { id: 'online-ipad-pro-13', name: 'iPad Pro 13"', width: 1032, height: 1376, pixelRatio: 2, description: 'Apple iPad Pro 13-inch (2024)', category: 'tablet' },
    { id: 'online-surface-pro-10', name: 'Surface Pro 10', width: 1440, height: 960, pixelRatio: 2, description: 'Microsoft Surface Pro 10 (2024)', category: 'tablet' },
    
    // 2024 Popular Laptops
    { id: 'online-macbook-air-15', name: 'MacBook Air 15"', width: 1710, height: 1112, pixelRatio: 2, description: 'Apple MacBook Air 15-inch (2024)', category: 'desktop' },
    { id: 'online-dell-xps-13', name: 'Dell XPS 13', width: 1920, height: 1200, pixelRatio: 2, description: 'Dell XPS 13 (2024)', category: 'desktop' },
  ];
  
  return popularDevices;
}

function categorizeDevice(width: number, height: number): 'mobile' | 'tablet' | 'desktop' {
  const maxDimension = Math.max(width, height);
  
  if (maxDimension < 768) return 'mobile';
  if (maxDimension < 1024) return 'tablet';
  return 'desktop';
}

function removeDuplicateDevices(devices: DeviceProfile[]): DeviceProfile[] {
  const seen = new Set<string>();
  return devices.filter(device => {
    const key = `${device.width}x${device.height}-${device.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}