import { create } from 'zustand';
import { useAuth } from './useAuth';

interface UserStats {
  highestScore: number;
  totalCoins: number;
  highestLevel: number;
  recentScores: Array<{
    score: number;
    coins: number;
    level: number;
    createdAt: string;
  }>;
}

interface UserStatsStore {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  fetchUserStats: () => Promise<void>;
  clearStats: () => void;
  getHighestScore: () => number;
  getHighestLevel: () => number;
}

export const useUserStats = create<UserStatsStore>((set, get) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchUserStats: async () => {
    const authState = useAuth.getState();
    if (!authState.user) {
      set({ stats: null, error: null });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/scores/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const scores = data.scores || [];
        
        // Calculate stats from user's scores
        const stats: UserStats = {
          highestScore: scores.length > 0 ? Math.max(...scores.map((s: any) => s.score)) : 0,
          totalCoins: scores.reduce((sum: number, s: any) => sum + s.coins, 0),
          highestLevel: scores.length > 0 ? Math.max(...scores.map((s: any) => s.level)) : 1,
          recentScores: scores.slice(0, 10),
        };

        set({ stats, isLoading: false, error: null });
      } else {
        set({ stats: null, isLoading: false, error: 'Failed to fetch user stats' });
      }
    } catch (error) {
      console.error('User stats fetch error:', error);
      set({ stats: null, isLoading: false, error: 'Network error' });
    }
  },

  clearStats: () => {
    set({ stats: null, error: null });
  },

  getHighestScore: () => {
    const { stats } = get();
    const authState = useAuth.getState();
    
    if (authState.user && stats) {
      return stats.highestScore;
    }
    
    // Fall back to local storage for guests
    const localStats = JSON.parse(localStorage.getItem('coin-game-storage') || '{}');
    return localStats.state?.totalScore || 0;
  },

  getHighestLevel: () => {
    const { stats } = get();
    const authState = useAuth.getState();
    
    if (authState.user && stats) {
      return Math.max(stats.highestLevel, 1);
    }
    
    // Fall back to local storage for guests
    const localStats = JSON.parse(localStorage.getItem('coin-game-storage') || '{}');
    return localStats.state?.highestLevelUnlocked || 1;
  },
}));