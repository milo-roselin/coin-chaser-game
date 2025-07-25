import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { GameEngine } from "../../lib/gameEngine";
import { useCoinGame } from "../../lib/stores/useCoinGame";
import { useAudio } from "../../lib/stores/useAudio";
import { useCoinBank } from "../../lib/stores/useCoinBank";
import { useAuth } from "../../lib/stores/useAuth";
import { useUserStats } from "../../lib/stores/useUserStats";
import { useIsMobile } from "../../hooks/use-is-mobile";

const GameCanvas = forwardRef<{ togglePause: () => void }, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gameStateRef = useRef<string>("start");
  const isPausedRef = useRef<boolean>(false);
  const penaltyAppliedRef = useRef<boolean>(false);
  
  // State update queue to batch updates and prevent flashing
  const updateQueueRef = useRef<{
    scoreUpdates: number[];
    coinUpdates: number;
    lastFlush: number;
  }>({
    scoreUpdates: [],
    coinUpdates: 0,
    lastFlush: Date.now()
  });

  const isMobile = useIsMobile();
  const { playCoin, playExplosion } = useAudio();
  const { user } = useAuth();
  const { applyTNTPenalty, fetchUserStats } = useUserStats();
  
  // Get store actions without subscribing to state changes
  const updateScore = useCoinGame.getState().updateScore;
  const updateCoinsCollected = useCoinGame.getState().updateCoinsCollected;
  const endGame = useCoinGame.getState().endGame;
  const winGame = useCoinGame.getState().winGame;
  const addCoins = useCoinBank.getState().addCoins;

  // Batch state updates to prevent re-renders during gameplay
  const flushUpdates = () => {
    const queue = updateQueueRef.current;
    if (queue.scoreUpdates.length > 0 || queue.coinUpdates > 0) {
      // Apply all score updates at once
      const totalScore = queue.scoreUpdates.reduce((sum, score) => sum + score, 0);
      if (totalScore > 0) {
        updateScore(totalScore);
      }
      
      // Apply all coin updates at once
      if (queue.coinUpdates > 0) {
        for (let i = 0; i < queue.coinUpdates; i++) {
          updateCoinsCollected();
        }
        addCoins(queue.coinUpdates);
      }
      
      // Clear queue
      queue.scoreUpdates = [];
      queue.coinUpdates = 0;
      queue.lastFlush = Date.now();
    }
  };

  // Game loop that runs independently of React
  const gameLoop = () => {
    if (gameEngineRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        if (!gameEngineRef.current.isReady()) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        } else {
          gameEngineRef.current.update();
          gameEngineRef.current.render(ctx);
        }
      }
    }
    
    // Batch flush updates every 500ms to prevent flashing
    const now = Date.now();
    if (now - updateQueueRef.current.lastFlush > 500) {
      flushUpdates();
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  // Initialize canvas and game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = viewportWidth * dpr;
      canvas.height = viewportHeight * dpr;
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Recreate game engine with new dimensions
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }

      const engineWidth = viewportWidth;
      const engineHeight = viewportHeight;

      gameEngineRef.current = new GameEngine(
        engineWidth,
        engineHeight,
        {
          onCoinCollected: (score: number) => {
            playCoin();
            // Queue the update instead of applying immediately
            updateQueueRef.current.scoreUpdates.push(score);
            updateQueueRef.current.coinUpdates += 1;
          },
          onObstacleHit: () => {
            // Flush any pending updates before ending game
            flushUpdates();
            
            playExplosion();
            endGame();
            
            if (user && !penaltyAppliedRef.current) {
              penaltyAppliedRef.current = true;
              console.log('TNT hit! Applying 500 point penalty for logged-in user:', user.username);
              
              setTimeout(async () => {
                try {
                  await applyTNTPenalty(500);
                  await fetchUserStats();
                  console.log('500 point penalty applied successfully - you lost 500 points but kept your coins!');
                } catch (error) {
                  console.error('Failed to apply TNT penalty:', error);
                }
              }, 100);
            } else if (!user) {
              console.log('TNT hit! Guest user - no penalty applied');
            }
          },
          onLevelComplete: () => {
            // Flush any pending updates before winning
            flushUpdates();
            winGame();
          },
          onPlayerMove: (x: number, y: number) => {
            // Handle player movement if needed
          }
        }
      );

      console.log(`Canvas stabilized to: ${canvas.width}x${canvas.height} (internal), ${canvas.style.width}x${canvas.style.height} (display), DPR: ${dpr}`);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Start game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Listen to game state changes from the store
  useEffect(() => {
    const unsubscribe = useCoinGame.subscribe((state) => {
      gameStateRef.current = state.gameState;
      
      if (state.gameState === "playing") {
        penaltyAppliedRef.current = false;
        // Clear update queue for new game
        updateQueueRef.current = {
          scoreUpdates: [],
          coinUpdates: 0,
          lastFlush: Date.now()
        };
      }
      
      if (gameEngineRef.current) {
        if (state.gameState === "playing") {
          gameEngineRef.current.startLevel(state.currentLevel, state.levelData);
        } else {
          gameEngineRef.current.stopLevel();
        }
      }
    });

    return unsubscribe;
  }, []);

  // Touch event handlers
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
      isPausedRef.current = !isPausedRef.current;
      // Force a re-render only for pause state
      useCoinGame.setState({ gameState: gameStateRef.current });
    }
  };

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
      
      {/* Pause overlay - only show when actually paused */}
      {isPausedRef.current && (
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