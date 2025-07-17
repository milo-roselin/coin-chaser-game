import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useAudio } from "@/lib/stores/useAudio";
import { GameEngine } from "@/lib/gameEngine";

const GameCanvas = forwardRef<{ togglePause: () => void }, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

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

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

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
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop, updateScore, updateCoinsCollected, endGame, winGame, setPlayerPosition, playHit, playSuccess]);

  // Handle touch input with direct position tracking
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (gameEngineRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        gameEngineRef.current.handlePointerStart(x, y);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    if (gameEngineRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        gameEngineRef.current.handlePointerMove(x, y);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (gameEngineRef.current) {
      gameEngineRef.current.handlePointerEnd();
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
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
