import { create } from 'zustand';

import { cacheInventory } from '../utils/localGameCache';

export const useUISystem = create((set, get) => ({
    currentScreen: 'LOGIN', // LOGIN, SPLASH, MENU, PROFILE, CHARACTERS, RANKING, ACHIEVEMENTS, GAME
    screenParams: null,
    
    // Player Stats persistentes (Mockados para o MVP Visual)
    playerStats: {
        nickname: 'Marcos',
        perfectHits: 98541,
        maxCombo: 510,
        timeFarmed: '85 Horas',
        globalRanking: '#15.241',
        diamonds: 0, // No banco de dados chama-se auracash
        auracash: 0
    },

    farmMode: 'six_seven', // six_seven | passo_jamal | none
    setScreen: (screen, params = null) => set({ currentScreen: screen, screenParams: params }),
    setFarmMode: (mode) => set({ farmMode: mode }),
    
    // Modal da Loja de Poções
    isShopModalOpen: false,
    setShopModalOpen: (isOpen) => set({ isShopModalOpen: isOpen }),

    // Função auxiliar para gastar Auracash (diamonds)
    spendAuracash: (amount) => {
        set((state) => {
            const current = state.playerStats.diamonds || state.playerStats.auracash || 0;
            if (current >= amount) {
                return {
                    playerStats: {
                        ...state.playerStats,
                        diamonds: current - amount,
                        auracash: current - amount
                    }
                };
            }
            return state;
        });
    },

    isOnlineMode: false,
    setIsOnlineMode: (isOnline) => set({ isOnlineMode: isOnline }),
    
    // Inventário de Poções
    inventory: [],
    addPotionToInventory: (potion) => {
        set((state) => {
            const inventory = [...state.inventory, { ...potion, instanceId: Date.now() + Math.random() }];
            // localStorage fora do caminho síncrono do set (menos hitch no collect)
            setTimeout(() => cacheInventory(inventory), 0);
            return { inventory };
        });
    },
    removePotionFromInventory: (instanceId) => {
        set((state) => {
            const inventory = state.inventory.filter(p => p.instanceId !== instanceId);
            setTimeout(() => cacheInventory(inventory), 0);
            return { inventory };
        });
    },
    setInventory: (inventory) => {
        const next = Array.isArray(inventory) ? inventory : [];
        setTimeout(() => cacheInventory(next), 0);
        set({ inventory: next });
    },

    // Atualiza status mockados (ou carregados do Firebase)
    updateStats: (stats) => {
        set((state) => ({ playerStats: { ...state.playerStats, ...stats, auracash: stats.diamonds ?? stats.auracash ?? state.playerStats.auracash } }));
        
        // Só AuraCash — nunca regrava aura/weeklyAura daqui (evita wipe pré-hidratação)
        if (stats.diamonds !== undefined || stats.auracash !== undefined) {
            const newDiamonds = stats.diamonds ?? stats.auracash;
            import('./useDatabaseSystem').then((dbSys) => {
                dbSys.useDatabaseSystem.getState().saveAuracashOnly(newDiamonds);
            });
        }
    },

    isMapMode: false,
    toggleMapMode: () => set((state) => ({ isMapMode: !state.isMapMode })),

    /** Modal customizado de anti-cheat (substitui alert do navegador). */
    antiCheatModal: null, // { title, body } | null
    showAntiCheatModal: (payload) => set({
        antiCheatModal: payload || {
            title: 'Auto-clique proibido',
            body: 'Que feio… Usar auto-clique estraga a economia e a diversão de quem joga limpo. No FarmAi o farm é na mão — trapaça não tem vez.',
        },
    }),
    dismissAntiCheatModal: () => set({ antiCheatModal: null }),
}));
