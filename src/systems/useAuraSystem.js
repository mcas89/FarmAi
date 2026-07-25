import { create } from 'zustand';

const calculateTitle = (aura) => {
    if (aura >= 1000000000) return 'Deus da Aura';
    if (aura >= 100000000) return 'Rei da Aura';
    if (aura >= 10000000) return 'Mega Aura';
    if (aura >= 5000000) return 'Master Farmador';
    if (aura >= 1000000) return 'Farmador Rei';
    if (aura >= 500000) return 'Farmador Profissional';
    if (aura >= 250000) return 'Farmador';
    if (aura >= 100000) return 'Rei Omega';
    if (aura >= 50000) return 'Omega';
    if (aura >= 15000) return 'Super Sigma';
    if (aura >= 10000) return 'Sigma';
    if (aura >= 5500) return 'Beta';
    return 'Betinha';
};

export const useAuraSystem = create((set) => ({
    aura: 0,
    level: 0,
    title: 'Betinha',
    message: '', 
    lastPoints: 0,
    comboCount: 0,
    hitId: 0,
    
    registerHit: (pointsGained, message, comboCount = 0) => set((state) => {
        // A aura não cai abaixo de zero, mas punições (-5) são aplicadas normalmente.
        const newAura = Math.max(0, state.aura + pointsGained);
        const newLevel = Math.floor(newAura / 500);
        
        return {
            aura: newAura,
            level: newLevel,
            lastPoints: pointsGained,
            message: message,
            comboCount: comboCount,
            hitId: Date.now() + Math.random(),
            title: calculateTitle(newAura)
        };
    })
}));
