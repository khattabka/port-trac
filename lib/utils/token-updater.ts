import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchTokenData } from './token';
import { TokenData } from '@/types';

interface TokenUpdateStore {
  lastUpdated: { [address: string]: number };
  updateInterval: number;
  fetchQueue: string[];
  
  // Add a token to the update queue
  queueTokenUpdate: (address: string) => void;
  
  // Batch update tokens
  updateTokens: (tokens: { [address: string]: TokenData }) => Promise<void>;
  
  // Check if a token needs an update
  shouldUpdateToken: (address: string) => boolean;
}

export const useTokenUpdateStore = create<TokenUpdateStore>()(
  persist(
    (set, get) => ({
      lastUpdated: {},
      updateInterval: 5 * 60 * 1000, // 5 minutes
      fetchQueue: [],
      
      queueTokenUpdate: (address) => {
        set((state) => {
          const currentQueue = new Set(state.fetchQueue);
          currentQueue.add(address);
          return { fetchQueue: Array.from(currentQueue) };
        });
      },
      
      updateTokens: async (tokens) => {
        const { fetchQueue, lastUpdated, updateInterval } = get();
        const currentTime = Date.now();
        
        // Filter tokens that need updating
        const tokensToUpdate = fetchQueue.filter(address => 
          get().shouldUpdateToken(address)
        );
        
        // Limit batch updates to prevent rate limiting
        const batchSize = 10;
        const batch = tokensToUpdate.slice(0, batchSize);
        
        // Perform updates
        const updates = await Promise.all(
          batch.map(async (address) => {
            try {
              const updatedToken = await fetchTokenData(address);
              return { address, data: updatedToken };
            } catch (error) {
              console.error(`Failed to update token ${address}:`, error);
              return null;
            }
          })
        );
        
        // Update store with successful updates
        const validUpdates = updates.filter(update => update !== null);
        
        set((state) => {
          const newLastUpdated = { ...state.lastUpdated };
          const newTokens = { ...tokens };
          
          validUpdates.forEach(update => {
            if (update) {
              newLastUpdated[update.address] = currentTime;
              newTokens[update.address] = {
                ...newTokens[update.address],
                ...update.data,
              };
            }
          });
          
          return {
            lastUpdated: newLastUpdated,
            fetchQueue: state.fetchQueue.filter(
              address => !batch.includes(address)
            ),
          };
        });
      },
      
      shouldUpdateToken: (address) => {
        const { lastUpdated, updateInterval } = get();
        const lastUpdate = lastUpdated[address] || 0;
        return Date.now() - lastUpdate > updateInterval;
      },
    }),
    {
      name: 'token-update-storage',
      partialize: (state) => ({
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

// Background update worker
export function startTokenUpdateWorker(
  tokens: { [address: string]: TokenData },
  updateStore: ReturnType<typeof useTokenUpdateStore.getState>
) {
  const updateTokens = async () => {
    // Queue all tokens for potential update
    Object.keys(tokens).forEach(address => 
      updateStore.queueTokenUpdate(address)
    );
    
    // Perform updates
    await updateStore.updateTokens(tokens);
  };
  
  // Initial update
  updateTokens();
  
  // Periodic updates
  const intervalId = setInterval(updateTokens, 5 * 60 * 1000); // Every 5 minutes
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}
