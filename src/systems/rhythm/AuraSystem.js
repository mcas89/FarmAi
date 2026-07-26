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

const breakCombo = () => {
    comboCount = 0;
    lastValidSide = null;
    lastHitTime = 0;
    comboStartTime = 0;
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

        // Se estiver em cooldown de tempo, ignora input
        if (now < timeCooldownUntil) return;

        state[side].isPressed = isPressed;

        if (isPressed) {
            resetDecayTimer();
            renewAnimationCycle(side); 

            // Inicia o cronômetro no primeiro hit
            if (comboCount === 0) {
                comboStartTime = now;
            }

            // CASOS INVÁLIDOS (Errou alternância)
            if (lastValidSide === side) {
                breakCombo(); 
                return;
            }

            // LIMITE DE TEMPO: 20 minutos (1.200.000 ms)
            if (comboStartTime > 0 && (now - comboStartTime) > 1200000) {
                breakCombo();
                timeCooldownUntil = now + 5000; // Bloqueia por 5 segundos para quebrar o ritmo
                useAuraSystem.getState().registerHit(0, 'Fadigado! Você farmou por 20 minutos direto, descanse!', 0);
                
                // Salva o estado e força a saída para o menu principal
                Promise.all([
                    import('../usePlayerSystem'),
                    import('../useDatabaseSystem'),
                    import('../useQuestSystem'),
                    import('../useAchievementSystem'),
                    import('../useUISystem'),
                    import('../useMultiplayerSystem')
                ]).then(([pSys, dbSys, qSys, achSys, uiSys, mpSys]) => {
                    const pos = pSys.usePlayerSystem.getState().position;
                    const model = pSys.usePlayerSystem.getState().activeModel;
                    const { comboCount, maxCombo, aura, weeklyAura } = useAuraSystem.getState();
                    const diamonds = uiSys.useUISystem.getState().playerStats.diamonds || 0;
                    const { dailyQuests, lastResetDate } = qSys.useQuestSystem.getState();
                    const achievements = achSys.useAchievementSystem.getState().getSavableData();

                    dbSys.useDatabaseSystem.getState().saveGameState(
                        pos, comboCount, model, aura, diamonds, maxCombo, dailyQuests, lastResetDate, weeklyAura, undefined, achievements
                    ).then(() => {
                        mpSys.useMultiplayerSystem.getState().leaveRoom();
                        uiSys.useUISystem.getState().setScreen('MENU');
                    });
                });

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
