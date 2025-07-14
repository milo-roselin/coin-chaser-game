import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LeaderboardScore {
  name: string;
  score: number;
  coins: number;
  date: string;
}

interface LeaderboardState {
  scores: LeaderboardScore[];
  addScore: (score: LeaderboardScore) => void;
  clearScores: () => void;
}

export const useLeaderboard = create<LeaderboardState>()(
  persist(
    (set, get) => ({
      scores: [],
      
      addScore: (newScore: LeaderboardScore) => {
        set((state) => {
          const updatedScores = [...state.scores, newScore]
            .sort((a, b) => b.score - a.score) // Sort by score descending
            .slice(0, 10); // Keep only top 10 scores
          
          return { scores: updatedScores };
        });
      },
      
      clearScores: () => {
        set({ scores: [] });
      }
    }),
    {
      name: "coin-game-leaderboard",
      version: 1
    }
  )
);
