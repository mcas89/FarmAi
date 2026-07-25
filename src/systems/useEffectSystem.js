import { create } from 'zustand';

export const useEffectSystem = create((set) => ({
    activeEffects: [],
    addEffect: (effect) => set((state) => ({ 
        activeEffects: [...state.activeEffects, effect] 
    })),
    removeEffect: (effectId) => set((state) => ({ 
        activeEffects: state.activeEffects.filter(e => e.id !== effectId) 
    }))
}));
