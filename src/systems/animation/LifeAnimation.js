/**
 * LifeAnimation
 *
 * Camadas:
 * 1. Vida normal do personagem
 * 2. Progressão corporal enquanto farma
 *
 * IMPORTANTE:
 * - Não controla a animação Six Seven dos braços.
 * - Não altera as poses do PoseRegistry.
 * - Gera apenas offsets adicionais.
 */

const TIMERS = {
    breath: 0,
    head: 0,
    neck: 0,
    hips: 0,
    lShoulder: 0,
    rShoulder: 0,
    bodyProgression: 0
};

const FREQUENCIES = {
    breath: (Math.PI * 2) / 3.7,
    head: (Math.PI * 2) / 6.2,
    neck: (Math.PI * 2) / 8.0,
    hips: (Math.PI * 2) / 7.0,
    lShoulder: (Math.PI * 2) / 9.0,
    rShoulder: (Math.PI * 2) / 12.0
};

// ============================================================
// PROGRESSÃO CORPORAL
// ============================================================
//
// O tempo é contado enquanto qualquer lado está farmando.
//
// 0 - 5s   : normal
// 5 - 10s  : primeira reação
// 10 - 20s : alongamento
// 20 - 35s : cansaço leve
// 35 - 50s : esforço corporal
// 50s+     : sobrecarga
//
// Nesta primeira versão NÃO existe ainda flutuação.
// Primeiro vamos testar a base corporal.
// ============================================================

const PROGRESSION = {
    AWARENESS_START: 5,
    STRETCH_START: 10,
    FATIGUE_START: 20,
    EFFORT_START: 35,
    OVERLOAD_START: 50
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const smoothStep = (value) => {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
};

const getPhaseProgress = (time, start, duration) => {
    return smoothStep((time - start) / duration);
};

export const LifeAnimation = {

    getOffsets: (
        delta,
        brainBreathMultiplier = 1.0,
        isFarming = false
    ) => {

        // ----------------------------------------------------
        // TEMPO NORMAL DA VIDA
        // ----------------------------------------------------

        Object.keys(TIMERS).forEach((key) => {

            const noise = Math.sin(delta * 0.1) * 0.05;

            TIMERS[key] += delta * (
                FREQUENCIES[key] !== undefined
                    ? FREQUENCIES[key] + noise
                    : 1
            );
        });

        // ----------------------------------------------------
        // TEMPO DE FARM
        // ----------------------------------------------------

        if (isFarming) {
            TIMERS.bodyProgression += delta;
        } else {
            // Retorno gradual da progressão quando para de farmar.
            //
            // Não zeramos instantaneamente para evitar
            // uma pose quebrando de repente.
            TIMERS.bodyProgression = Math.max(
                0,
                TIMERS.bodyProgression - delta * 3
            );
        }

        const farmTime = TIMERS.bodyProgression;

        // ----------------------------------------------------
        // RESPIRAÇÃO
        // ----------------------------------------------------

        const breathAmp = 0.015 * brainBreathMultiplier;

        const breath =
            Math.sin(TIMERS.breath) * breathAmp;

        // ----------------------------------------------------
        // VIDA NORMAL
        // ----------------------------------------------------

        const headMotion =
            Math.sin(TIMERS.head) * 0.05;

        const neckMotion =
            Math.cos(TIMERS.neck) * 0.04;

        const lShoulderMotion =
            Math.sin(TIMERS.lShoulder) * 0.03;

        const rShoulderMotion =
            Math.cos(TIMERS.rShoulder) * 0.03;

        const hipsMotion =
            Math.sin(TIMERS.hips) * 0.02;

        // ----------------------------------------------------
        // PROGRESSÃO CORPORAL
        // ----------------------------------------------------

        let progression = {

            chest: {
                x: 0,
                y: 0,
                z: 0
            },

            head: {
                x: 0,
                y: 0,
                z: 0
            },

            neck: {
                x: 0,
                y: 0,
                z: 0
            },

            hips: {
                x: 0,
                y: 0,
                z: 0
            },

            leftUpperLeg: {
                x: 0,
                y: 0,
                z: 0
            },

            rightUpperLeg: {
                x: 0,
                y: 0,
                z: 0
            },

            leftLowerLeg: {
                x: 0,
                y: 0,
                z: 0
            },

            rightLowerLeg: {
                x: 0,
                y: 0,
                z: 0
            }
        };

        // ====================================================
        // FASE 1 — PRIMEIRA REAÇÃO
        // 5s até 10s
        // ====================================================

        const awareness =
            getPhaseProgress(
                farmTime,
                PROGRESSION.AWARENESS_START,
                5
            );

        if (awareness > 0) {

            const reaction =
                Math.sin(TIMERS.head * 0.7) *
                0.025 *
                awareness;

            progression.head.y += reaction;
            progression.neck.y += reaction * 0.35;
        }

        // ====================================================
        // FASE 2 — ALONGAMENTO
        // 10s até 20s
        // ====================================================

        const stretch =
            getPhaseProgress(
                farmTime,
                PROGRESSION.STRETCH_START,
                10
            );

        if (stretch > 0) {

            // Peito começa a abrir
            progression.chest.x -=
                0.035 * stretch;

            // Quadril acompanha discretamente
            progression.hips.x +=
                0.012 * stretch;
        }

        // ====================================================
        // FASE 3 — CANSAÇO
        // 20s até 35s
        // ====================================================

        const fatigue =
            getPhaseProgress(
                farmTime,
                PROGRESSION.FATIGUE_START,
                15
            );

        if (fatigue > 0) {

            // Peito começa a perder a postura
            progression.chest.x +=
                0.04 * fatigue;

            // Cabeça começa a acompanhar o cansaço
            progression.head.x +=
                0.018 * fatigue;

            // Quadril ganha uma pequena oscilação
            progression.hips.x +=
                Math.sin(TIMERS.hips * 0.7) *
                0.025 *
                fatigue;
        }

        // ====================================================
        // FASE 4 — ESFORÇO
        // 35s até 50s
        // ====================================================

        const effort =
            getPhaseProgress(
                farmTime,
                PROGRESSION.EFFORT_START,
                15
            );

        if (effort > 0) {

            // O personagem começa a usar mais as pernas
            const legBend =
                0.12 * effort;

            progression.leftUpperLeg.x +=
                legBend;

            progression.rightUpperLeg.x +=
                legBend;

            // Pequena compensação alternada
            progression.leftLowerLeg.x +=
                Math.sin(TIMERS.hips) *
                0.04 *
                effort;

            progression.rightLowerLeg.x +=
                Math.cos(TIMERS.hips) *
                0.04 *
                effort;

            // Quadril começa a baixar visualmente
            progression.hips.x +=
                0.035 * effort;
        }

        // ====================================================
        // FASE 5 — SOBRECARGA
        // 50s+
        // ====================================================

        const overload =
            clamp01(
                (farmTime - PROGRESSION.OVERLOAD_START) /
                20
            );

        if (overload > 0) {

            const intensity =
                smoothStep(overload);

            // Flexão mais evidente
            progression.leftUpperLeg.x +=
                0.18 * intensity;

            progression.rightUpperLeg.x +=
                0.18 * intensity;

            progression.leftLowerLeg.x +=
                0.08 * intensity;

            progression.rightLowerLeg.x +=
                0.08 * intensity;

            // Corpo mais carregado
            progression.chest.x +=
                0.05 * intensity;

            progression.hips.x +=
                0.05 * intensity;
        }

        // ====================================================
        // OFFSETS FINAIS
        // ====================================================

        return {

            // Respiração
            chest: {
                x: breath + progression.chest.x
            },

            // Cabeça
            head: {
                x:
                    headMotion +
                    progression.head.x,

                y:
                    headMotion * 0.6 +
                    progression.head.y,

                z:
                    progression.head.z
            },

            // Pescoço
            neck: {
                x:
                    neckMotion +
                    progression.neck.x,

                y:
                    neckMotion * 0.6 +
                    progression.neck.y,

                z:
                    progression.neck.z
            },

            // Ombros
            leftShoulder: {
                x:
                    lShoulderMotion +
                    breath * 0.3
            },

            rightShoulder: {
                x:
                    rShoulderMotion +
                    breath * 0.3
            },

            // IMPORTANTE:
            // Os braços não recebem mais oscilações
            // automáticas do LifeAnimation.
            //
            // Isso evita que a LifeAnimation brigue
            // com o SixSevenAction.

            // Quadril
            hips: {
                x:
                    Math.abs(hipsMotion) * 0.3 +
                    progression.hips.x,

                y:
                    hipsMotion +
                    progression.hips.y,

                z:
                    progression.hips.z
            },

            // Pernas
            leftUpperLeg: {
                x: progression.leftUpperLeg.x,
                y: progression.leftUpperLeg.y,
                z: progression.leftUpperLeg.z
            },

            rightUpperLeg: {
                x: progression.rightUpperLeg.x,
                y: progression.rightUpperLeg.y,
                z: progression.rightUpperLeg.z
            },

            leftLowerLeg: {
                x: progression.leftLowerLeg.x,
                y: progression.leftLowerLeg.y,
                z: progression.leftLowerLeg.z
            },

            rightLowerLeg: {
                x: progression.rightLowerLeg.x,
                y: progression.rightLowerLeg.y,
                z: progression.rightLowerLeg.z
            }
        };
    }
};
