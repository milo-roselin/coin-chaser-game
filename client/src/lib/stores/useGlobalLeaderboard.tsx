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
  submitScore: (score: number, coins: number, level: number, highestLevelCompleted?: number) => Promise<boolean>;
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

  submitScore: async (score: number, coins: number, level: number, highestLevelCompleted?: number) => {
    try {
      console.log(`Submitting score to API: ${score} points, ${coins} coins, level ${level}, highest completed: ${highestLevelCompleted || level}`);
      
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ score, coins, level, highestLevelCompleted: highestLevelCompleted || level }),
      });

      const responseData = await response.json();
      console.log('Score submission response:', response.status, responseData);

      if (response.ok) {
        console.log('Score submitted successfully, refreshing leaderboard');
        // Refresh leaderboard after successful submission
        await get().fetchLeaderboard();
        return true;
      } else {
        console.error('Score submission failed:', responseData);
        set({ error: responseData.error || 'Failed to submit score' });
        return false;
      }
    } catch (error) {
      console.error('Score submission network error:', error);
      set({ error: 'Network error. Please try again.' });
      return false;
    }
  },
}));