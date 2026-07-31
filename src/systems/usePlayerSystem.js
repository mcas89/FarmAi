import { create } from 'zustand';

// Gera uma posição segura na praça (evitando o centro onde fica a fonte)
// Raio da fonte = ~4.5m, Raio da praça = ~15m
export const getSafeRandomSpawn = () => {
    const minRadius = 6.0;
    const maxRadius = 13.0;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const angle = Math.random() * Math.PI * 2;
    return [Math.sin(angle) * radius, 0, Math.cos(angle) * radius];
};

export const usePlayerSystem = create((set) => ({
    position: getSafeRandomSpawn(),
    rotation: [0, 0, 0],
    currentState: 'idle', // idle, walk, farm, duel, etc.
    activeModel: 'Carol.vrm', // modelo atual
    unlockedCharacters: ['Carol.vrm', 'rafa.vrm'], // personagens desbloqueados
    setPosition: (pos) => set({ position: pos }),
    setRotation: (rot) => set({ rotation: rot }),
    setState: (state) => set({ currentState: state }),
    setActiveModel: (model) => set({ activeModel: model }),
    setUnlockedCharacters: (chars) => {
        const defaultChars = ['Carol.vrm', 'rafa.vrm'];
        const merged = Array.from(new Set([...defaultChars, ...chars]));
        set({ unlockedCharacters: merged });
    }
}));
