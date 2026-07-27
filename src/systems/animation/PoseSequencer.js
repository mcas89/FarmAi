/**
 * PoseSequencer
 * Observa o comboCount do AuraSystem e troca a BasePose do AnimationEngine
 * progressivamente conforme o jogador mantém o ritmo.
 *
 * Cada etapa define:
 *  - minCombo : combo mínimo para ativar
 *  - pose     : nome da pose no PoseRegistry
 *  - label    : descrição (para debug)
 */

import { AnimationEngine } from './AnimationEngine';
import { useAuraSystem } from '../useAuraSystem';

// =========================================================
// TABELA DE PROGRESSÃO DAS POSES
// Ordem crescente de combo obrigatória
// =========================================================
const PROGRESSION = [
    { minCombo: 0,    pose: 'arms_down_pose',          label: 'Repouso' },
    { minCombo: 15,   pose: 'six_seven_left_down',      label: 'Braço esq. baixo' },
    { minCombo: 30,   pose: 'six_seven_right_down',     label: 'Braço dir. baixo' },
    { minCombo: 50,   pose: 'reaction_head_left',       label: 'Reação de cabeça' },
    { minCombo: 80,   pose: 'stretch_spine',            label: 'Esticar coluna' },
    { minCombo: 120,  pose: 'tired_pose',               label: 'Cansaço leve' },
    { minCombo: 170,  pose: 'weight_left',              label: 'Peso na esq.' },
    { minCombo: 220,  pose: 'weight_right',             label: 'Peso na dir.' },
    { minCombo: 280,  pose: 'leg_lift_left',            label: 'Levanta perna esq.' },
    { minCombo: 340,  pose: 'leg_lift_right',           label: 'Levanta perna dir.' },
    { minCombo: 400,  pose: 'twist_left',               label: 'Giro de cintura esq.' },
    { minCombo: 460,  pose: 'twist_right',              label: 'Giro de cintura dir.' },
    { minCombo: 530,  pose: 'squat_light',              label: 'Agachamento leve' },
    { minCombo: 620,  pose: 'fight_squat_extreme',      label: 'Agachamento extremo' },
    { minCombo: 720,  pose: 'recovery_pose',            label: 'Recuperação' },
    { minCombo: 850,  pose: 'full_stretch_pose',        label: 'Esticamento total' },
    { minCombo: 1000, pose: 'ascension_pose',           label: 'Ascensão' },
    { minCombo: 1200, pose: 'float_final_pose',         label: 'Flutuação final' },
];

// =========================================================
// ESTADO INTERNO
// =========================================================
let lastAppliedPoseIndex = -1;
let lastCombo = 0;
let unsubscribe = null;

// =========================================================
// LÓGICA PRINCIPAL
// =========================================================

/**
 * Retorna o índice correto da PROGRESSION para um dado combo.
 */
function getPoseIndexForCombo(combo) {
    let idx = 0;
    for (let i = 0; i < PROGRESSION.length; i++) {
        if (combo >= PROGRESSION[i].minCombo) {
            idx = i;
        }
    }
    return idx;
}

/**
 * Verifica se o combo mudou, calcula a pose correta
 * e chama AnimationEngine.setBasePose quando necessário.
 *
 * @param {number} combo  - comboCount atual do AuraSystem
 * @param {string} [uuid] - uuid do modelo VRM (opcional)
 */
function tick(combo, uuid = 'default') {
    // Quando o combo zera (reset), volta para a pose inicial
    if (combo === 0 && lastAppliedPoseIndex !== 0) {
        lastAppliedPoseIndex = 0;
        lastCombo = 0;
        AnimationEngine.setBasePose(PROGRESSION[0].pose, uuid);
        return;
    }

    // Combo não mudou — não faz nada
    if (combo === lastCombo) return;
    lastCombo = combo;

    const idx = getPoseIndexForCombo(combo);

    // Só troca quando a etapa de fato avança (nunca regride enquanto combo sobe)
    if (idx !== lastAppliedPoseIndex) {
        lastAppliedPoseIndex = idx;
        const entry = PROGRESSION[idx];
        AnimationEngine.setBasePose(entry.pose, uuid);
        console.log(`[PoseSequencer] Combo ${combo} → Pose "${entry.pose}" (${entry.label})`);
    }
}

// =========================================================
// API PÚBLICA
// =========================================================
export const PoseSequencer = {
    /**
     * Inicia o sequenciador.
     * Deve ser chamado uma vez quando o componente do jogo monta.
     * @param {string} [uuid] - uuid do modelo VRM
     */
    start(uuid = 'default') {
        if (unsubscribe) return; // Já está rodando

        // Aplica imediatamente a pose correta para o estado atual
        const currentCombo = useAuraSystem.getState().comboCount;
        tick(currentCombo, uuid);

        // Zustand v5: subscribe sem seletor — compara manualmente
        let prevCombo = currentCombo;
        unsubscribe = useAuraSystem.subscribe((state) => {
            const combo = state.comboCount;
            if (combo !== prevCombo) {
                prevCombo = combo;
                tick(combo, uuid);
            }
        });
    },

    /**
     * Para o sequenciador e libera a assinatura.
     * Deve ser chamado quando o componente do jogo desmonta.
     */
    stop() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
        lastAppliedPoseIndex = -1;
        lastCombo = 0;
    },

    /**
     * Retorna a tabela de progressão (útil para debug/UI).
     */
    getProgression() {
        return PROGRESSION;
    }
};
