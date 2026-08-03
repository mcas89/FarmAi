import { create } from 'zustand';
import { useQuestSystem } from './useQuestSystem';
import { useAchievementSystem } from './useAchievementSystem';

const CHEAT_MESSAGE = 'Cheat é proibido';

/**
 * Buffer FORA do Zustand — não zera quando o combo quebra.
 * Só limpa após idle longo ou punição.
 */
const timingSamples = []; // { t, trusted }
let metronomeStrikes = 0;
let lastPunishAt = 0;

const HISTORY_MAX = 100;
/** Pausa longa = humano parou; reinicia análise. */
const IDLE_RESET_MS = 1800;
/** Gap dentro da janela que invalida o trecho contínuo. */
const MAX_GAP_MS = 420;

/** Auto-clicker típico: CV baixo + range apertado (ainda tolera jitter do SO). */
const STRONG_WINDOW = 28;
const STRONG_CV_MAX = 0.08;
const STRONG_RANGE_MAX = 20;

/** Janela curta ainda mais “metrônomo”. */
const TIGHT_WINDOW = 18;
const TIGHT_CV_MAX = 0.055;
const TIGHT_RANGE_MAX = 14;

/** Taxa absurda sustentada (~22+ CPS). */
const FAST_WINDOW = 24;
const FAST_AVG_MS = 45;

/** Eventos JS sintéticos seguidos. */
const UNTRUSTED_NEEDED = 3;

/** Quantos “strikes” de ritmo robótico antes de punir (evita 1 falso positivo). */
const STRIKES_TO_PUNISH = 2;
/** Cooldown pra não spammar alert ao voltar. */
const PUNISH_COOLDOWN_MS = 4000;

function mean(arr) {
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
}

function stdDev(arr, avg) {
    let s = 0;
    for (let i = 0; i < arr.length; i++) {
        const d = arr[i] - avg;
        s += d * d;
    }
    return Math.sqrt(s / arr.length);
}

function sliceIntervals(count) {
    if (timingSamples.length < count + 1) return null;
    const start = timingSamples.length - (count + 1);
    const intervals = [];
    for (let i = start + 1; i < timingSamples.length; i++) {
        const d = timingSamples[i].t - timingSamples[i - 1].t;
        if (d <= 0 || d > MAX_GAP_MS) return null;
        intervals.push(d);
    }
    return intervals.length === count ? intervals : null;
}

function isRobotic(intervals, cvMax, rangeMax) {
    const avg = mean(intervals);
    // Fora da faixa de farm normal — não julga
    if (avg < 35 || avg > 380) return false;
    const sd = stdDev(intervals, avg);
    const cv = sd / avg;
    const range = Math.max(...intervals) - Math.min(...intervals);
    return cv <= cvMax && range <= rangeMax;
}

function checkUntrustedStreak() {
    if (timingSamples.length < UNTRUSTED_NEEDED) return false;
    for (let i = timingSamples.length - UNTRUSTED_NEEDED; i < timingSamples.length; i++) {
        if (timingSamples[i].trusted !== false) return false;
    }
    return true;
}

function checkImpossibleRate() {
    const intervals = sliceIntervals(FAST_WINDOW);
    if (!intervals) return false;
    return mean(intervals) < FAST_AVG_MS;
}

/**
 * Registra um hit válido e decide se é cheat.
 * @returns {{ cheated: boolean, reason: string|null }}
 */
function recordFarmHit(isTrusted) {
    const now = Date.now();

    if (timingSamples.length > 0) {
        const gap = now - timingSamples[timingSamples.length - 1].t;
        if (gap > IDLE_RESET_MS) {
            timingSamples.length = 0;
            metronomeStrikes = 0;
        }
    }

    timingSamples.push({ t: now, trusted: isTrusted !== false });
    if (timingSamples.length > HISTORY_MAX) timingSamples.shift();

    if (checkUntrustedStreak()) {
        return { cheated: true, reason: 'untrusted' };
    }
    if (checkImpossibleRate()) {
        return { cheated: true, reason: 'impossible_rate' };
    }

    const strong = sliceIntervals(STRONG_WINDOW);
    const tight = sliceIntervals(TIGHT_WINDOW);
    let roboticNow = false;

    if (strong && isRobotic(strong, STRONG_CV_MAX, STRONG_RANGE_MAX)) {
        roboticNow = true;
    } else if (tight && isRobotic(tight, TIGHT_CV_MAX, TIGHT_RANGE_MAX)) {
        roboticNow = true;
    }

    if (roboticNow) {
        metronomeStrikes += 1;
        // Exige 2 janelas robóticas próximas (hits consecutivos “suspeitos”)
        // pra reduzir falso positivo de 1 trecho sortudo.
        if (metronomeStrikes >= STRIKES_TO_PUNISH) {
            return { cheated: true, reason: 'metronome' };
        }
    } else {
        // Decai strikes aos poucos se voltou a oscilar (humano)
        metronomeStrikes = Math.max(0, metronomeStrikes - 1);
    }

    return { cheated: false, reason: null };
}

function clearAntiCheatState() {
    timingSamples.length = 0;
    metronomeStrikes = 0;
}

function punishCheat(reason) {
    const now = Date.now();
    if (now - lastPunishAt < PUNISH_COOLDOWN_MS) return;
    lastPunishAt = now;
    clearAntiCheatState();

    console.warn(`[AntiCheat] bloqueado motivo=${reason}`);

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

            // Combo quebrado — NÃO apaga o buffer de timing do anti-cheat
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

            // Fadiga: sessão contínua absurda
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

                    clearAntiCheatState();
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

            const { cheated, reason } = recordFarmHit(isTrusted);
            if (cheated) {
                punishCheat(reason);
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
                suspicionScore: metronomeStrikes,
                clickHistory: [],
                isFarmBlocked: false,
                blockMessage: null,
            };
        });
    }
}));
