import { useRef, useEffect } from "react";
import GameCanvas from "./GameCanvas";
import TouchControls from "./TouchControls";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { Button } from "@/components/ui/button";
import { Pause, Home } from "lucide-react";

export default function GameScreen() {
  const { resetGame } = useCoinGame();
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

  // Add keyboard shortcuts for home button
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'h' || e.key === 'H') {
        handleHome();
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
      <div className="absolute top-4 right-4 flex gap-2 pointer-events-none">
        <Button
          onClick={handlePause}
          size="sm"
          variant="outline"
          className="bg-white/90 hover:bg-white border-gray-300 pointer-events-auto"
          title="Pause Game (SPACE or ESC)"
        >
          <Pause className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleHome}
          size="sm"
          variant="outline"
          className="bg-white/90 hover:bg-white border-gray-300 pointer-events-auto"
          title="Back to Menu (H)"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      {/* Touch Controls */}
      <TouchControls />
    </div>
  );
}
