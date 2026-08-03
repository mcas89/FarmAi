import { create } from 'zustand';
import { useQuestSystem } from './useQuestSystem';
import { useAchievementSystem } from './useAchievementSystem';

const CHEAT_MESSAGE = 'Cheat é proibido';

/**
 * Buffer FORA do Zustand — sobrevive a quebra de combo.
 * Só limpa após idle longo ou punição.
 */
const timingSamples = []; // { t, trusted }
let suspicionScore = 0;
let lastPunishAt = 0;

const HISTORY_MAX = 140;
const IDLE_RESET_MS = 2200;
/** Gap que só invalida a janela atual (não zera o buffer). */
const MAX_WINDOW_GAP_MS = 520;

const UNTRUSTED_NEEDED = 3;
const PUNISH_SCORE = 5;
const PUNISH_COOLDOWN_MS = 3500;

function nowMs() {
    return typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();
}

function mean(arr) {
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
}

function median(arr) {
    const a = arr.slice().sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function stdDev(arr, avg) {
    let s = 0;
    for (let i = 0; i < arr.length; i++) {
        const d = arr[i] - avg;
        s += d * d;
    }
    return Math.sqrt(s / arr.length);
}

/** Últimos `count` intervalos contínuos (sem gap grande). */
function sliceIntervals(count) {
    if (timingSamples.length < count + 1) return null;
    const start = timingSamples.length - (count + 1);
    const intervals = [];
    for (let i = start + 1; i < timingSamples.length; i++) {
        const d = timingSamples[i].t - timingSamples[i - 1].t;
        if (d <= 0 || d > MAX_WINDOW_GAP_MS) return null;
        intervals.push(d);
    }
    return intervals.length === count ? intervals : null;
}

function intervalStats(intervals) {
    const avg = mean(intervals);
    const med = median(intervals);
    const sd = stdDev(intervals, avg);
    const cv = avg > 0 ? sd / avg : 99;
    const range = Math.max(...intervals) - Math.min(...intervals);
    let near12 = 0;
    let near18 = 0;
    for (let i = 0; i < intervals.length; i++) {
        const d = Math.abs(intervals[i] - med);
        if (d <= 12) near12++;
        if (d <= 18) near18++;
    }
    return {
        avg,
        med,
        cv,
        range,
        near12Ratio: near12 / intervals.length,
        near18Ratio: near18 / intervals.length,
    };
}

function checkUntrustedStreak() {
    if (timingSamples.length < UNTRUSTED_NEEDED) return false;
    for (let i = timingSamples.length - UNTRUSTED_NEEDED; i < timingSamples.length; i++) {
        if (timingSamples[i].trusted !== false) return false;
    }
    return true;
}

/** Taxa absurda (~18+ CPS sustentado). */
function checkImpossibleRate() {
    const intervals = sliceIntervals(20);
    if (!intervals) return false;
    return mean(intervals) < 55;
}

/**
 * Sinais fortes = ban imediato.
 * Sinais médios = sobem score; humano sobe pouco / decai.
 */
function evaluateRhythm() {
    const mid = sliceIntervals(20);
    if (mid) {
        const s = intervalStats(mid);
        if (s.avg >= 40 && s.avg <= 400) {
            if (s.cv <= 0.14 && s.range <= 32) {
                return { instant: true, reason: 'metronome_mid', add: 0 };
            }
            if (s.near12Ratio >= 0.7 && s.range <= 40) {
                return { instant: true, reason: 'cluster_mid', add: 0 };
            }
            if (s.cv <= 0.18 && s.near18Ratio >= 0.65) {
                return { instant: false, reason: 'soft_mid', add: 2 };
            }
            if (s.cv <= 0.22 && s.near18Ratio >= 0.55) {
                return { instant: false, reason: 'soft_mid2', add: 1 };
            }
        }
    }

    const long = sliceIntervals(36);
    if (long) {
        const s = intervalStats(long);
        if (s.avg >= 40 && s.avg <= 400) {
            if (s.cv <= 0.16 && s.range <= 42) {
                return { instant: true, reason: 'metronome_long', add: 0 };
            }
            if (s.near18Ratio >= 0.65 && s.cv <= 0.2) {
                return { instant: true, reason: 'cluster_long', add: 0 };
            }
            if (s.cv <= 0.2) {
                return { instant: false, reason: 'soft_long', add: 2 };
            }
        }
    }

    const short = sliceIntervals(12);
    if (short) {
        const s = intervalStats(short);
        if (s.avg >= 40 && s.avg <= 400) {
            if (s.cv <= 0.1 && s.range <= 22) {
                return { instant: true, reason: 'metronome_short', add: 0 };
            }
            if (s.cv <= 0.15 && s.range <= 28) {
                return { instant: false, reason: 'soft_short', add: 2 };
            }
        }
    }

    return { instant: false, reason: null, add: -1 };
}

/**
 * @returns {{ cheated: boolean, reason: string|null }}
 */
function recordFarmHit(isTrusted) {
    const t = nowMs();

    if (timingSamples.length > 0) {
        const gap = t - timingSamples[timingSamples.length - 1].t;
        if (gap > IDLE_RESET_MS) {
            timingSamples.length = 0;
            suspicionScore = 0;
        }
    }

    timingSamples.push({ t, trusted: isTrusted !== false });
    if (timingSamples.length > HISTORY_MAX) timingSamples.shift();

    if (checkUntrustedStreak()) {
        return { cheated: true, reason: 'untrusted' };
    }
    if (checkImpossibleRate()) {
        return { cheated: true, reason: 'impossible_rate' };
    }

    const evalResult = evaluateRhythm();
    if (evalResult.instant) {
        return { cheated: true, reason: evalResult.reason };
    }

    if (evalResult.add > 0) {
        suspicionScore += evalResult.add;
    } else if (evalResult.add < 0) {
        suspicionScore = Math.max(0, suspicionScore - 1);
    }

    if (suspicionScore >= PUNISH_SCORE) {
        return { cheated: true, reason: 'suspicion_score' };
    }

    return { cheated: false, reason: null };
}

function clearAntiCheatState() {
    timingSamples.length = 0;
    suspicionScore = 0;
}

function punishCheat(reason) {
    const wall = Date.now();
    if (wall - lastPunishAt < PUNISH_COOLDOWN_MS) return;
    lastPunishAt = wall;
    clearAntiCheatState();

    console.warn(`[AntiCheat] bloqueado motivo=${reason}`);

    setTimeout(() => {
        import('./rhythm/AuraSystem').then((m) => {
            m.AuraSystem.resetCombo?.('anti_cheat');
        });
        import('./useUISystem').then((m) => {
            const ui = m.useUISystem.getState();
            ui.setFarmMode('none');
            ui.setScreen('MENU');
            ui.showAntiCheatModal({
                title: 'Que feio… auto-clique?',
                body: 'Usar auto-clique é trapaça: desequilibra a economia e tira a graça de quem farmar na mão. No FarmAi isso é proibido — joga limpo e respeita a comunidade.',
            });
        });
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
            const wallNow = Date.now();

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

            let newComboStartTime = state.comboStartTime;
            if (comboCount <= 1 || !newComboStartTime) {
                newComboStartTime = wallNow;
            } else {
                const comboDuration = wallNow - newComboStartTime;
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
                suspicionScore,
                clickHistory: [],
                isFarmBlocked: false,
                blockMessage: null,
            };
        });
    }
}));
