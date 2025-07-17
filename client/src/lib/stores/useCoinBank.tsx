import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CoinBankState {
  totalCoins: number;
  sessionCoins: number;
  addCoins: (amount: number) => void;
  resetSessionCoins: () => void;
  getTotalCoins: () => number;
  getSessionCoins: () => number;
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
      },
      
      resetSessionCoins: () => {
        set({ sessionCoins: 0 });
      },
      
      getTotalCoins: () => get().totalCoins,
      
      getSessionCoins: () => get().sessionCoins,
    }),
    {
      name: 'coin-bank-storage',
      partialize: (state) => ({ totalCoins: state.totalCoins }),
    }
  )
);