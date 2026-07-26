import { useAuraSystem } from '../useAuraSystem';
import { useFarmSystem } from '../useFarmSystem';

// ==========================================
// NÚCLEO DE ANIMAÇÃO (INTOCÁVEL)
// ==========================================
const CYCLE_TIME = 800; // Mantém o movimento fluido do Six Seven

const state = {
    left: { isPressed: false, timer: null },
    right: { isPressed: false, timer: null }
};

const renewAnimationCycle = (side) => {
    if (side === 'left') useFarmSystem.getState().setLeftFarming(true);
    if (side === 'right') useFarmSystem.getState().setRightFarming(true);

    if (state[side].timer) clearTimeout(state[side].timer);

    state[side].timer = setTimeout(() => {
        if (side === 'left') useFarmSystem.getState().setLeftFarming(false);
        if (side === 'right') useFarmSystem.getState().setRightFarming(false);
    }, CYCLE_TIME);
};


// ==========================================
// GAMIFICAÇÃO E ANTI-CHEAT (AUTO-CLICK DETECTOR)
// ==========================================
let comboCount = 0;
let decayTimer = null;
let lastValidSide = null;
let lastHitTime = 0;
let recentIntervals = [];
let botCooldownUntil = 0;

const breakCombo = () => {
    comboCount = 0;
    lastValidSide = null;
    useAuraSystem.getState().registerHit(0, '', 0); 
};

const resetDecayTimer = () => {
    if (decayTimer) clearTimeout(decayTimer);
    decayTimer = setTimeout(() => {
        breakCombo();
    }, 500); 
};

// Checa se o usuário tem precisão irreal (bot)
const checkRoboticPattern = (interval) => {
    recentIntervals.push(interval);
    if (recentIntervals.length > 20) {
        recentIntervals.shift(); // Mantém apenas os últimos 20
    }

    if (recentIntervals.length === 20) {
        const max = Math.max(...recentIntervals);
        const min = Math.min(...recentIntervals);
        const difference = max - min;
        
        // Se a diferença entre a batida mais lenta e a mais rápida for menor que 15ms
        // Em 20 cliques seguidos, é humanamente impossível. É um bot de Auto-Click.
        if (difference < 15) {
            recentIntervals = [];
            return true; 
        }
    }
    return false;
};

export const AuraSystem = {
    setRawInput: (side, isPressed) => {
        const now = Date.now();
        
        // Bloqueio de penalidade ativo
        if (now < botCooldownUntil) return;

        state[side].isPressed = isPressed;

        if (isPressed) {
            resetDecayTimer();
            renewAnimationCycle(side); 

            // CASOS INVÁLIDOS (Errou alternância)
            if (lastValidSide === side) {
                breakCombo(); 
                return;
            }

            // ANTI-CHEAT: Checagem de intervalo
            if (lastHitTime > 0) {
                const interval = now - lastHitTime;
                
                // Se clicar rápido demais (< 60ms), barra também
                if (interval < 60) {
                    breakCombo();
                    return;
                }

                if (checkRoboticPattern(interval)) {
                    // Punição: Zera combo, mostra msg e dá cooldown de 10 segundos
                    breakCombo();
                    botCooldownUntil = now + 10000;
                    useAuraSystem.getState().registerHit(0, 'Que feio! Parece que está usando auto click... Descanse e use seus polegares! 🤖', 0);
                    return;
                }
            }

            // SUCESSO (1,2,1,2 mantido de forma orgânica)
            lastHitTime = now;
            lastValidSide = side;
            comboCount++;

            // FASE 02 e 03: Pontuação e Mensagens
            let auraReward = 0;
            let message = '';

            if (comboCount > 0 && comboCount % 50 === 0) {
                const comboMilestone = comboCount;
                const bonusMultiplier = comboCount / 50;
                auraReward = comboMilestone + (bonusMultiplier * 10);
                message = `+${comboMilestone} de aura`; 
            } else if (comboCount > 0 && comboCount % 15 === 0) {
                auraReward = 10;
                message = ' '; // Renderiza apenas o +10
            }

            useAuraSystem.getState().registerHit(auraReward, message, comboCount);
        }
    }
};
