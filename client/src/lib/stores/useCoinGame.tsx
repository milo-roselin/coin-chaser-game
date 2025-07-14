import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GameState = "start" | "playing" | "gameOver" | "victory" | "leaderboard";

interface CoinGameState {
  gameState: GameState;
  score: number;
  coinsCollected: number;
  playerPosition: { x: number; y: number };
  
  // Actions
  startGame: () => void;
  resetGame: () => void;
  endGame: () => void;
  winGame: () => void;
  showLeaderboard: () => void;
  updateScore: (points: number) => void;
  updateCoinsCollected: () => void;
  setPlayerPosition: (x: number, y: number) => void;
}

export const useCoinGame = create<CoinGameState>()(
  subscribeWithSelector((set, get) => ({
    gameState: "start",
    score: 0,
    coinsCollected: 0,
    playerPosition: { x: 50, y: 300 },
    
    startGame: () => {
      set({ 
        gameState: "playing",
        score: 0,
        coinsCollected: 0,
        playerPosition: { x: 50, y: 300 }
      });
    },
    
    resetGame: () => {
      set({ 
        gameState: "start",
        score: 0,
        coinsCollected: 0,
        playerPosition: { x: 50, y: 300 }
      });
    },
    
    endGame: () => {
      set((state) => ({
        gameState: state.gameState === "playing" ? "gameOver" : state.gameState
      }));
    },
    
    winGame: () => {
      set((state) => ({
        gameState: state.gameState === "playing" ? "victory" : state.gameState
      }));
    },
    
    showLeaderboard: () => {
      set({ gameState: "leaderboard" });
    },
    
    updateScore: (points: number) => {
      set((state) => ({ 
        score: state.score + points 
      }));
    },
    
    updateCoinsCollected: () => {
      set((state) => ({ 
        coinsCollected: state.coinsCollected + 1 
      }));
    },
    
    setPlayerPosition: (x: number, y: number) => {
      set({ playerPosition: { x, y } });
    }
  }))
);
