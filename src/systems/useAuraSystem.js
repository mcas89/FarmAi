import { create } from 'zustand';
import { useQuestSystem } from './useQuestSystem';
import { getPlayerLevel } from './progressionRules';
import { useAchievementSystem } from './useAchievementSystem';

const SIGNAL_WEIGHTS = {
  untrustedEvent: 45,           // event.isTrusted === false
  hiddenTabClick: 35,           // documento oculto / aba em background
  impossibleRate: 30,           // média de intervalo extremamente baixa
  extremelyLowVariance: 22,     // intervalos quase idênticos
  duplicateSequence: 40,        // sequências de cliques exatamente repetidas
  longPerfectSession: 12,       // vários minutos sem nenhuma pausa natural
  perfectSideAlternation: 15,   // alternância esquerda/direita matemática
  clickOutsideInteractive: 25,  // clique fora das áreas válidas
};

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

    suspicionScore: 0,
    isFarmBlocked: false,
    blockMessage: null,
    clickHistory: [],

    setMultiplier: (val, durationMs) => set({ 
        auraMultiplier: val,
        multiplierEndTime: durationMs ? Date.now() + durationMs : null
    }),

    spendAura: (amount) => set((state) => {
        if (state.aura >= amount) {
            return { aura: state.aura - amount };
        }
        return state;
    }),

    blockFarmMode: (msg) => set({
        isFarmBlocked: true,
        blockMessage: msg,
        comboCount: 0,
        message: msg,
        clickHistory: []
    }),

    unblockFarmMode: () => set({
        isFarmBlocked: false,
        blockMessage: null,
        suspicionScore: 0,
        clickHistory: []
    }),
    
    registerHit: (pointsGained, message, comboCount = 0, isMilestone = false, side = 'left', isTrusted = true) => {
        set((state) => {
            if (state.isFarmBlocked) {
                return { lastPoints: 0, comboCount: 0, hitId: Date.now(), message: state.blockMessage || message };
            }

            const now = Date.now();
            let newScore = state.suspicionScore;
            
            // 1. Decay natural se demorou pra clicar (comportamento humano)
            if (newScore > 0 && state.clickHistory.length > 0) {
                const timeSinceLast = now - state.clickHistory[state.clickHistory.length - 1].time;
                if (timeSinceLast > 2000) newScore = Math.max(0, newScore - 10);
            }

            // 2. Atualiza o histórico (limite de 80)
            const newHistory = [...state.clickHistory, { time: now, side, isTrusted }];
            if (newHistory.length > 80) newHistory.shift();

            // 3. Análise Anti-Cheat (somente se tiver histórico suficiente)
            if (newHistory.length >= 20) {
                if (!isTrusted) newScore += SIGNAL_WEIGHTS.untrustedEvent;
                if (document.hidden) newScore += SIGNAL_WEIGHTS.hiddenTabClick;

                const intervals = [];
                for (let i = 1; i < newHistory.length; i++) {
                    intervals.push(newHistory[i].time - newHistory[i-1].time);
                }
                
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                if (avgInterval < 40) newScore += SIGNAL_WEIGHTS.impossibleRate;

                const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
                if (variance < 10) newScore += SIGNAL_WEIGHTS.extremelyLowVariance;
                
                newScore = Math.min(100, newScore);
            }

            // 4. Aplica Punições baseadas no Score
            if (newScore >= 85 || (!isTrusted && newScore >= 50)) {
                // Hard Punish - Usa setTimeout para evitar avisos do Zustand durante a renderização
                setTimeout(() => {
                    import('./useUISystem').then(m => m.useUISystem.getState().setFarmMode('none'));
                }, 0);
                
                return {
                    isFarmBlocked: true,
                    blockMessage: "Atividade suspeita detectada. Modo de farm desativado.",
                    message: "🚨 AUTO-CLICKER DETECTADO! 🚨",
                    comboCount: 0,
                    suspicionScore: newScore,
                    clickHistory: [],
                    hitId: Date.now() + Math.random()
                };
            }

            // Soft Punish
            let actualPoints = pointsGained;
            if (newScore >= 55 && newScore < 85) {
                actualPoints = Math.floor(pointsGained * 0.5); // Reduz os ganhos
            }

            const newAura = Math.max(0, state.aura + actualPoints);
            const newWeeklyAura = Math.max(0, state.weeklyAura + actualPoints);
            const newMaxCombo = Math.max(state.maxCombo, comboCount);

            setTimeout(() => {
                if (actualPoints > 0) {
                    useQuestSystem.getState().updateQuestProgress('gain_aura', actualPoints);
                    useQuestSystem.getState().updateQuestProgress('make_touches', 1);
                    import('./useAudioSystem').then(m => m.useAudioSystem.getState().playSFX('farm'));
                }
                if (comboCount > 0) {
                    useQuestSystem.getState().updateQuestProgress('reach_combo', comboCount);
                }
                if (comboCount > 0) useAchievementSystem.getState().updateProgress('combo', comboCount);
                if (newAura    > 0) useAchievementSystem.getState().updateProgress('aura',  newAura);
            }, 0);

            return {
                aura: newAura,
                weeklyAura: newWeeklyAura,
                lastPoints: actualPoints,
                message: message,
                comboCount: comboCount,
                maxCombo: newMaxCombo,
                hitId: Date.now() + Math.random(),
                isMilestone: isMilestone,
                hitSide: side,
                suspicionScore: newScore,
                clickHistory: newHistory
            };
        });
    }
}));
