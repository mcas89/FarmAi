/**
 * DanceSystem
 * Sistema isolado e autossuficiente para o Passinho do Jamal.
 * 
 * - Define suas próprias poses internamente (injeta no PoseRegistry em runtime)
 * - Gerencia o estado da dança (isDancing, passo atual)
 * - Expõe um mini store Zustand para a UI reagir
 * - Expõe DanceSystem.register(uuid) para o Avatar registrar seu UUID
 * - Expõe DanceSystem.advanceDance() para o botão chamar a cada clique
 */

import { create } from 'zustand';
import { AnimationEngine } from './AnimationEngine';
import { Poses } from './PoseRegistry';

// =============================================
// POSES DO PASSINHO DO JAMAL
// Injetadas diretamente no PoseRegistry em runtime
// =============================================
// NOTA: cada pose declara TODOS os ossos usados na dança (com 0 onde não há
// rotação). Isso é proposital: se uma pose omitisse um osso que a pose
// anterior alterou (ex: rightShoulder, hips, leftLowerLeg), o AnimationEngine
// não teria como saber que precisa resetá-lo, e a rotação "vazaria" para a
// pose seguinte — foi isso que causava a dança desalinhada.

Poses.jamal_base = {
    leftUpperArm: { x: 0, y: 0, z: -1.29 },
    rightUpperArm: { x: 0, y: 0, z: 1.32 },
    rightLowerArm: { x: 0, y: 0.35, z: 0 },
    rightHand: { x: 0, y: 0, z: 0.21 },
    leftShoulder: { x: 0, y: 0, z: 0 },
    leftLowerArm: { x: 0, y: -0.18, z: 0 },
    leftHand: { x: -0.01, y: -0.36, z: -0.27 },
    leftLowerLeg: { x: 0, y: 0, z: 0 },
    rightLowerLeg: { x: 0.84, y: 0, z: 0 },
    rightFoot: { x: 0.44, y: 0, z: 0.04 },
    hips: { x: 0, y: 0, z: 0 },
    spine: { x: 0, y: 0, z: 0 },
    rightUpperLeg: { x: 0.21, y: 0, z: 0 },
    leftUpperLeg: { x: -0.23, y: 0, z: 0 },
    leftFoot: { x: 0.04, y: -0.1, z: -0.1 },
    rightShoulder: { x: 0, y: 0, z: 0 }
};

Poses.jamal_pos1 = {
    leftUpperArm: { x: -0.27, y: 0, z: -1.2 },
    rightUpperArm: { x: 0, y: 0, z: 1.32 },
    rightLowerArm: { x: 0, y: 0.35, z: 0 },
    rightHand: { x: 0, y: 0, z: 0.21 },
    leftShoulder: { x: -0.36, y: 0, z: 0 },
    leftLowerArm: { x: 0.61, y: -2.13, z: -0.01 },
    leftHand: { x: 0.08, y: 0, z: -0.41 },
    leftLowerLeg: { x: 1.81, y: 0, z: 0 },
    rightLowerLeg: { x: 0.84, y: 0, z: 0 },
    rightFoot: { x: 0, y: -0.45, z: 0 },
    hips: { x: 0, y: 0, z: 0 },
    spine: { x: 0.08, y: -0.18, z: 0 },
    rightUpperLeg: { x: 0.21, y: 0, z: 0 },
    leftUpperLeg: { x: -1.47, y: 0, z: 0 },
    leftFoot: { x: 0.57, y: 0, z: 0.04 },
    rightShoulder: { x: 0, y: 0, z: 0 }
};

Poses.jamal_pos2 = {
    leftUpperArm: { x: 0.84, y: 0.88, z: -1.2 },
    rightUpperArm: { x: -0.41, y: -0.01, z: 1.32 },
    rightLowerArm: { x: 0, y: 2.39, z: 0 },
    rightHand: { x: 0, y: 0, z: 0.21 },
    leftShoulder: { x: 0.17, y: 0, z: 0 },
    leftLowerArm: { x: 0.61, y: -2.13, z: -0.01 },
    leftHand: { x: 0.08, y: 0, z: -0.41 },
    leftLowerLeg: { x: 0, y: 0, z: 0 },
    rightLowerLeg: { x: 1.9, y: 0.35, z: 0.17 },
    rightFoot: { x: 0.7, y: 0, z: 0 },
    hips: { x: 0, y: 0, z: 0 },
    spine: { x: 0.08, y: 0.39, z: 0 },
    rightUpperLeg: { x: -1.82, y: 0.17, z: -0.14 },
    leftUpperLeg: { x: 0, y: -0.27, z: 0.08 },
    leftFoot: { x: 0, y: 0, z: 0 },
    rightShoulder: { x: 0, y: 0.26, z: 0 }
};

// =============================================
// SEQUÊNCIA DO PASSINHO
// =============================================
const SEQUENCE = ['jamal_base', 'jamal_pos1', 'jamal_base', 'jamal_pos2'];

// =============================================
// ESTADO INTERNO (privado ao módulo)
// =============================================
let avatarUuid = 'default';
let danceStep = 0;
let idleTimer = null;

// =============================================
// MINI STORE ZUSTAND — Apenas para a UI reagir
// =============================================
export const useDanceSystem = create((set) => ({
    isDancing: false,
    _setDancing: (v) => set({ isDancing: v }),
}));

// =============================================
// API PÚBLICA DO DANCE SYSTEM
// =============================================
export const DanceSystem = {

    /**
     * Chamado pelo Avatar.jsx após carregar o VRM,
     * para registrar o UUID correto do personagem.
     */
    register: (uuid) => {
        avatarUuid = uuid;
    },

    /**
     * Liga/desliga a dança automática (toggle).
     */
    toggleDance: () => {
        const state = useDanceSystem.getState();
        if (state.isDancing) {
            DanceSystem.stop();
        } else {
            state._setDancing(true);
            DanceSystem._loop();
        }
    },

    /**
     * Loop interno da dança
     */
    _loop: () => {
        const state = useDanceSystem.getState();
        if (!state.isDancing) return;

        danceStep = (danceStep + 1) % SEQUENCE.length;
        const pose = SEQUENCE[danceStep];

        AnimationEngine.setBasePose(pose, avatarUuid);

        // Chama o próximo frame em 400ms
        idleTimer = setTimeout(() => {
            DanceSystem._loop();
        }, 400);
    },

    /**
     * Para a dança imediatamente.
     */
    stop: () => {
        if (idleTimer) clearTimeout(idleTimer);
        danceStep = 0;
        AnimationEngine.setBasePose('arms_down_pose', avatarUuid);
        useDanceSystem.getState()._setDancing(false);
    },
};
