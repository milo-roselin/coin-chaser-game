import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useAudio } from "@/lib/stores/useAudio";
import { usePlayerAvatar } from "@/lib/stores/usePlayerAvatar";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { GameEngine } from "@/lib/gameEngine";

const GameCanvas = forwardRef<{ togglePause: () => void }, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isMobile = useIsMobile();
  
  // Mobile-specific power-up queue to prevent freezing
  const powerupQueueRef = useRef<Array<'magnet' | 'extralife'>>([]);
  const processingPowerupRef = useRef(false);

  const { 
    updateScore, 
    updateCoinsCollected, 
    endGame, 
    winGame,
    playerPosition,
    setPlayerPosition,
    currentLevel,
    activateMagnet,
    addExtraLife,
    magnetActive,
    updateMagnetTimer,
    shieldActive,
    extraLives
  } = useCoinGame();
  const { playHit, playSuccess, playExplosion, playCoin } = useAudio();
  const { getSelectedAvatar, selectedAvatar } = usePlayerAvatar();

  // Mobile-specific power-up queue processor
  const processPowerupQueue = useCallback(() => {
    if (powerupQueueRef.current.length === 0) {
      processingPowerupRef.current = false;
      return;
    }
    
    processingPowerupRef.current = true;
    const type = powerupQueueRef.current.shift();
    
    if (type) {
      // Process one power-up with delay for mobile stability
      setTimeout(() => {
        try {
          if (type === 'magnet') {
            console.log('Activating magnet (mobile queue)...');
            activateMagnet();
          } else if (type === 'extralife') {
            console.log('Adding extra life (mobile queue)...');
            addExtraLife();
          }
        } catch (error) {
          console.warn('Power-up activation error:', error);
        }
        
        // Process next item in queue after delay
        setTimeout(() => processPowerupQueue(), 200);
      }, 100);
    }
  }, [activateMagnet, addExtraLife]);

  const gameLoop = useCallback(() => {
    if (gameEngineRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        try {
          // Mobile-optimized rendering settings
          if (isMobile) {
            ctx.imageSmoothingEnabled = false; // Disable for mobile performance
          } else {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
          }
          
          // Clear canvas to black while waiting for initialization
          if (!gameEngineRef.current.isReady()) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          } else {
            // Update magnet timer with mobile throttling
            if (!isMobile || Math.random() < 0.5) { // 50% throttle on mobile
              updateMagnetTimer();
            }
            
            // Pass power-up states with mobile optimization
            const currentState = useCoinGame.getState();
            (window as any).magnetActive = currentState.magnetActive;
            (window as any).shieldActive = currentState.shieldActive;
            (window as any).extraLives = currentState.extraLives;
            
            // Significantly reduce logging on mobile
            if (!isMobile && (currentState.magnetActive || currentState.extraLives > 0)) {
              console.log('Power-up states passed to engine:', { 
                magnetActive: currentState.magnetActive, 
                shieldActive: currentState.shieldActive, 
                extraLives: currentState.extraLives 
              });
            }
            
            gameEngineRef.current.update();
            gameEngineRef.current.render(ctx);
          }
        } catch (error) {
          console.warn('Game loop error:', error);
          // Force canvas clear on error
          ctx.fillStyle = '#32CD32';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
    
    if (!isPaused) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isPaused, updateMagnetTimer, isMobile]);

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

    // Debounce resize to prevent constant resizing
    let resizeTimeout: NodeJS.Timeout | null = null;
    
    // Set canvas size using stable approach
    const resizeCanvas = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        ensureFullViewport();
        
        // Use a more stable approach - detect device type once and stick with it
        const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        let viewportWidth, viewportHeight;
        
        if (isIPad) {
          // For iPad, use fixed dimensions based on screen once detected
          viewportWidth = screen.width > screen.height ? screen.width : screen.height; // Use larger dimension
          viewportHeight = screen.width < screen.height ? screen.width : screen.height; // Use smaller dimension
          
          // Force to common iPad size if screen detection fails
          if (viewportWidth < 800) {
            viewportWidth = 1024;
            viewportHeight = 768;
          }
        } else {
          // For desktop/other devices, use window dimensions
          viewportWidth = window.innerWidth;
          viewportHeight = window.innerHeight;
        }
        
        const dpr = window.devicePixelRatio || 1;
        
        // Only resize if dimensions actually changed significantly
        const currentDisplayWidth = parseInt(canvas.style.width) || 0;
        const currentDisplayHeight = parseInt(canvas.style.height) || 0;
        
        if (Math.abs(currentDisplayWidth - viewportWidth) > 10 || Math.abs(currentDisplayHeight - viewportHeight) > 10) {
          // Set canvas internal resolution
          canvas.width = viewportWidth * dpr;
          canvas.height = viewportHeight * dpr;
          
          // Force canvas display size
          canvas.style.width = viewportWidth + 'px';
          canvas.style.height = viewportHeight + 'px';
          canvas.style.position = 'fixed';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.zIndex = '1';
          
          // Scale the context to match device pixel ratio
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(dpr, dpr);
          }
          
          console.log(`Canvas stabilized to: ${canvas.width}x${canvas.height} (internal), ${viewportWidth}x${viewportHeight} (display), DPR: ${dpr}`);
        }
      }, 250); // 250ms debounce
    };

    // Initial resize only
    resizeCanvas();
    
    // Add single resize listener with debouncing
    window.addEventListener("resize", resizeCanvas);
    
    // Prevent scrolling entirely
    const preventScroll = (e: Event) => {
      e.preventDefault();
      window.scrollTo(0, 0);
    };
    
    window.addEventListener("scroll", preventScroll, { passive: false });
    document.addEventListener("scroll", preventScroll, { passive: false });
    
    // Force initial state once
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    // Initialize game engine with canvas dimensions
    const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let engineWidth, engineHeight;
    
    if (isIPad) {
      // Use same logic as canvas for consistency
      engineWidth = screen.width > screen.height ? screen.width : screen.height;
      engineHeight = screen.width < screen.height ? screen.width : screen.height;
      if (engineWidth < 800) {
        engineWidth = 1024;
        engineHeight = 768;
      }
    } else {
      engineWidth = window.innerWidth;
      engineHeight = window.innerHeight;
    }
    
    gameEngineRef.current = new GameEngine(
      engineWidth,
      engineHeight,
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
        onShieldUsed: () => {
          console.log('Shield used callback triggered');
          const { useExtraLife } = useCoinGame.getState();
          useExtraLife();
          playHit(); // Sound effect for shield block
        },
        onLevelComplete: () => {
          winGame();
        },
        onPlayerMove: (x: number, y: number) => {
          setPlayerPosition(x, y);
        },
        onPowerupCollected: (type: 'magnet' | 'extralife') => {
          console.log('Power-up collected:', type);
          
          // Immediate audio feedback
          playSuccess();
          
          if (isMobile) {
            // Emergency mobile fix: Disable power-ups completely to prevent freezing
            console.warn('Power-up disabled on mobile to prevent freezing');
            return;
          } else {
            // Desktop: Direct activation
            if (type === 'magnet') {
              activateMagnet();
            } else if (type === 'extralife') {
              addExtraLife();
            }
          }
        },

      },
      currentLevel
    );

    // Set the selected avatar
    const selectedAvatar = getSelectedAvatar();
    if (selectedAvatar) {
      gameEngineRef.current.setAvatar({
        id: selectedAvatar.id,
        name: selectedAvatar.name,
        image: selectedAvatar.image
      });
    }

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

    // Start game loop immediately but with proper initialization checks
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

  // Update avatar when selection changes
  useEffect(() => {
    if (gameEngineRef.current) {
      const selectedAvatarData = getSelectedAvatar();
      if (selectedAvatarData) {
        console.log('Setting avatar to:', selectedAvatarData.id);
        gameEngineRef.current.setAvatar({
          id: selectedAvatarData.id,
          name: selectedAvatarData.name,
          image: selectedAvatarData.image
        });
      }
    }
  }, [selectedAvatar, getSelectedAvatar]);

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
