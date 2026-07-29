import { create } from 'zustand';

export const useUISystem = create((set) => ({
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

    farmMode: 'six_seven', // six_seven ou none
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
    addPotionToInventory: (potion) => set((state) => ({
        inventory: [...state.inventory, { ...potion, instanceId: Date.now() + Math.random() }]
    })),
    removePotionFromInventory: (instanceId) => set((state) => ({
        inventory: state.inventory.filter(p => p.instanceId !== instanceId)
    })),

    // Atualiza status mockados (ou carregados do Firebase)
    updateStats: (stats) => set((state) => ({ playerStats: { ...state.playerStats, ...stats, auracash: stats.diamonds || stats.auracash || state.playerStats.auracash } })),

    isMapMode: false,
    toggleMapMode: () => set((state) => ({ isMapMode: !state.isMapMode }))
}));
