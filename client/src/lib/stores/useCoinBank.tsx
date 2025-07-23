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
        
        // Sync to database if user is authenticated (debounced to avoid too many calls)
        setTimeout(() => get().syncToDatabase(), 100);
      },

      spendCoins: (amount: number) => {
        const { totalCoins } = get();
        if (totalCoins >= amount) {
          set((state) => ({
            totalCoins: state.totalCoins - amount,
          }));
          
          // Sync to database if user is authenticated
          get().syncToDatabase();
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
        // Only sync if the database value is different from local storage
        const { totalCoins } = get();
        if (userCoinBank !== totalCoins) {
          set({ totalCoins: userCoinBank });
        }
      },

      syncToDatabase: async () => {
        const { totalCoins } = get();
        const authState = useAuth.getState();
        
        if (authState.user) {
          const success = await authState.syncCoinBank(totalCoins);
          if (!success) {
            console.error('Failed to sync coin bank to database');
          }
        }
      },
    }),
    {
      name: 'coin-bank-storage',
      partialize: (state) => ({ totalCoins: state.totalCoins }),
    }
  )
);