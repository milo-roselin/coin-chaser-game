import { useState } from "react";
import { useAudio } from "@/lib/stores/useAudio";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Volume2, VolumeX, Music, Zap, X } from "lucide-react";

interface AudioSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioSettingsMenu({ isOpen, onClose }: AudioSettingsMenuProps) {
  const { 
    isMuted, 
    toggleMute, 
    backgroundMusic,
    explosionSound,
    backgroundMusicVolume,
    soundEffectsVolume,
    musicEnabled,
    soundEffectsEnabled,
    setBackgroundMusicVolume,
    setSoundEffectsVolume,
    setMusicEnabled,
    setSoundEffectsEnabled
  } = useAudio();

  const handleBackgroundVolumeChange = (value: number[]) => {
    setBackgroundMusicVolume(value[0]);
  };

  const handleSoundEffectsVolumeChange = (value: number[]) => {
    setSoundEffectsVolume(value[0]);
  };

  const handleMusicToggle = (enabled: boolean) => {
    setMusicEnabled(enabled);
  };

  const handleSoundEffectsToggle = (enabled: boolean) => {
    setSoundEffectsEnabled(enabled);
  };

  const testSoundEffect = () => {
    if (soundEffectsEnabled && !isMuted && explosionSound) {
      explosionSound.currentTime = 0;
      explosionSound.play().catch(console.log);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Audio Settings</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Master Mute Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="master-mute" className="flex items-center gap-2">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              Master Audio
            </Label>
            <Switch
              id="master-mute"
              checked={!isMuted}
              onCheckedChange={() => toggleMute()}
            />
          </div>

          {/* Background Music Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="background-music" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Background Music
              </Label>
              <Switch
                id="background-music"
                checked={musicEnabled}
                onCheckedChange={handleMusicToggle}
                disabled={isMuted}
              />
            </div>
            
            <div className="pl-6">
              <Label className="text-sm text-gray-600">Volume</Label>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-500 w-8">0%</span>
                <Slider
                  value={[backgroundVolume]}
                  onValueChange={handleBackgroundVolumeChange}
                  max={100}
                  step={5}
                  className="flex-1"
                  disabled={isMuted || !musicEnabled}
                />
                <span className="text-sm text-gray-500 w-10">{backgroundVolume}%</span>
              </div>
            </div>
          </div>

          {/* Sound Effects Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-effects" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Sound Effects
              </Label>
              <Switch
                id="sound-effects"
                checked={soundEffectsEnabled}
                onCheckedChange={handleSoundEffectsToggle}
                disabled={isMuted}
              />
            </div>
            
            <div className="pl-6">
              <Label className="text-sm text-gray-600">Volume</Label>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-500 w-8">0%</span>
                <Slider
                  value={[soundEffectsVolume]}
                  onValueChange={handleSoundEffectsVolumeChange}
                  max={100}
                  step={5}
                  className="flex-1"
                  disabled={isMuted || !soundEffectsEnabled}
                />
                <span className="text-sm text-gray-500 w-10">{soundEffectsVolume}%</span>
              </div>
              
              <Button
                onClick={testSoundEffect}
                variant="outline"
                size="sm"
                className="mt-2 h-8 text-xs"
                disabled={isMuted || !soundEffectsEnabled}
              >
                Test Sound
              </Button>
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Keyboard Shortcuts</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">M</kbd> to toggle mute</div>
              <div>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">A</kbd> to open audio settings</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}