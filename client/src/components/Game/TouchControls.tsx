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

      
      {/* Game instructions */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
        <div className="bg-black/50 text-white text-center py-2 px-4 rounded-lg text-sm">
          Use arrow keys or WASD to move • Touch and drag to move at finger speed • Collect yellow coins • Avoid TNT guards • Reach the portal
        </div>
      </div>
    </>
  );
}
