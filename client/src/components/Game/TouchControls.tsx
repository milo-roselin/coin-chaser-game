import { useRef, useEffect, useState } from "react";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useIsMobile } from '../../hooks/use-is-mobile';

export default function TouchControls() {
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const { playerPosition } = useCoinGame();
  const isMobile = useIsMobile();
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const activeKeysRef = useRef<Set<string>>(new Set());
  const moveIntervalRef = useRef<number | null>(null);

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

  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsJoystickActive(true);
  };

  const updateMovementKeys = (normalizedX: number, normalizedY: number) => {
    const threshold = 0.2;
    const newKeys = new Set<string>();
    
    // Determine which keys should be active
    if (normalizedX > threshold) newKeys.add('ArrowRight');
    if (normalizedX < -threshold) newKeys.add('ArrowLeft');
    if (normalizedY > threshold) newKeys.add('ArrowDown');
    if (normalizedY < -threshold) newKeys.add('ArrowUp');
    
    // Release keys that are no longer active
    activeKeysRef.current.forEach(key => {
      if (!newKeys.has(key)) {
        const event = new KeyboardEvent('keyup', { key, code: key, bubbles: true });
        document.dispatchEvent(event);
      }
    });
    
    // Press new keys
    newKeys.forEach(key => {
      if (!activeKeysRef.current.has(key)) {
        const event = new KeyboardEvent('keydown', { key, code: key, bubbles: true });
        document.dispatchEvent(event);
      }
    });
    
    activeKeysRef.current = newKeys;
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isJoystickActive || !joystickRef.current) return;
    
    e.preventDefault();
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if (e.type.includes('touch')) {
      const touch = (e as React.TouchEvent).touches[0];
      if (!touch) return;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 35; // Maximum joystick movement radius
    
    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;
    let actualX = deltaX;
    let actualY = deltaY;
    
    // Limit to circle
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      actualX = Math.cos(angle) * maxDistance;
      actualY = Math.sin(angle) * maxDistance;
      normalizedX = actualX / maxDistance;
      normalizedY = actualY / maxDistance;
    }
    
    setJoystickPosition({ x: actualX, y: actualY });
    updateMovementKeys(normalizedX, normalizedY);
  };

  const handleJoystickEnd = () => {
    setIsJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    
    // Release all active keys
    activeKeysRef.current.forEach(key => {
      const event = new KeyboardEvent('keyup', { key, code: key, bubbles: true });
      document.dispatchEvent(event);
    });
    activeKeysRef.current.clear();
    
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  };

  // Add global event listeners for joystick
  useEffect(() => {
    if (!isJoystickActive) return;
    
    const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      handleJoystickMove(e as any);
    };
    
    const handleGlobalEnd = () => {
      handleJoystickEnd();
    };
    
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);
    document.addEventListener('touchcancel', handleGlobalEnd);
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    
    return () => {
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('touchcancel', handleGlobalEnd);
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [isJoystickActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
      // Release any active keys on unmount
      activeKeysRef.current.forEach(key => {
        const event = new KeyboardEvent('keyup', { key, code: key, bubbles: true });
        document.dispatchEvent(event);
      });
    };
  }, []);

  return (
    <>
      {/* Speed control buttons for touch devices (including iPad) */}
      {isMobile && (
        <div className="absolute top-20 right-4 flex flex-col gap-3 pointer-events-auto z-10">
          <div className="flex flex-col items-center gap-1">
            <button
              onTouchStart={handleSpeedIncrease}
              onClick={handleSpeedIncrease}
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg transition-all duration-150"
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
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg transition-all duration-150"
            >
              -
            </button>
            <span className="text-xs text-white bg-black/70 px-2 py-1 rounded pointer-events-none">
              Speed-
            </span>
          </div>
        </div>
      )}
      
      {/* Virtual Joystick for touch devices */}
      {isMobile && (
        <div className="absolute bottom-6 right-6 pointer-events-auto">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-white bg-black/70 px-2 py-1 rounded pointer-events-none">
              Movement
            </span>
            <div
              ref={joystickRef}
              className="relative w-24 h-24 bg-gray-800/80 border-2 border-gray-500 rounded-full flex items-center justify-center touch-none"
              onTouchStart={handleJoystickStart}
              onMouseDown={handleJoystickStart}
              style={{ touchAction: 'none' }}
            >
              {/* Joystick handle */}
              <div
                className={`absolute w-10 h-10 rounded-full shadow-lg transition-all duration-100 pointer-events-none ${
                  isJoystickActive ? 'bg-blue-400 border-2 border-blue-200' : 'bg-blue-500 border-2 border-blue-300'
                }`}
                style={{
                  transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
                  transition: isJoystickActive ? 'none' : 'transform 0.2s ease-out'
                }}
              />
              {/* Center dot */}
              <div className="w-3 h-3 bg-white rounded-full opacity-60 pointer-events-none" />
              {/* Direction indicators */}
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-30">↑</div>
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-30">↓</div>
              <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-white text-xs opacity-30">←</div>
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-white text-xs opacity-30">→</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Game instructions */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
        <div className="bg-black/50 text-white text-center py-2 px-4 rounded-lg text-sm">
          {isMobile ? 
            "Use joystick to move • Collect yellow coins • Avoid TNT guards • Reach the portal • +/- to change speed" :
            "Use arrow keys or WASD to move • Collect yellow coins • Avoid TNT guards • Reach the portal • +/- to change speed"
          }
        </div>
      </div>
    </>
  );
}
