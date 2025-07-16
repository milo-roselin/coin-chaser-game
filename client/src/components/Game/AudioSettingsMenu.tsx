import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/lib/stores/useAudio";
import { Volume2, VolumeX, Settings, X } from "lucide-react";
import { backgroundMusic } from "@/lib/backgroundMusic";

interface AudioSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioSettingsMenu({ isOpen, onClose }: AudioSettingsMenuProps) {
  const { 
    isMuted, 
    toggleMute, 
    backgroundMusicVolume,
    coinSoundVolume,
    explosionSoundVolume,
    setBackgroundMusicVolume,
    setCoinSoundVolume,
    setExplosionSoundVolume
  } = useAudio();

  if (!isOpen) return null;

  const handleBackgroundMusicVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100; // Convert to 0-1 range
    setBackgroundMusicVolume(newVolume);
  };

  const handleCoinSoundVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100; // Convert to 0-1 range
    setCoinSoundVolume(newVolume);
  };

  const handleExplosionSoundVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100; // Convert to 0-1 range
    setExplosionSoundVolume(newVolume);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96 max-w-[90vw] bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Audio Settings
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Mute Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Master Audio</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-slate-800"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
          </div>

          {/* Background Music Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Background Music</span>
              <span className="text-slate-300 text-sm">{Math.round(backgroundMusicVolume * 100)}%</span>
            </div>
            <Slider
              value={[backgroundMusicVolume * 100]}
              onValueChange={handleBackgroundMusicVolumeChange}
              max={100}
              step={1}
              className="w-full"
              disabled={isMuted}
            />
          </div>

          {/* Coin Sound Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Coin Collection</span>
              <span className="text-slate-300 text-sm">{Math.round(coinSoundVolume * 100)}%</span>
            </div>
            <Slider
              value={[coinSoundVolume * 100]}
              onValueChange={handleCoinSoundVolumeChange}
              max={100}
              step={1}
              className="w-full"
              disabled={isMuted}
            />
          </div>

          {/* Explosion Sound Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Explosion Effects</span>
              <span className="text-slate-300 text-sm">{Math.round(explosionSoundVolume * 100)}%</span>
            </div>
            <Slider
              value={[explosionSoundVolume * 100]}
              onValueChange={handleExplosionSoundVolumeChange}
              max={100}
              step={1}
              className="w-full"
              disabled={isMuted}
            />
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const { playCoin } = useAudio.getState();
                playCoin();
              }}
              disabled={isMuted}
              className="text-white border-slate-600 hover:bg-slate-800"
            >
              Test Coin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const { playExplosion } = useAudio.getState();
                playExplosion();
              }}
              disabled={isMuted}
              className="text-white border-slate-600 hover:bg-slate-800"
            >
              Test Explosion
            </Button>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full text-white border-slate-600 hover:bg-slate-800"
            onClick={() => {
              setBackgroundMusicVolume(0.3);
              setCoinSoundVolume(0.8);
              setExplosionSoundVolume(0.6);
            }}
          >
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}