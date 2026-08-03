import { create } from 'zustand';
import { useQuestSystem } from './useQuestSystem';
import { useAchievementSystem } from './useAchievementSystem';

/** Janela mínima de intervalos contínuos pra julgar ritmo de metrônomo. */
const METRONOME_WINDOW = 48;
/** Variância (ms²) abaixo disso + range apertado = tipicamente auto-clicker. */
const METRONOME_VARIANCE_MAX = 6;
/** Diferença max−min (ms) entre intervalos na janela. */
const METRONOME_RANGE_MAX = 5;
/** Gap maior que isso quebra a janela (humano pausou / lag). */
const CONTINUOUS_GAP_MS = 450;
/** Média &lt; isso em janela longa = fisicamente suspeito. */
const IMPOSSIBLE_AVG_MS = 32;
const IMPOSSIBLE_WINDOW = 40;
/** Eventos sintéticos seguidos. */
const UNTRUSTED_STREAK = 4;

const CHEAT_MESSAGE = 'Cheat é proibido';

function getIntervals(history, count) {
    const slice = history.slice(-(count + 1));
    if (slice.length < count + 1) return null;
    const intervals = [];
    for (let i = 1; i < slice.length; i++) {
        intervals.push(slice[i].time - slice[i - 1].time);
    }
    return intervals;
}

function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function varianceOf(arr, avg) {
    return arr.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / arr.length;
}

/**
 * Auto-clickers mantêm intervalo quase fixo.
 * Humanos, mesmo ritmados, oscilam o tempo entre toques.
 */
function isMetronomePattern(history) {
    const intervals = getIntervals(history, METRONOME_WINDOW);
    if (!intervals) return false;
    if (intervals.some((d) => d > CONTINUOUS_GAP_MS || d <= 0)) return false;

    const avg = mean(intervals);
    const variance = varianceOf(intervals, avg);
    const range = Math.max(...intervals) - Math.min(...intervals);

    return variance <= METRONOME_VARIANCE_MAX && range <= METRONOME_RANGE_MAX;
}

function isImpossibleRate(history) {
    const intervals = getIntervals(history, IMPOSSIBLE_WINDOW);
    if (!intervals) return false;
    if (intervals.some((d) => d > CONTINUOUS_GAP_MS || d <= 0)) return false;
    return mean(intervals) < IMPOSSIBLE_AVG_MS;
}

function isUntrustedStreak(history) {
    if (history.length < UNTRUSTED_STREAK) return false;
    return history.slice(-UNTRUSTED_STREAK).every((h) => h.isTrusted === false);
}

function punishCheat() {
    setTimeout(() => {
        import('./rhythm/AuraSystem').then((m) => {
            m.AuraSystem.resetCombo?.('anti_cheat');
        });
        import('./useUISystem').then((m) => {
            m.useUISystem.getState().setFarmMode('none');
            m.useUISystem.getState().setScreen('MENU');
        });
        alert(CHEAT_MESSAGE);
    }, 0);
}

export const useAuraSystem = create((set, get) => ({
    aura: 0,
    weeklyAura: 0,
    message: '',
    lastPoints: 0,
    comboCount: 0,
    maxCombo: 0,
    comboStartTime: null,
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
        isFarmBlocked: false,
        blockMessage: null,
        comboCount: 0,
        message: msg || CHEAT_MESSAGE,
        clickHistory: [],
        suspicionScore: 0,
    }),

    unblockFarmMode: () => set({
        isFarmBlocked: false,
        blockMessage: null,
        suspicionScore: 0,
        clickHistory: []
    }),

    registerHit: (pointsGained, message, comboCount = 0, isMilestone = false, side = 'left', isTrusted = true) => {
        set((state) => {
            const now = Date.now();

            // Combo quebrado / reset — não conta como toque pra anti-cheat
            if (comboCount <= 0) {
                return {
                    lastPoints: 0,
                    comboCount: 0,
                    comboStartTime: null,
                    hitId: Date.now(),
                    message: message || '',
                    clickHistory: [],
                    suspicionScore: 0,
                };
            }

            // Fadiga: sessão contínua absurda (anti-macro AFK), msg própria
            let newComboStartTime = state.comboStartTime;
            if (comboCount <= 1 || !newComboStartTime) {
                newComboStartTime = now;
            } else {
                const comboDuration = now - newComboStartTime;
                if (comboDuration >= 45 * 60 * 1000) {
                    setTimeout(() => {
                        import('./rhythm/AuraSystem').then((m) => {
                            m.AuraSystem.resetCombo?.('fatigue');
                        });
                        import('./useUISystem').then((m) => {
                            m.useUISystem.getState().setFarmMode('none');
                            m.useUISystem.getState().setScreen('MENU');
                        });
                        alert('Sessão longa demais. Volte ao menu e continue depois.');
                    }, 0);

                    return {
                        comboCount: 0,
                        comboStartTime: null,
                        message: 'Sessão longa demais',
                        lastPoints: 0,
                        clickHistory: [],
                        suspicionScore: 0,
                        hitId: Date.now(),
                    };
                }
            }

            const newHistory = [...state.clickHistory, { time: now, side, isTrusted: !!isTrusted }];
            if (newHistory.length > 90) newHistory.shift();

            const cheated =
                isUntrustedStreak(newHistory) ||
                isMetronomePattern(newHistory) ||
                isImpossibleRate(newHistory);

            if (cheated) {
                punishCheat();
                return {
                    isFarmBlocked: false,
                    blockMessage: null,
                    message: CHEAT_MESSAGE,
                    comboCount: 0,
                    comboStartTime: null,
                    suspicionScore: 0,
                    clickHistory: [],
                    lastPoints: 0,
                    hitId: Date.now() + Math.random(),
                };
            }

            const actualPoints = pointsGained;
            const newAura = Math.max(0, state.aura + actualPoints);
            const newWeeklyAura = Math.max(0, state.weeklyAura + actualPoints);
            const newMaxCombo = Math.max(state.maxCombo, comboCount);

            setTimeout(() => {
                if (actualPoints > 0) {
                    useQuestSystem.getState().updateQuestProgress('gain_aura', actualPoints);
                    useQuestSystem.getState().updateQuestProgress('make_touches', 1);
                    import('./useAudioSystem').then((m) => {
                        if (comboCount === 101) {
                            m.useAudioSystem.getState().playSFX('powerStart');
                            m.useAudioSystem.getState().playSFX('power');
                        } else if (comboCount > 101) {
                            m.useAudioSystem.getState().playSFX('power');
                        } else {
                            m.useAudioSystem.getState().playSFX('farm');
                        }
                    });
                }
                if (comboCount > 0) {
                    useQuestSystem.getState().updateQuestProgress('reach_combo', comboCount);
                }
                if (comboCount > 0) useAchievementSystem.getState().updateProgress('combo', comboCount);
                if (newAura > 0) useAchievementSystem.getState().updateProgress('aura', newAura);
            }, 0);

            return {
                aura: newAura,
                weeklyAura: newWeeklyAura,
                lastPoints: actualPoints,
                message: message,
                comboCount: comboCount,
                comboStartTime: newComboStartTime,
                maxCombo: newMaxCombo,
                hitId: Date.now() + Math.random(),
                isMilestone: isMilestone,
                hitSide: side,
                suspicionScore: 0,
                clickHistory: newHistory,
                isFarmBlocked: false,
                blockMessage: null,
            };
        });
    }
}));
