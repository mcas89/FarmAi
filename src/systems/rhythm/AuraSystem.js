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
    lastHitTime = 0;
    useAuraSystem.getState().registerHit(0, '', 0); 
};

const resetDecayTimer = () => {
    if (decayTimer) clearTimeout(decayTimer);
    decayTimer = setTimeout(() => {
        breakCombo();
    }, 500); 
};

// Checa se o usuário tem precisão irreal (bot)
const checkRoboticPattern = (interval, currentCombo) => {
    recentIntervals.push(interval);
    if (recentIntervals.length > 30) {
        recentIntervals.shift(); // Mantém os últimos 30
    }

    if (recentIntervals.length === 30) {
        // Ordena os intervalos para remover outliers (lag do navegador)
        const sorted = [...recentIntervals].sort((a, b) => a - b);
        
        // Remove os 4 menores e os 4 maiores (descarta outliers e foca no miolo)
        const coreIntervals = sorted.slice(4, 26);
        
        const max = Math.max(...coreIntervals);
        const min = Math.min(...coreIntervals);
        const difference = max - min;
        const avg = coreIntervals.reduce((a, b) => a + b, 0) / coreIntervals.length;
        
        // Regra 1: Precisão Mecânica (Macros com Randomizer)
        // Auto-clickers com "Randomize Delay" geralmente ficam presos num range.
        // Se a variação no núcleo (excluindo lag) for < 40ms, é macro.
        if (difference < 40) {
            recentIntervals = [];
            return true; 
        }

        // Regra 2: Velocidade Irreal
        // Manter média abaixo de 85ms (quase 12 cliques/seg) por 30 hits seguidos
        if (avg < 85) {
            recentIntervals = [];
            return true;
        }
        
        // Regra 3: Resistência Infinita (Anti-Bot longo)
        // Se chegou num combo muito alto farmando rápido demais e sem muita variação
        if (currentCombo > 300 && avg < 110 && difference < 60) {
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
                
                // Se clicar rápido demais (< 65ms), barra também
                if (interval < 65) {
                    breakCombo();
                    return;
                }

                if (checkRoboticPattern(interval, comboCount)) {
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
