import { useState, useEffect } from 'react';
import { useDeviceSettings, deviceProfiles, DeviceProfile } from '@/lib/stores/useDeviceSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Monitor, Tablet, Smartphone, X, Check, RefreshCw, Wifi, AlertCircle, Plus } from 'lucide-react';

interface DeviceSelectorProps {
  onClose: () => void;
}

export default function DeviceSelector({ onClose }: DeviceSelectorProps) {
  const { 
    selectedDevice, 
    setSelectedDevice, 
    getCurrentDevice, 
    getAvailableDevices,
    fetchOnlineDevices,
    isLoadingOnlineDevices,
    onlineDevicesError,
    onlineDevices,
    addCustomDevice
  } = useDeviceSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'mobile' | 'tablet' | 'desktop'>('all');
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    width: '',
    height: '',
    pixelRatio: '1',
    description: '',
    category: 'mobile' as 'mobile' | 'tablet' | 'desktop'
  });

  const currentDevice = getCurrentDevice();
  const allDevices = getAvailableDevices();

  useEffect(() => {
    // Fetch online devices when component mounts, but don't await it
    if (onlineDevices.length === 0) {
      fetchOnlineDevices().catch(err => {
        console.warn('Failed to fetch online devices:', err);
      });
    }
  }, []);

  const filteredDevices = allDevices.filter(device => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = device.name.toLowerCase().includes(searchLower) ||
                         device.description.toLowerCase().includes(searchLower) ||
                         device.id.toLowerCase().includes(searchLower) ||
                         `${device.width}x${device.height}`.includes(searchLower) ||
                         device.width.toString().includes(searchLower) ||
                         device.height.toString().includes(searchLower);
    const matchesCategory = activeCategory === 'all' || device.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddCustomDevice = () => {
    if (newDevice.name && newDevice.width && newDevice.height) {
      const customDevice: DeviceProfile = {
        id: `custom-${Date.now()}`,
        name: newDevice.name,
        width: parseInt(newDevice.width),
        height: parseInt(newDevice.height),
        pixelRatio: parseFloat(newDevice.pixelRatio),
        description: newDevice.description || `Custom ${newDevice.name}`,
        category: newDevice.category
      };
      
      // Add to the store's custom devices
      addCustomDevice(customDevice);
      setSelectedDevice(customDevice);
      setShowAddDevice(false);
      
      // Reset form
      setNewDevice({
        name: '',
        width: '',
        height: '',
        pixelRatio: '1',
        description: '',
        category: 'mobile'
      });
    }
  };

  const handleDeviceSelect = (device: DeviceProfile) => {
    setSelectedDevice(device);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mobile': return 'bg-green-100 text-green-800';
      case 'tablet': return 'bg-blue-100 text-blue-800';
      case 'desktop': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">Device Selector</CardTitle>
              <CardDescription>
                Choose your device to optimize the game display and controls. Online devices are fetched from the internet for up-to-date specifications.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Device Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Current Device</h3>
            <div className="flex items-center gap-2">
              {getCategoryIcon(currentDevice.category)}
              <span className="font-medium">{currentDevice.name}</span>
              <Badge variant="outline">{currentDevice.description}</Badge>
              <span className="text-sm text-gray-600">
                {currentDevice.width}×{currentDevice.height} ({currentDevice.pixelRatio}x)
              </span>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search devices (name, resolution, dimensions)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchOnlineDevices()}
              disabled={isLoadingOnlineDevices}
              className="shrink-0"
            >
              {isLoadingOnlineDevices ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
            </Button>
            
            <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Device</DialogTitle>
                  <DialogDescription>
                    Add your specific device if it's not in the list
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="device-name">Device Name</Label>
                    <Input
                      id="device-name"
                      placeholder="e.g., My Custom Device"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="device-width">Width (px)</Label>
                      <Input
                        id="device-width"
                        type="number"
                        placeholder="1920"
                        value={newDevice.width}
                        onChange={(e) => setNewDevice({...newDevice, width: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="device-height">Height (px)</Label>
                      <Input
                        id="device-height"
                        type="number"
                        placeholder="1080"
                        value={newDevice.height}
                        onChange={(e) => setNewDevice({...newDevice, height: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="device-ratio">Pixel Ratio</Label>
                    <Input
                      id="device-ratio"
                      type="number"
                      step="0.1"
                      placeholder="1.0"
                      value={newDevice.pixelRatio}
                      onChange={(e) => setNewDevice({...newDevice, pixelRatio: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="device-description">Description (optional)</Label>
                    <Input
                      id="device-description"
                      placeholder="e.g., My gaming monitor"
                      value={newDevice.description}
                      onChange={(e) => setNewDevice({...newDevice, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="device-category">Category</Label>
                    <select
                      id="device-category"
                      value={newDevice.category}
                      onChange={(e) => setNewDevice({...newDevice, category: e.target.value as any})}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablet</option>
                      <option value="desktop">Desktop</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddCustomDevice}
                      disabled={!newDevice.name || !newDevice.width || !newDevice.height}
                      className="flex-1"
                    >
                      Add Device
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowAddDevice(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Online Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                onlineDevices.length > 0 ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-gray-600">
                {onlineDevices.length > 0 
                  ? `${onlineDevices.length} online devices loaded` 
                  : 'Local devices only'
                }
              </span>
            </div>
            {onlineDevicesError && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span className="text-xs">Connection error</span>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Devices</TabsTrigger>
              <TabsTrigger value="mobile">
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="tablet">
                <Tablet className="w-4 h-4 mr-2" />
                Tablet
              </TabsTrigger>
              <TabsTrigger value="desktop">
                <Monitor className="w-4 h-4 mr-2" />
                Desktop
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeCategory} className="mt-4">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {isLoadingOnlineDevices && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-gray-500">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading online devices...</span>
                    </div>
                  </div>
                )}
                {!isLoadingOnlineDevices && filteredDevices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-4">No devices found matching your search</div>
                    <div className="text-sm text-gray-400 mb-4">
                      Try searching by device name, resolution (e.g., "1920x1080"), or dimensions
                    </div>
                    <Button 
                      onClick={() => setShowAddDevice(true)}
                      variant="outline"
                      className="mx-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your Device
                    </Button>
                  </div>
                )}
                {filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedDevice?.id === device.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleDeviceSelect(device)}
                  >
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(device.category)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{device.name}</span>
                          {device.id.startsWith('online-') && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Online device" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{device.description}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(device.category)}>
                        {device.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {device.width}×{device.height}
                      </span>
                      {selectedDevice?.id === device.id && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handleDeviceSelect(deviceProfiles.find(d => d.id === 'auto-detect')!)}
              className="flex-1"
            >
              Auto Detect
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}