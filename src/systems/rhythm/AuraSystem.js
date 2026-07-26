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
// GAMIFICAÇÃO
// ==========================================
let comboCount = 0;
let decayTimer = null;
let lastValidSide = null;
let lastHitTime = 0;

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

export const AuraSystem = {
    setRawInput: (side, isPressed) => {
        const now = Date.now();

        state[side].isPressed = isPressed;

        if (isPressed) {
            resetDecayTimer();
            renewAnimationCycle(side); 

            // CASOS INVÁLIDOS (Errou alternância)
            if (lastValidSide === side) {
                breakCombo(); 
                return;
            }

            // ANTI-CHEAT: Apenas bloqueio básico de macro absurdo (< 40ms)
            if (lastHitTime > 0) {
                const interval = now - lastHitTime;
                if (interval < 40) {
                    breakCombo();
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
