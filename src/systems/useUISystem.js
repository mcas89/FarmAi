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
    updateStats: (stats) => {
        set((state) => ({ playerStats: { ...state.playerStats, ...stats, auracash: stats.diamonds || stats.auracash || state.playerStats.auracash } }));
        
        // Se o auracash/diamonds mudou, salva imediatamente no banco
        if (stats.diamonds !== undefined || stats.auracash !== undefined) {
            const newDiamonds = stats.diamonds ?? stats.auracash;
            Promise.all([
                import('./usePlayerSystem'),
                import('./useDatabaseSystem'),
                import('./useQuestSystem'),
                import('./useAchievementSystem'),
                import('./useAuraSystem')
            ]).then(([pSys, dbSys, qSys, achSys, aSys]) => {
                const pos = pSys.usePlayerSystem.getState().position;
                const model = pSys.usePlayerSystem.getState().activeModel;
                const unlockedCharacters = pSys.usePlayerSystem.getState().unlockedCharacters;
                const { aura, comboCount, maxCombo, weeklyAura } = aSys.useAuraSystem.getState();
                const { dailyQuests, lastResetDate } = qSys.useQuestSystem.getState();
                const achievements = achSys.useAchievementSystem.getState().getSavableData();
                dbSys.useDatabaseSystem.getState().saveGameState(
                    pos, comboCount, model, aura, newDiamonds, maxCombo, dailyQuests, lastResetDate, weeklyAura, undefined, achievements, unlockedCharacters
                );
                console.log(`[DiamondSave] AuraCash=${newDiamonds} salvo imediatamente.`);
            });
        }
    },

    isMapMode: false,
    toggleMapMode: () => set((state) => ({ isMapMode: !state.isMapMode }))
}));
