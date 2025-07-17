import { useRef, useEffect } from "react";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useIsMobile } from '../../hooks/use-is-mobile';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function TouchControls() {
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const { playerPosition } = useCoinGame();
  const isMobile = useIsMobile();

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
      {/* iPad-style controls: Arrow keys on right side + Speed controls */}
      {isMobile && (
        <>
          {/* Arrow key controls - positioned 1/4 from bottom on right side */}
          <div className="absolute right-4 pointer-events-auto z-10" style={{ bottom: '25%' }}>
            <div className="flex flex-col items-center gap-2">
              {/* Up arrow */}
              <button
                onTouchStart={(e) => handleArrowKeyDown('up', e)}
                onTouchEnd={(e) => handleArrowKeyUp('up', e)}
                onMouseDown={(e) => handleArrowKeyDown('up', e)}
                onMouseUp={(e) => handleArrowKeyUp('up', e)}
                onMouseLeave={(e) => handleArrowKeyUp('up', e)}
                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white w-12 h-12 rounded-lg flex items-center justify-center shadow-lg transition-all duration-150"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              
              {/* Left and Right arrows */}
              <div className="flex gap-2">
                <button
                  onTouchStart={(e) => handleArrowKeyDown('left', e)}
                  onTouchEnd={(e) => handleArrowKeyUp('left', e)}
                  onMouseDown={(e) => handleArrowKeyDown('left', e)}
                  onMouseUp={(e) => handleArrowKeyUp('left', e)}
                  onMouseLeave={(e) => handleArrowKeyUp('left', e)}
                  className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white w-12 h-12 rounded-lg flex items-center justify-center shadow-lg transition-all duration-150"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onTouchStart={(e) => handleArrowKeyDown('right', e)}
                  onTouchEnd={(e) => handleArrowKeyUp('right', e)}
                  onMouseDown={(e) => handleArrowKeyDown('right', e)}
                  onMouseUp={(e) => handleArrowKeyUp('right', e)}
                  onMouseLeave={(e) => handleArrowKeyUp('right', e)}
                  className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white w-12 h-12 rounded-lg flex items-center justify-center shadow-lg transition-all duration-150"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
              
              {/* Down arrow */}
              <button
                onTouchStart={(e) => handleArrowKeyDown('down', e)}
                onTouchEnd={(e) => handleArrowKeyUp('down', e)}
                onMouseDown={(e) => handleArrowKeyDown('down', e)}
                onMouseUp={(e) => handleArrowKeyUp('down', e)}
                onMouseLeave={(e) => handleArrowKeyUp('down', e)}
                className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white w-12 h-12 rounded-lg flex items-center justify-center shadow-lg transition-all duration-150"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Speed control buttons - positioned at top right */}
          <div className="absolute top-20 right-4 flex flex-col gap-3 pointer-events-auto z-10">
            <div className="flex flex-col items-center gap-1">
              <button
                onTouchStart={handleSpeedIncrease}
                onClick={handleSpeedIncrease}
                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg transition-all duration-150"
              >
                +
              </button>
              <span className="text-xs text-white bg-black/70 px-2 py-1 rounded pointer-events-none">
                Speed+
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onTouchStart={handleSpeedDecrease}
                onClick={handleSpeedDecrease}
                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg transition-all duration-150"
              >
                -
              </button>
              <span className="text-xs text-white bg-black/70 px-2 py-1 rounded pointer-events-none">
                Speed-
              </span>
            </div>
          </div>
        </>
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
