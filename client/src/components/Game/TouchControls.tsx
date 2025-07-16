import { useRef, useEffect } from "react";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useIsMobile } from '../../hooks/use-is-mobile';

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

  return (
    <>
      {/* Speed control buttons for mobile */}
      {isMobile && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
          <button
            onTouchStart={handleSpeedIncrease}
            onClick={handleSpeedIncrease}
            className="bg-blue-500 hover:bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
          >
            +
          </button>
          <button
            onTouchStart={handleSpeedDecrease}
            onClick={handleSpeedDecrease}
            className="bg-blue-500 hover:bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
          >
            -
          </button>
        </div>
      )}
      
      {/* Game instructions */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
        <div className="bg-black/50 text-white text-center py-2 px-4 rounded-lg text-sm">
          Use arrow keys or WASD to move • Tap and hold also works • Collect yellow coins • Avoid TNT guards • Reach the portal • +/- to change speed
        </div>
      </div>
    </>
  );
}
