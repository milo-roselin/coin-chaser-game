import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useAudio } from "@/lib/stores/useAudio";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { GameEngine } from "@/lib/gameEngine";

const GameCanvas = forwardRef<{ togglePause: () => void }, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isMobile = useIsMobile();

  const { 
    updateScore, 
    updateCoinsCollected, 
    endGame, 
    winGame,
    playerPosition,
    setPlayerPosition,
    currentLevel
  } = useCoinGame();
  const { playHit, playSuccess, playExplosion, playCoin } = useAudio();

  const gameLoop = useCallback(() => {
    if (gameEngineRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        gameEngineRef.current.update();
        gameEngineRef.current.render(ctx);
      }
    }
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to exact available viewport
    const resizeCanvas = () => {
      // For iPad/mobile devices, use a more aggressive approach
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      let availableWidth, availableHeight;
      
      if (isIPad) {
        // For iPad, try to get the full screen dimensions
        const screenWidth = screen.width;
        const screenHeight = screen.height;
        
        // Use the larger values between window and screen to ensure full coverage
        availableWidth = Math.max(window.innerWidth, screenWidth);
        availableHeight = Math.max(window.innerHeight, screenHeight);
        
        // Also try using screen.availWidth/availHeight if larger
        if (screen.availWidth > availableWidth) availableWidth = screen.availWidth;
        if (screen.availHeight > availableHeight) availableHeight = screen.availHeight;
        
      } else if (isIOS) {
        // On other iOS devices, use window dimensions
        availableWidth = window.innerWidth;
        availableHeight = window.innerHeight;
      } else if (window.visualViewport) {
        availableWidth = window.visualViewport.width;
        availableHeight = window.visualViewport.height;
      } else {
        // Fallback: use the actual rendered dimensions of the viewport
        availableWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
        availableHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);
      }
      
      canvas.width = availableWidth;
      canvas.height = availableHeight;
      
      console.log(`Canvas resized to: ${availableWidth}x${availableHeight} (${isIPad ? 'iPad' : isIOS ? 'iOS' : 'visual viewport'}) - screen: ${screen.width}x${screen.height}, window: ${window.innerWidth}x${window.innerHeight}`);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    // Also listen for orientation changes and viewport changes
    window.addEventListener("orientationchange", () => {
      setTimeout(resizeCanvas, 100); // Small delay to let orientation settle
    });
    
    // Listen for visual viewport changes (more reliable for browser chrome)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resizeCanvas);
    }
    
    // Listen for viewport size changes (like when browser chrome appears/disappears)
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === document.documentElement) {
          resizeCanvas();
        }
      }
    });
    resizeObserver.observe(document.documentElement);

    // Initialize game engine
    gameEngineRef.current = new GameEngine(
      canvas.width,
      canvas.height,
      {
        onCoinCollected: (score: number) => {
          updateScore(score);
          updateCoinsCollected();
          playCoin();
        },
        onObstacleHit: () => {
          playExplosion();
          endGame();
        },
        onLevelComplete: () => {
          winGame();
        },
        onPlayerMove: (x: number, y: number) => {
          setPlayerPosition(x, y);
        }
      },
      currentLevel
    );

    // Add keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameEngineRef.current) {
        gameEngineRef.current.handleKeyDown(e.code);
        // Update pause state when space or escape is pressed
        if (e.code === 'Space' || e.code === 'Escape') {
          setIsPaused(prev => !prev);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameEngineRef.current) {
        gameEngineRef.current.handleKeyUp(e.code);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Start game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", resizeCanvas);
      }
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop, updateScore, updateCoinsCollected, endGame, winGame, setPlayerPosition, playHit, playSuccess]);

  // Handle touch input - disabled for mobile devices (using arrow buttons instead)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (gameEngineRef.current && !isMobile) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        gameEngineRef.current.handleTouchStart(x, y);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (gameEngineRef.current && !isMobile) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        gameEngineRef.current.handleTouchMove(x, y);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (gameEngineRef.current && !isMobile) {
      gameEngineRef.current.handleTouchEnd();
    }
  };

  const handlePauseClick = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.togglePause();
      setIsPaused(!isPaused);
    }
  };

  // Expose toggle pause function to parent component
  useImperativeHandle(ref, () => ({
    togglePause: handlePauseClick
  }));

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Clickable pause overlay when paused */}
      {isPaused && (
        <div
          onClick={handlePauseClick}
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-20"
          style={{ touchAction: "manipulation" }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-5 h-24 bg-white"></div>
              <div className="w-5 h-24 bg-white"></div>
            </div>
            <div className="text-white text-2xl font-bold mb-2">PAUSED</div>
            <div className="text-white text-base">Click here or press SPACE/ESC to resume</div>
          </div>
        </div>
      )}
    </div>
  );
});

GameCanvas.displayName = "GameCanvas";

export default GameCanvas;
