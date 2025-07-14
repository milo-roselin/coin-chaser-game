import { useRef, useEffect } from "react";
import GameCanvas from "./GameCanvas";
import TouchControls from "./TouchControls";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { Button } from "@/components/ui/button";
import { Pause, Home } from "lucide-react";

export default function GameScreen() {
  const { resetGame } = useCoinGame();

  const handlePause = () => {
    // For now, just go back to start screen
    resetGame();
  };

  const handleHome = () => {
    resetGame();
  };

  return (
    <div className="relative w-full h-full">
      {/* Game Canvas */}
      <GameCanvas />

      {/* Control Buttons - top-right corner */}
      <div className="absolute top-4 right-4 flex gap-2 pointer-events-none">
        <Button
          onClick={handlePause}
          size="sm"
          variant="outline"
          className="bg-white/90 hover:bg-white border-gray-300 pointer-events-auto"
        >
          <Pause className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleHome}
          size="sm"
          variant="outline"
          className="bg-white/90 hover:bg-white border-gray-300 pointer-events-auto"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      {/* Touch Controls */}
      <TouchControls />
    </div>
  );
}
