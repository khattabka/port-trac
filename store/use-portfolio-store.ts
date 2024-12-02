import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TokenData, TokenEntry, Portfolio, TokenGroup } from "@/types";
import { startTokenUpdateWorker } from "@/lib/utils/token-updater";
import { immer } from "zustand/middleware/immer";

interface PortfolioStore extends Portfolio {
  addToken: (address: string, data: TokenData, entryPrice: number) => void;
  removeToken: (address: string) => void;
  updateEntryData: (address: string, price: number, marketCap: number) => void;
  updateTokenData: (address: string, data: Partial<TokenData>) => void;
  startTokenUpdates: () => () => void;
  createGroup: (name: string, description?: string) => void;
  removeGroup: (groupId: string) => void;
  addTokenToGroup: (groupId: string, tokenAddress: string) => void;
  removeTokenFromGroup: (groupId: string, tokenAddress: string) => void;
  updateGroupName: (groupId: string, name: string) => void;
  updateGroupDescription: (groupId: string, description: string) => void;
  addTokenNote: (address: string, note: string) => void;
  removeTokenNote: (address: string) => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
  immer(
    persist(
      (set, get) => ({
        tokens: {},
        groups: {},

        addToken: (address, data, entryPrice) =>
          set((state) => {
            state.tokens[address] = {
              ...data,
              entryData: {
                price: entryPrice,
                marketCap: data.marketCap || 0,
                timestamp: Date.now(),
              },
            };
          }),

        removeToken: (address) =>
          set((state) => {
            // Remove from tokens
            delete state.tokens[address];

            // Remove from all groups
            Object.keys(state.groups).forEach((groupId) => {
              const group = state.groups[groupId];
              if (group.tokens) {
                group.tokens = group.tokens.filter(
                  (token) => token !== address
                );
              }
            });
          }),

        updateEntryData: (address, price, marketCap) =>
          set((state) => {
            const token = state.tokens[address];
            if (token) {
              token.entryData = {
                price,
                marketCap,
                timestamp: Date.now(),
              };
            }
          }),

        updateTokenData: (address, data) =>
          set((state) => {
            const token = state.tokens[address];
            if (token) {
              // Perform a shallow merge of token data
              Object.keys(data).forEach((key) => {
                (token as any)[key] = (data as any)[key];
              });
            }
          }),

        startTokenUpdates: () => {
          const { tokens } = get();
          const updateWorker = startTokenUpdateWorker(tokens, {
            updateTokens: async (updatedTokens) => {
              set((state) => {
                Object.entries(updatedTokens).forEach(([address, data]) => {
                  const token = state.tokens[address];
                  if (token) {
                    Object.keys(data).forEach((key) => {
                      (token as any)[key] = (data as any)[key];
                    });
                  }
                });
              });
            },
            queueTokenUpdate: () => {},
            shouldUpdateToken: () => true,
            lastUpdated: {},
            updateInterval: 5 * 60 * 1000,
            fetchQueue: [],
          });

          return updateWorker;
        },

        createGroup: (name, description) =>
          set((state) => {
            const id = `group_${Date.now()}`;
            state.groups[id] = {
              id,
              name,
              description,
              tokens: [],
            };
          }),

        removeGroup: (groupId) =>
          set((state) => {
            delete state.groups[groupId];
          }),

        addTokenToGroup: (groupId, tokenAddress) =>
          set((state) => {
            const group = state.groups[groupId];
            if (group) {
              // Prevent duplicate tokens
              if (!group.tokens) {
                group.tokens = [];
              }
              if (!group.tokens.includes(tokenAddress)) {
                group.tokens.push(tokenAddress);
              }
            }
          }),

        removeTokenFromGroup: (groupId, tokenAddress) =>
          set((state) => {
            const group = state.groups[groupId];
            if (group && group.tokens) {
              group.tokens = group.tokens.filter(
                (token) => token !== tokenAddress
              );
            }
          }),

        updateGroupName: (groupId, name) =>
          set((state) => {
            const group = state.groups[groupId];
            if (group) {
              group.name = name;
            }
          }),

        updateGroupDescription: (groupId, description) =>
          set((state) => {
            const group = state.groups[groupId];
            if (group) {
              group.description = description;
            }
          }),

        addTokenNote: (address, note) =>
          set((state) => {
            const token = state.tokens[address];
            if (token) {
              token.note = note;
            }
          }),

        removeTokenNote: (address) =>
          set((state) => {
            const token = state.tokens[address];
            if (token) {
              delete token.note;
            }
          }),
      }),
      {
        name: "portfolio-storage",
      }
    )
  )
);
