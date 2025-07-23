import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  coinBank: number;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  syncCoinBank: (coinBank: number) => Promise<boolean>;
  addCoinsToBank: (coins: number) => Promise<boolean>;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ user: data.user, error: null });
            
            // Sync coin bank with user data
            if (data.user?.coinBank !== undefined) {
              const { syncWithUser } = require('./useCoinBank').useCoinBank.getState();
              syncWithUser(data.user.coinBank);
            }
          } else {
            set({ user: null });
          }
        } catch (error) {
          set({ user: null });
        }
      },

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (response.ok) {
            set({ user: data.user, isLoading: false, error: null });
            
            // Sync coin bank with user data
            if (data.user?.coinBank !== undefined) {
              const { syncWithUser } = require('./useCoinBank').useCoinBank.getState();
              syncWithUser(data.user.coinBank);
            }
            
            return true;
          } else {
            set({ error: data.error, isLoading: false });
            return false;
          }
        } catch (error) {
          set({ error: 'Network error. Please try again.', isLoading: false });
          return false;
        }
      },

      register: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (response.ok) {
            set({ user: data.user, isLoading: false, error: null });
            
            // Sync coin bank with user data for new users
            if (data.user?.coinBank !== undefined) {
              const { syncWithUser } = require('./useCoinBank').useCoinBank.getState();
              syncWithUser(data.user.coinBank);
            }
            
            return true;
          } else {
            set({ error: data.error, isLoading: false });
            return false;
          }
        } catch (error) {
          set({ error: 'Network error. Please try again.', isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, error: null });
        }
      },

      syncCoinBank: async (coinBank: number) => {
        const { user } = get();
        if (!user) return false;

        try {
          const response = await fetch('/api/coinbank', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ coinBank }),
          });

          if (response.ok) {
            set({ user: { ...user, coinBank } });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Coin bank sync error:', error);
          return false;
        }
      },

      addCoinsToBank: async (coins: number) => {
        const { user } = get();
        if (!user) return false;

        try {
          const response = await fetch('/api/coinbank/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ coins }),
          });

          if (response.ok) {
            const data = await response.json();
            set({ user: { ...user, coinBank: data.coinBank } });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Add coins error:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);