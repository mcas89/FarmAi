import { create } from 'zustand';

export const useUISystem = create((set) => ({
    currentScreen: 'LOGIN', // LOGIN, SPLASH, MENU, PROFILE, CHARACTERS, RANKING, ACHIEVEMENTS, GAME
    
    // Player Stats persistentes (Mockados para o MVP Visual)
    playerStats: {
        nickname: 'Marcos',
        perfectHits: 98541,
        maxCombo: 510,
        timeFarmed: '85 Horas',
        globalRanking: '#15.241',
    },

    setScreen: (screen) => set({ currentScreen: screen }),
    
    // Atualiza status mockados se necessário no futuro
    updateStats: (stats) => set((state) => ({ playerStats: { ...state.playerStats, ...stats } }))
}));
