import { create } from 'zustand';

// O "Radar" de física do jogo
export const useCollisionSystem = create((set, get) => ({
    obstacles: [],
    /** Raio máximo do mapa (parede invisível circular). null = sem limite. */
    worldRadius: null,

    setWorldRadius: (radius) => set({ worldRadius: radius }),

    // Registra um objeto sólido no mapa
    registerObstacle: (id, x, z, radius) => {
        set((state) => {
            // Evita duplicação caso o React monte 2x no modo Dev
            const exists = state.obstacles.some(ob => ob.id === id);
            if (exists) return state;

            return {
                obstacles: [...state.obstacles, { id, x, z, radius }]
            };
        });
    },

    // Remove do mapa
    removeObstacle: (id) => {
        set((state) => ({
            obstacles: state.obstacles.filter(ob => ob.id !== id)
        }));
    },

    // Função auxiliar que limpa tudo (útil ao desmontar cena)
    clearObstacles: () => {
        set({ obstacles: [], worldRadius: null });
    }
}));
