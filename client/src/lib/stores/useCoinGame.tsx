import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GameState = "start" | "playing" | "gameOver" | "victory" | "leaderboard" | "nextLevel";

interface CoinGameState {
  gameState: GameState;
  score: number;
  coinsCollected: number;
  playerPosition: { x: number; y: number };
  currentLevel: number;
  
  // Actions
  startGame: () => void;
  resetGame: () => void;
  endGame: () => void;
  winGame: () => void;
  showLeaderboard: () => void;
  showNextLevel: () => void;
  nextLevel: () => void;
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
    currentLevel: 1,
    
    startGame: () => {
      set({ 
        gameState: "playing",
        score: 0,
        coinsCollected: 0,
        playerPosition: { x: 50, y: 300 },
        currentLevel: 1
      });
    },
    
    resetGame: () => {
      set({ 
        gameState: "start",
        score: 0,
        coinsCollected: 0,
        playerPosition: { x: 50, y: 300 },
        currentLevel: 1
      });
    },
    
    endGame: () => {
      set((state) => ({
        gameState: state.gameState === "playing" ? "gameOver" : state.gameState
      }));
    },
    
    winGame: () => {
      set((state) => ({
        gameState: state.gameState === "playing" ? "nextLevel" : state.gameState
      }));
    },
    
    showLeaderboard: () => {
      set({ gameState: "leaderboard" });
    },
    
    showNextLevel: () => {
      set({ gameState: "nextLevel" });
    },
    
    nextLevel: () => {
      set((state) => ({
        gameState: "playing",
        currentLevel: state.currentLevel + 1,
        playerPosition: { x: 50, y: 300 }
      }));
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
