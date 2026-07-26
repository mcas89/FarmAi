import { create } from 'zustand';

// Gera uma posição segura na praça (evitando o centro onde fica a fonte)
// Raio da fonte = ~4.5m, Raio da praça = ~15m
const getSafeRandomSpawn = () => {
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
    activeModel: 'san.vrm', // modelo atual
    unlockedCharacters: ['san.vrm', 'deric.vrm'], // personagens desbloqueados
    setPosition: (pos) => set({ position: pos }),
    setRotation: (rot) => set({ rotation: rot }),
    setState: (state) => set({ currentState: state }),
    setActiveModel: (model) => set({ activeModel: model }),
    setUnlockedCharacters: (chars) => set({ unlockedCharacters: chars })
}));
