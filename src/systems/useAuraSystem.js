import { create } from 'zustand';
import { useQuestSystem } from './useQuestSystem';
import { getPlayerLevel } from './progressionRules';

export const useAuraSystem = create((set, get) => ({
    aura: 0,
    weeklyAura: 0,
    message: '', 
    lastPoints: 0,
    comboCount: 0,
    maxCombo: 0,
    hitId: 0,
    
    registerHit: (pointsGained, message, comboCount = 0) => set((state) => {
        // A aura não cai abaixo de zero, mas punições (-5) são aplicadas normalmente.
        const newAura = Math.max(0, state.aura + pointsGained);
        const newWeeklyAura = Math.max(0, state.weeklyAura + pointsGained);
        const newMaxCombo = Math.max(state.maxCombo, comboCount);
        
        // Atualiza o progresso das missões em background
        if (pointsGained > 0) {
            useQuestSystem.getState().updateQuestProgress('gain_aura', pointsGained);
        }
        if (comboCount > 0) {
            useQuestSystem.getState().updateQuestProgress('reach_combo', comboCount);
        }

        // Atualiza o progresso das conquistas
        import('./useAchievementSystem').then(m => {
            // BUG #1 FIX: removido updateProgress('level') — conquistas de título usam type:'aura'
            if (comboCount > 0) m.useAchievementSystem.getState().updateProgress('combo', comboCount);
            if (newAura    > 0) m.useAchievementSystem.getState().updateProgress('aura',  newAura);
        });
        
        return {
            aura: newAura,
            weeklyAura: newWeeklyAura,
            lastPoints: pointsGained,
            message: message,
            comboCount: comboCount,
            maxCombo: newMaxCombo,
            hitId: Date.now() + Math.random()
        };
    })
}));
