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
// GAMIFICAÇÃO E LIMITES
// ==========================================
let comboCount = 0;
let decayTimer = null;
let lastValidSide = null;
let lastHitTime = 0;
let comboStartTime = 0;
let timeCooldownUntil = 0;

// ==========================================
// MULTIPLICADOR DE AURA (para poções compradas)
// ==========================================

const getBonusForCombo = (comboCount) => {
    let currentMultiplier = useAuraSystem.getState().auraMultiplier;
    const endTime = useAuraSystem.getState().multiplierEndTime;

    // Checa expiração do multiplicador
    if (currentMultiplier > 1 && endTime && Date.now() > endTime) {
        useAuraSystem.getState().setMultiplier(1, null);
        currentMultiplier = 1;
    }

    const baseAura = (comboCount % 10 === 0) ? 10 : 0;
    const isMilestone = (comboCount > 0 && comboCount % 100 === 0);
    const bonusAura = isMilestone ? (comboCount * comboCount) / 1000 : 0;

    const baseAuraFinal = Math.round(baseAura * currentMultiplier);
    const bonusAuraFinal = Math.round(bonusAura * currentMultiplier);
    const auraReward = baseAuraFinal + bonusAuraFinal;

    const parts = [];
    if (baseAuraFinal > 0) parts.push(`${baseAuraFinal} aura`);
    if (bonusAuraFinal > 0) parts.push(`${bonusAuraFinal} bonus`);
    const message = parts.length > 0 ? `+${parts.join(' + ')}` : '';

    return { isMilestone, auraReward, message };
};

// DEBUG: Registra o motivo do break no console
const breakCombo = (reason = 'decay') => {
    console.warn(`[COMBO BREAK] motivo="${reason}" combo_era=${comboCount}`);
    comboCount = 0;
    lastValidSide = null;
    lastHitTime = 0;
    comboStartTime = 0;
    useAuraSystem.getState().registerHit(0, '', 0); 
};

// Decay normal = 800ms. Em milestones (múltiplos de 50) = 2000ms para absorver processamentos pesados.
const resetDecayTimer = (isMilestone = false) => {
    if (decayTimer) clearTimeout(decayTimer);
    const delay = isMilestone ? 2000 : 800;
    decayTimer = setTimeout(() => {
        breakCombo('decay_timeout');
    }, delay);
};

export const AuraSystem = {
    setRawInput: (side, isPressed) => {
        const now = Date.now();

        // Se estiver em cooldown de tempo, ignora input
        if (now < timeCooldownUntil) return;

        state[side].isPressed = isPressed;

        if (isPressed) {
            // A animação visual deve obedecer SEMPRE ao clique do usuário, 
            // mesmo que ele tenha clicado no mesmo lado e errado o combo.
            renewAnimationCycle(side); 

            // Inicia o cronômetro no primeiro hit
            if (comboCount === 0) {
                comboStartTime = now;
            }

            // CASOS INVÁLIDOS (Errou alternância)
            if (lastValidSide === side) {
                breakCombo('mesmo_lado');
                resetDecayTimer(); // Reseta o timer mesmo após break
                return;
            }



            // SUCESSO (1,2,1,2 mantido de forma orgânica)
            lastHitTime = now;
            lastValidSide = side;
            comboCount++;

            // FASE 02 e 03: Pontuação e Mensagens (usa a fórmula quadrática)
            const { isMilestone, auraReward, message } = getBonusForCombo(comboCount);

            // Reseta decay DEPOIS de computar tudo — e com delay estendido se for milestone
            resetDecayTimer(isMilestone);

            useAuraSystem.getState().registerHit(auraReward, message, comboCount, isMilestone, side);
            
            // Sincroniza a aura com o servidor multiplayer para os outros jogadores verem
            if (auraReward > 0) {
                import('../useMultiplayerSystem').then(({ useMultiplayerSystem }) => {
                    const newAura = useAuraSystem.getState().aura;
                    useMultiplayerSystem.getState().updateAuraValue(newAura);
                });
            }
        }
    }
};