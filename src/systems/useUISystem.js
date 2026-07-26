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
    },

    setScreen: (screen, params = null) => set({ currentScreen: screen, screenParams: params }),
    
    isOnlineMode: false,
    setIsOnlineMode: (isOnline) => set({ isOnlineMode: isOnline }),
    
    // Atualiza status mockados se necessário no futuro
    updateStats: (stats) => set((state) => ({ playerStats: { ...state.playerStats, ...stats } })),

    isMapMode: false,
    toggleMapMode: () => set((state) => ({ isMapMode: !state.isMapMode }))
}));
