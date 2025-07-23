import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuth } from './useAuth';

interface CoinBankState {
  totalCoins: number;
  sessionCoins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  resetSessionCoins: () => void;
  getTotalCoins: () => number;
  getSessionCoins: () => number;
  syncWithUser: (userCoinBank: number) => void;
  syncToDatabase: () => Promise<void>;
}

export const useCoinBank = create<CoinBankState>()(
  persist(
    (set, get) => ({
      totalCoins: 0,
      sessionCoins: 0,
      
      addCoins: (amount: number) => {
        set((state) => ({
          totalCoins: state.totalCoins + amount,
          sessionCoins: state.sessionCoins + amount,
        }));
        
        // Sync to database if user is authenticated
        get().syncToDatabase();
      },

      spendCoins: (amount: number) => {
        const { totalCoins } = get();
        if (totalCoins >= amount) {
          set((state) => ({
            totalCoins: state.totalCoins - amount,
          }));
          return true;
        }
        return false;
      },
      
      resetSessionCoins: () => {
        set({ sessionCoins: 0 });
      },
      
      getTotalCoins: () => get().totalCoins,
      
      getSessionCoins: () => get().sessionCoins,

      syncWithUser: (userCoinBank: number) => {
        set({ totalCoins: userCoinBank });
      },

      syncToDatabase: async () => {
        const { totalCoins } = get();
        const authState = useAuth.getState();
        
        if (authState.user) {
          await authState.syncCoinBank(totalCoins);
        }
      },
    }),
    {
      name: 'coin-bank-storage',
      partialize: (state) => ({ totalCoins: state.totalCoins }),
    }
  )
);