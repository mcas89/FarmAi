import { create } from 'zustand';
import { useQuestSystem } from './useQuestSystem';
import { getPlayerLevel } from './progressionRules';
import { useAchievementSystem } from './useAchievementSystem';

export const useAuraSystem = create((set, get) => ({
    aura: 0,
    weeklyAura: 0,
    message: '', 
    lastPoints: 0,
    comboCount: 0,
    maxCombo: 0,
    hitId: 0,
    isMilestone: false,
    hitSide: 'left',
    auraMultiplier: 1,
    multiplierEndTime: null,

    setMultiplier: (val, durationMs) => set({ 
        auraMultiplier: val,
        multiplierEndTime: durationMs ? Date.now() + durationMs : null
    }),
    
    registerHit: (pointsGained, message, comboCount = 0, isMilestone = false, side = 'left') => {
        // PASSO 1: Atualiza o estado do combo IMEDIATAMENTE (sem bloqueio)
        // Nenhum processamento secundário aqui — só os números que o jogo precisa
        set((state) => {
            const newAura = Math.max(0, state.aura + pointsGained);
            const newWeeklyAura = Math.max(0, state.weeklyAura + pointsGained);
            const newMaxCombo = Math.max(state.maxCombo, comboCount);

            // PASSO 2: Processa missões e conquistas no PRÓXIMO TICK (não bloqueia o combo)
            // setTimeout(fn, 0) empurra para fora do event loop atual
            setTimeout(() => {
                if (pointsGained > 0) {
                    useQuestSystem.getState().updateQuestProgress('gain_aura', pointsGained);
                    useQuestSystem.getState().updateQuestProgress('make_touches', 1);
                }
                if (comboCount > 0) {
                    useQuestSystem.getState().updateQuestProgress('reach_combo', comboCount);
                }
                // BUG #1 FIX: removido updateProgress('level') — conquistas de título usam type:'aura'
                if (comboCount > 0) useAchievementSystem.getState().updateProgress('combo', comboCount);
                if (newAura    > 0) useAchievementSystem.getState().updateProgress('aura',  newAura);
            }, 0);

            return {
                aura: newAura,
                weeklyAura: newWeeklyAura,
                lastPoints: pointsGained,
                message: message,
                comboCount: comboCount,
                maxCombo: newMaxCombo,
                hitId: Date.now() + Math.random(),
                isMilestone: isMilestone,
                hitSide: side
            };
        });
    }
}));
