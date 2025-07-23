import { create } from 'zustand';

interface LeaderboardEntry {
  id: number;
  userId: number;
  username: string;
  score: number;
  coins: number;
  level: number;
  createdAt: string;
}

interface GlobalLeaderboardStore {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
  submitScore: (score: number, coins: number, level: number) => Promise<boolean>;
  clearError: () => void;
}

export const useGlobalLeaderboard = create<GlobalLeaderboardStore>()((set, get) => ({
  leaderboard: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchLeaderboard: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/leaderboard', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        set({ leaderboard: data.leaderboard, isLoading: false });
      } else {
        const errorData = await response.json();
        set({ error: errorData.error || 'Failed to fetch leaderboard', isLoading: false });
      }
    } catch (error) {
      set({ error: 'Network error. Please try again.', isLoading: false });
    }
  },

  submitScore: async (score: number, coins: number, level: number) => {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ score, coins, level }),
      });

      if (response.ok) {
        // Refresh leaderboard after successful submission
        await get().fetchLeaderboard();
        return true;
      } else {
        const errorData = await response.json();
        set({ error: errorData.error || 'Failed to submit score' });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error. Please try again.' });
      return false;
    }
  },
}));