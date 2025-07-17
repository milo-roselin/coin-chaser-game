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

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isJoystickActive || !joystickRef.current) return;
    
    e.preventDefault();
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if (e.type.includes('touch')) {
      const touch = (e as React.TouchEvent).touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 40; // Maximum joystick movement radius
    
    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;
    
    // Limit to circle
    if (distance > maxDistance) {
      normalizedX = (deltaX / distance) * (maxDistance / maxDistance);
      normalizedY = (deltaY / distance) * (maxDistance / maxDistance);
    }
    
    setJoystickPosition({ 
      x: normalizedX * maxDistance, 
      y: normalizedY * maxDistance 
    });
    
    // Send keyboard events based on joystick direction
    const threshold = 0.3;
    if (Math.abs(normalizedX) > threshold || Math.abs(normalizedY) > threshold) {
      if (normalizedX > threshold) {
        // Right
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true });
        document.dispatchEvent(event);
      } else if (normalizedX < -threshold) {
        // Left
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', code: 'ArrowLeft', bubbles: true });
        document.dispatchEvent(event);
      }
      
      if (normalizedY > threshold) {
        // Down
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true });
        document.dispatchEvent(event);
      } else if (normalizedY < -threshold) {
        // Up
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp', bubbles: true });
        document.dispatchEvent(event);
      }
    }
  };

  const handleJoystickEnd = () => {
    setIsJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    
    // Send keyup events to stop movement
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    keys.forEach(key => {
      const event = new KeyboardEvent('keyup', { key, code: key, bubbles: true });
      document.dispatchEvent(event);
    });
  };

  // Add global event listeners for joystick
  useEffect(() => {
    if (!isJoystickActive) return;
    
    const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
      if (e.type.includes('touch')) {
        handleJoystickMove(e as any);
      } else {
        handleJoystickMove(e as any);
      }
    };
    
    const handleGlobalEnd = () => {
      handleJoystickEnd();
    };
    
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    
    return () => {
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [isJoystickActive]);

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
              className="relative w-20 h-20 bg-gray-800/70 border-2 border-gray-600 rounded-full flex items-center justify-center"
              onTouchStart={handleJoystickStart}
              onMouseDown={handleJoystickStart}
            >
              {/* Joystick handle */}
              <div
                className={`absolute w-8 h-8 bg-blue-500 rounded-full shadow-lg transition-all duration-75 ${
                  isJoystickActive ? 'bg-blue-400' : 'bg-blue-500'
                }`}
                style={{
                  transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`
                }}
              />
              {/* Center dot */}
              <div className="w-2 h-2 bg-white rounded-full opacity-50" />
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
