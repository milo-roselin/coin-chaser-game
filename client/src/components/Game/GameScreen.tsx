import { useRef, useEffect } from "react";
import GameCanvas from "./GameCanvas";
import TouchControls from "./TouchControls";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { Button } from "@/components/ui/button";
import { Pause, Home } from "lucide-react";

export default function GameScreen() {
  const { score, coinsCollected, resetGame } = useCoinGame();

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

      {/* HUD Overlay - moved to top-right to avoid blocking level display */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
        {/* Control Buttons */}
        <div className="flex gap-2 pointer-events-auto">
          <Button
            onClick={handlePause}
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white border-gray-300"
          >
            <Pause className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleHome}
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white border-gray-300"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>

        {/* Score Display - moved below buttons */}
        <div className="bg-black/70 text-white px-4 py-2 rounded-lg font-bold pointer-events-auto">
          <div className="text-sm text-right">Score: {score}</div>
          <div className="text-sm text-right">Coins: {coinsCollected}</div>
        </div>
      </div>

      {/* Touch Controls */}
      <TouchControls />
    </div>
  );
}
