import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDevicePreference, DeviceType } from "@/lib/stores/useDevicePreference";
import { Smartphone, Tablet, Monitor, Settings } from "lucide-react";

interface DeviceSelectorProps {
  onDeviceSelect?: (device: DeviceType) => void;
}

export default function DeviceSelector({ onDeviceSelect }: DeviceSelectorProps) {
  const { selectedDevice, setSelectedDevice } = useDevicePreference();

  const handleDeviceSelect = (device: DeviceType) => {
    setSelectedDevice(device);
    onDeviceSelect?.(device);
    
    // Apply screen dimensions immediately if not auto
    if (device !== 'auto') {
      const { getScreenDimensions } = useDevicePreference.getState();
      const dimensions = getScreenDimensions();
      
      // Force a resize event to update canvas and layout
      window.dispatchEvent(new Event('resize'));
    }
  };

  const devices = [
    {
      type: 'phone' as DeviceType,
      label: 'Phone',
      icon: Smartphone,
      description: '375×667',
      bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600'
    },
    {
      type: 'tablet' as DeviceType,
      label: 'Tablet',
      icon: Tablet,
      description: '768×1024',
      bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-600'
    },
    {
      type: 'desktop' as DeviceType,
      label: 'Desktop',
      icon: Monitor,
      description: '1920×1080',
      bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <Card className="w-full max-w-lg mx-auto bg-white/90 backdrop-blur-sm shadow-md">
      <CardContent className="p-4">
        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Select Your Device</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {devices.map((device) => {
            const Icon = device.icon;
            const isSelected = selectedDevice === device.type;
            
            return (
              <Button
                key={device.type}
                onClick={() => handleDeviceSelect(device.type)}
                variant="outline"
                className={`
                  h-16 flex flex-col items-center justify-center gap-1 transition-all duration-200
                  ${device.bgColor}
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                  border-2 hover:scale-105
                `}
              >
                <Icon className={`h-4 w-4 ${device.iconColor}`} />
                <div className="text-center">
                  <div className={`text-xs font-semibold ${device.textColor}`}>
                    {device.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {device.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {selectedDevice !== 'auto' && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 text-center">
              <strong>{devices.find(d => d.type === selectedDevice)?.label}</strong> mode selected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}