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
  removeScore: (name: string) => void;
  updatePlayerName: (oldName: string, newName: string) => void;
  clearScores: () => void;
}

export const useLeaderboard = create<LeaderboardState>()(
  persist(
    (set, get) => ({
      scores: [],
      
      addScore: (newScore: LeaderboardScore) => {
        set((state) => {
          // Remove existing entries for this user
          const scoresWithoutUser = state.scores.filter(score => score.name !== newScore.name);
          
          // Add the new score and sort by score descending
          const updatedScores = [...scoresWithoutUser, newScore]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Keep only top 10 scores
          
          return { scores: updatedScores };
        });
      },
      
      removeScore: (name: string) => {
        set((state) => ({
          scores: state.scores.filter(score => score.name !== name)
        }));
      },
      
      updatePlayerName: (oldName: string, newName: string) => {
        set((state) => ({
          scores: state.scores.map(score => 
            score.name === oldName 
              ? { ...score, name: newName.trim() || oldName } 
              : score
          )
        }));
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
