import { useRef, useEffect } from "react";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useIsMobile } from '../../hooks/use-is-mobile';
import { Button } from "@/components/ui/button";
import { Pause, Home } from "lucide-react";

interface TouchControlsProps {
  onPause?: () => void;
  onHome?: () => void;
}

export default function TouchControls({ onPause, onHome }: TouchControlsProps) {
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const { playerPosition, resetGame } = useCoinGame();
  const isMobile = useIsMobile();

  const handlePause = () => {
    if (onPause) {
      onPause();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      resetGame();
    }
  };

  useEffect(() => {
    // Touch controls are handled by the canvas component
    // This component just provides visual feedback
  }, []);

  const handleSpeedIncrease = () => {
    // Create a keyboard event to trigger speed increase
    const event = new KeyboardEvent('keydown', {
      key: '=',
      code: 'Equal',
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  const handleSpeedDecrease = () => {
    // Create a keyboard event to trigger speed decrease
    const event = new KeyboardEvent('keydown', {
      key: '-',
      code: 'Minus',
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  const handleArrowKeyDown = (direction: string, e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const keyMap = {
      up: { key: 'ArrowUp', code: 'ArrowUp' },
      down: { key: 'ArrowDown', code: 'ArrowDown' },
      left: { key: 'ArrowLeft', code: 'ArrowLeft' },
      right: { key: 'ArrowRight', code: 'ArrowRight' }
    };

    const keyData = keyMap[direction as keyof typeof keyMap];
    if (keyData) {
      const event = new KeyboardEvent('keydown', {
        key: keyData.key,
        code: keyData.code,
        bubbles: true
      });
      document.dispatchEvent(event);
    }
  };

  const handleArrowKeyUp = (direction: string, e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const keyMap = {
      up: { key: 'ArrowUp', code: 'ArrowUp' },
      down: { key: 'ArrowDown', code: 'ArrowDown' },
      left: { key: 'ArrowLeft', code: 'ArrowLeft' },
      right: { key: 'ArrowRight', code: 'ArrowRight' }
    };

    const keyData = keyMap[direction as keyof typeof keyMap];
    if (keyData) {
      const event = new KeyboardEvent('keyup', {
        key: keyData.key,
        code: keyData.code,
        bubbles: true
      });
      document.dispatchEvent(event);
    }
  };

  return (
    <>
      {/* iPad-style controls: All controls in unified right panel */}
      {isMobile && (
        <div className="absolute top-0 right-0 h-full w-32 bg-gray-800 border-l-2 border-gray-600 flex flex-col items-center justify-between py-6 pointer-events-auto z-10">
          {/* Action Buttons - Top */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-1">
              <Button
                onClick={handlePause}
                size="sm"
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 border-gray-500 text-white w-16 h-12"
              >
                <Pause className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-300">
                SPACE
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <Button
                onClick={handleHome}
                size="sm"
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 border-gray-500 text-white w-16 h-12"
              >
                <Home className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-300">
                H
              </span>
            </div>
          </div>

          {/* Speed control buttons - Middle */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col items-center gap-1">
              <button
                onTouchStart={handleSpeedIncrease}
                onClick={handleSpeedIncrease}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg transition-all duration-150"
              >
                +
              </button>
              <span className="text-xs text-gray-300">
                Speed+
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onTouchStart={handleSpeedDecrease}
                onClick={handleSpeedDecrease}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg transition-all duration-150"
              >
                -
              </button>
              <span className="text-xs text-gray-300">
                Speed-
              </span>
            </div>
          </div>

          {/* Arrow key controls - Bottom */}
          <div className="flex flex-col items-center gap-1">
            {/* Up arrow - top row */}
            <div className="flex justify-center">
              <button
                onTouchStart={(e) => handleArrowKeyDown('up', e)}
                onTouchEnd={(e) => handleArrowKeyUp('up', e)}
                onMouseDown={(e) => handleArrowKeyDown('up', e)}
                onMouseUp={(e) => handleArrowKeyUp('up', e)}
                onMouseLeave={(e) => handleArrowKeyUp('up', e)}
                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white w-10 h-10 rounded-md border-2 border-gray-500 flex items-center justify-center shadow-lg transition-all duration-150 font-mono text-lg font-bold"
              >
                ↑
              </button>
            </div>
            
            {/* Left, Down, Right arrows - bottom row */}
            <div className="flex gap-1">
              <button
                onTouchStart={(e) => handleArrowKeyDown('left', e)}
                onTouchEnd={(e) => handleArrowKeyUp('left', e)}
                onMouseDown={(e) => handleArrowKeyDown('left', e)}
                onMouseUp={(e) => handleArrowKeyUp('left', e)}
                onMouseLeave={(e) => handleArrowKeyUp('left', e)}
                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white w-10 h-10 rounded-md border-2 border-gray-500 flex items-center justify-center shadow-lg transition-all duration-150 font-mono text-sm font-bold"
              >
                ←
              </button>
              <button
                onTouchStart={(e) => handleArrowKeyDown('down', e)}
                onTouchEnd={(e) => handleArrowKeyUp('down', e)}
                onMouseDown={(e) => handleArrowKeyDown('down', e)}
                onMouseUp={(e) => handleArrowKeyUp('down', e)}
                onMouseLeave={(e) => handleArrowKeyUp('down', e)}
                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white w-10 h-10 rounded-md border-2 border-gray-500 flex items-center justify-center shadow-lg transition-all duration-150 font-mono text-lg font-bold"
              >
                ↓
              </button>
              <button
                onTouchStart={(e) => handleArrowKeyDown('right', e)}
                onTouchEnd={(e) => handleArrowKeyUp('right', e)}
                onMouseDown={(e) => handleArrowKeyDown('right', e)}
                onMouseUp={(e) => handleArrowKeyUp('right', e)}
                onMouseLeave={(e) => handleArrowKeyUp('right', e)}
                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white w-10 h-10 rounded-md border-2 border-gray-500 flex items-center justify-center shadow-lg transition-all duration-150 font-mono text-sm font-bold"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Game instructions */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
        <div className="bg-black/50 text-white text-center py-2 px-4 rounded-lg text-sm">
          {isMobile ? 
            "Use arrow buttons to move • Collect yellow coins • Avoid TNT guards • Reach the portal • +/- to change speed" :
            "Use arrow keys or WASD to move • Collect yellow coins • Avoid TNT guards • Reach the portal • +/- to change speed"
          }
        </div>
      </div>
    </>
  );
}
