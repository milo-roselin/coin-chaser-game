import { useState } from 'react';
import { useDeviceSettings, deviceProfiles, DeviceProfile } from '@/lib/stores/useDeviceSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Monitor, Tablet, Smartphone, X, Check } from 'lucide-react';

interface DeviceSelectorProps {
  onClose: () => void;
}

export default function DeviceSelector({ onClose }: DeviceSelectorProps) {
  const { selectedDevice, setSelectedDevice, getCurrentDevice } = useDeviceSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'mobile' | 'tablet' | 'desktop'>('all');

  const currentDevice = getCurrentDevice();

  const filteredDevices = deviceProfiles.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || device.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
                Choose your device to optimize the game display and controls
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                        <div className="font-medium">{device.name}</div>
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