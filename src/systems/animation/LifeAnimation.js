/**
 * LifeAnimation
 * PRIORIDADE 03
 *
 * Vida orgânica + progressão corporal durante a sessão.
 *
 * IMPORTANTE:
 * - Não controla a lógica do Six Seven.
 * - Não altera o sistema de combo.
 * - Mantém os movimentos orgânicos existentes.
 * - Adiciona progressão gradual ao corpo.
 */

const TIMERS = {
    breath: 0,
    head: 0,
    neck: 0,
    lArm: 0,
    rArm: 0,
    hips: 0,
    lShoulder: 0,
    rShoulder: 0,

    // Novo relógio da progressão corporal
    progression: 0
};


// Frequências independentes
const FREQUENCIES = {
    breath: (Math.PI * 2) / 3.7,
    head: (Math.PI * 2) / 6.2,
    neck: (Math.PI * 2) / 8.0,
    lArm: (Math.PI * 2) / 11.0,
    rArm: (Math.PI * 2) / 14.0,
    hips: (Math.PI * 2) / 7.0,
    lShoulder: (Math.PI * 2) / 9.0,
    rShoulder: (Math.PI * 2) / 12.0
};


// Limita um valor entre 0 e 1
const clamp01 = (value) => {
    return Math.max(0, Math.min(1, value));
};


// Suavização para evitar movimentos robóticos
const smoothStep = (value) => {
    const t = clamp01(value);

    return t * t * (3 - 2 * t);
};


export const LifeAnimation = {

    getOffsets: (
        delta,
        brainBreathMultiplier = 1.0
    ) => {

        // ====================================================
        // RELÓGIOS ORGÂNICOS EXISTENTES
        // ====================================================

        Object.keys(FREQUENCIES).forEach(key => {

            const noise =
                Math.sin(delta * 0.1) * 0.05;

            TIMERS[key] +=
                delta * (FREQUENCIES[key] + noise);
        });


        // ====================================================
        // RELÓGIO DA PROGRESSÃO
        // ====================================================

        TIMERS.progression += delta;

        const progressionTime =
            TIMERS.progression;


        // ====================================================
        // 1. RESPIRAÇÃO
        // ====================================================

        const breathAmp =
            0.015 * brainBreathMultiplier;

        const breath =
            Math.sin(TIMERS.breath) * breathAmp;


        // ====================================================
        // 2. MOVIMENTOS ORGÂNICOS EXISTENTES
        // ====================================================

        const headMotion =
            Math.sin(TIMERS.head) * 0.05;

        const neckMotion =
            Math.cos(TIMERS.neck) * 0.04;


        const lShoulderMotion =
            Math.sin(TIMERS.lShoulder) * 0.03;

        const rShoulderMotion =
            Math.cos(TIMERS.rShoulder) * 0.03;


        const lArmMotion =
            Math.sin(TIMERS.lArm) * 0.04;

        const rArmMotion =
            Math.cos(TIMERS.rArm) * 0.04;


        const lHandMotion =
            Math.sin(TIMERS.lArm * 1.5) * 0.06;

        const rHandMotion =
            Math.cos(TIMERS.rArm * 1.5) * 0.06;


        const hipsMotion =
            Math.sin(TIMERS.hips) * 0.02;


        // ====================================================
        // 3. PROGRESSÃO CORPORAL
        // ====================================================

        let progressionHeadX = 0;
        let progressionHeadY = 0;

        let progressionNeckX = 0;
        let progressionNeckY = 0;

        let progressionChestX = 0;

        let progressionHipsX = 0;
        let progressionHipsY = 0;


        // ====================================================
        // FASE 1 — PRIMEIRA REAÇÃO
        //
        // 5s → 10s
        //
        // Pequena mudança gradual na cabeça.
        // ====================================================

        if (progressionTime >= 5) {

            const progress =
                smoothStep(
                    (progressionTime - 5) / 5
                );

            progressionHeadY =
                0.12 * progress;

            progressionHeadX =
                -0.06 * progress;

            progressionNeckY =
                -0.025 * progress;
        }


        // ====================================================
        // FASE 2 — ALONGAMENTO
        //
        // 10s → 20s
        //
        // O peito começa a se abrir.
        // ====================================================

        if (progressionTime >= 10) {

            const progress =
                smoothStep(
                    (progressionTime - 10) / 10
                );

            progressionChestX =
                -0.08 * progress;

            progressionNeckX +=
                -0.025 * progress;
        }


        // ====================================================
        // FASE 3 — CANSAÇO
        //
        // 20s → 35s
        //
        // O corpo começa a ceder.
        // ====================================================

        if (progressionTime >= 20) {

            const progress =
                smoothStep(
                    (progressionTime - 20) / 15
                );

            progressionChestX +=
                0.12 * progress;

            progressionHeadX +=
                0.05 * progress;

            progressionHipsX +=
                0.05 * progress;
        }


        // ====================================================
        // FASE 4 — ESFORÇO
        //
        // 35s+
        //
        // Começa uma oscilação corporal maior.
        // ====================================================

        if (progressionTime >= 35) {

            const progress =
                smoothStep(
                    (progressionTime - 35) / 15
                );

            progressionHipsY +=
                Math.sin(TIMERS.hips * 0.5)
                * 0.04
                * progress;

            progressionHipsX +=
                0.08 * progress;

            progressionChestX +=
                0.04 * progress;
        }


        // ====================================================
        // RESULTADO FINAL
        // ====================================================

        return {

            chest: {
                x:
                    breath +
                    progressionChestX
            },


            head: {
                x:
                    headMotion +
                    progressionHeadX,

                y:
                    (headMotion * 0.6) +
                    progressionHeadY
            },


            neck: {
                x:
                    neckMotion +
                    progressionNeckX,

                y:
                    (neckMotion * 0.6) +
                    progressionNeckY
            },


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


            // Mantido exatamente como antes
            leftLowerArm: {
                x: lArmMotion
            },


            rightLowerArm: {
                x: rArmMotion
            },


            leftHand: {
                x: lHandMotion,
                z: lHandMotion * 0.3
            },


            rightHand: {
                x: rHandMotion,
                z: rHandMotion * 0.3
            },


            hips: {
                y:
                    hipsMotion +
                    progressionHipsY,

                x:
                    Math.abs(hipsMotion) * 0.3 +
                    progressionHipsX
            }
        };
    }
};
