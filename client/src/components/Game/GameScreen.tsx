import { useRef, useEffect } from "react";
import GameCanvas from "./GameCanvas";
import TouchControls from "./TouchControls";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Button } from "@/components/ui/button";
import { Pause, Home } from "lucide-react";

export default function GameScreen() {
  const { resetGame } = useCoinGame();
  const { startBackgroundMusic, toggleMute, isMuted } = useAudio();
  const gameCanvasRef = useRef<{ togglePause: () => void } | null>(null);

  const handlePause = () => {
    // Trigger pause in the game engine
    if (gameCanvasRef.current) {
      gameCanvasRef.current.togglePause();
    }
  };

  const handleHome = () => {
    resetGame();
  };

  // Start background music when game screen loads
  useEffect(() => {
    startBackgroundMusic();
  }, [startBackgroundMusic]);

  // Add keyboard shortcuts for home button
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'h' || e.key === 'H') {
        handleHome();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Game Canvas */}
      <GameCanvas ref={gameCanvasRef} />

      {/* Control Buttons - top-right corner */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePause}
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white border-gray-300 pointer-events-auto"
          >
            <Pause className="h-4 w-4" />
          </Button>
          <span className="text-xs text-white bg-black/70 px-2 py-1 rounded pointer-events-none">
            SPACE/ESC
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleHome}
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white border-gray-300 pointer-events-auto"
          >
            <Home className="h-4 w-4" />
          </Button>
          <span className="text-xs text-white bg-black/70 px-2 py-1 rounded pointer-events-none">
            H
          </span>
        </div>
        
        {/* Mute/Unmute Button */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            onClick={toggleMute}
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white border-gray-300 pointer-events-auto"
          >
            {isMuted ? '🔇' : '🔊'}
          </Button>
          <span className="text-xs text-white bg-black/70 px-2 py-1 rounded pointer-events-none">
            M
          </span>
        </div>
      </div>

      {/* Touch Controls */}
      <TouchControls />
    </div>
  );
}
