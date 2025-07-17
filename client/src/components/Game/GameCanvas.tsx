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

    // Force full page layout and scroll to top
    const ensureFullViewport = () => {
      // Scroll to top to ensure we're at the beginning of the page
      window.scrollTo(0, 0);
      
      // For iPad, try to request fullscreen mode
      const requestFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
          }
        } catch (err) {
          console.log('Fullscreen not available, using viewport approach');
        }
      };
      
      // Try fullscreen on iPad
      const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIPad) {
        requestFullscreen();
      }
      
      // Force body to be exactly viewport size
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      
      // Force html to be exactly viewport size
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.documentElement.style.width = '100vw';
      document.documentElement.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
    };

    // Set canvas size using the most aggressive approach possible
    const resizeCanvas = () => {
      ensureFullViewport();
      
      // Try multiple methods to get true screen size
      const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      let viewportWidth, viewportHeight;
      
      if (isIPad) {
        // For iPad, use the largest available dimensions
        viewportWidth = Math.max(
          window.innerWidth,
          screen.width,
          screen.availWidth,
          document.documentElement.clientWidth
        );
        viewportHeight = Math.max(
          window.innerHeight, 
          screen.height,
          screen.availHeight,
          document.documentElement.clientHeight
        );
        
        // If still getting small dimensions, force iPad common sizes based on detected screen
        if (viewportWidth < 800) {
          // Use actual screen dimensions if available, otherwise use common iPad sizes
          viewportWidth = screen.width > 0 ? screen.width : 1024;
          viewportHeight = screen.height > 0 ? screen.height : 768;
        }
      } else {
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;
      }
      
      const dpr = window.devicePixelRatio || 1;
      
      // Set canvas internal resolution
      canvas.width = viewportWidth * dpr;
      canvas.height = viewportHeight * dpr;
      
      // Force canvas display size with multiple methods
      canvas.style.width = viewportWidth + 'px';
      canvas.style.height = viewportHeight + 'px';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '1000';
      
      // Scale the context to match device pixel ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      console.log(`Canvas forced to: ${canvas.width}x${canvas.height} (internal), ${viewportWidth}x${viewportHeight} (display), DPR: ${dpr}, screen: ${screen.width}x${screen.height}, window: ${window.innerWidth}x${window.innerHeight}`);
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
    
    // Prevent scrolling entirely
    const preventScroll = (e: Event) => {
      e.preventDefault();
      window.scrollTo(0, 0);
    };
    
    window.addEventListener("scroll", preventScroll, { passive: false });
    document.addEventListener("scroll", preventScroll, { passive: false });
    
    // Force initial state
    setTimeout(() => {
      resizeCanvas();
      window.scrollTo(0, 0);
    }, 100);

    // Initialize game engine with viewport dimensions
    gameEngineRef.current = new GameEngine(
      window.innerWidth,
      window.innerHeight,
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
      window.removeEventListener("scroll", preventScroll);
      document.removeEventListener("scroll", preventScroll);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", resizeCanvas);
      }
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
