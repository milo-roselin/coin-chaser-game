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

    // Set canvas size to match the actual visible area (accounting for browser UI)
    const resizeCanvas = () => {
      let canvasWidth, canvasHeight;
      
      // Always account for browser UI elements
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;
      
      // Subtract estimated browser UI space
      // In most browsers: tabs (40-50px) + address bar (35-45px) + bookmarks bar (30px optional) + extra margin
      const estimatedBrowserUI = 200; // Very aggressive estimate to ensure full visibility
      canvasHeight = Math.max(canvasHeight - estimatedBrowserUI, 250); // Minimum height
      
      // Additional check: if we're in an iframe or embedded context, be more conservative
      if (window !== window.parent) {
        canvasHeight = Math.max(canvasHeight - 100, 250); // Extra space for iframe context
      }
      
      // Set canvas size to match visible area
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Update canvas style
      canvas.style.width = canvasWidth + 'px';
      canvas.style.height = canvasHeight + 'px';
      
      // If game engine exists, update its dimensions
      if (gameEngineRef.current) {
        gameEngineRef.current.updateDimensions(canvasWidth, canvasHeight);
      }
      
      console.log(`Canvas resized to: ${canvasWidth}x${canvasHeight} (original: ${window.innerWidth}x${window.innerHeight}, reduced by ${200 + (window !== window.parent ? 100 : 0)}px for browser UI)`);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", () => {
      // Delay resize to ensure proper orientation change handling
      setTimeout(resizeCanvas, 100);
    });
    
    // Listen for Visual Viewport changes if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resizeCanvas);
    }

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
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", resizeCanvas);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
