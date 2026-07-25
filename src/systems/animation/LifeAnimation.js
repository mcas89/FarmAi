/**
 * LifeAnimation
 * PRIORIDADE 03
 * Totalmente assíncrona. Cada parte do corpo roda num relógio próprio (frequência).
 * NENHUM osso é sincronizado artificialmente.
 */

const TIMERS = {
    breath: 0,
    head: 0,
    neck: 0,
    lArm: 0,
    rArm: 0,
    hips: 0,
    lShoulder: 0,
    rShoulder: 0
};

// Frequências independentes exatas definidas (Tempo em segundos por ciclo)
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

export const LifeAnimation = {
    getOffsets: (delta, brainBreathMultiplier = 1.0) => {
        // Incrementa o relógio interno de cada parte do corpo (assíncrono)
        Object.keys(TIMERS).forEach(key => {
            // Adiciona uma micro-variação à frequência baseada no próprio tempo para que nunca entre num loop perceptível
            const noise = Math.sin(delta * 0.1) * 0.05; 
            TIMERS[key] += delta * (FREQUENCIES[key] + noise);
        });

        // 1. Respiração (Sempre contínua, afetando várias partes levemente)
        const breathAmp = 0.015 * brainBreathMultiplier;
        const breath = Math.sin(TIMERS.breath) * breathAmp;

        // 2. Oscilações orgânicas puras (AUMENTADAS PARA MAIOR SENSAÇÃO DE VENTO E VIDA)
        const headMotion = Math.sin(TIMERS.head) * 0.05; // 2.5x maior
        const neckMotion = Math.cos(TIMERS.neck) * 0.04; // 4x maior
        
        const lShoulderMotion = Math.sin(TIMERS.lShoulder) * 0.03; // 3x maior
        const rShoulderMotion = Math.cos(TIMERS.rShoulder) * 0.03;
        
        const lArmMotion = Math.sin(TIMERS.lArm) * 0.04; // Quase 3x maior
        const rArmMotion = Math.cos(TIMERS.rArm) * 0.04;
        
        // Mãos oscilando levemente para os dedos não parecerem pedra (vento/microtensões)
        const lHandMotion = Math.sin(TIMERS.lArm * 1.5) * 0.06;
        const rHandMotion = Math.cos(TIMERS.rArm * 1.5) * 0.06;
        
        const hipsMotion = Math.sin(TIMERS.hips) * 0.02;

        // Montagem final do pacote de oscilações
        return {
            chest: { x: breath },
            head: { x: headMotion, y: headMotion * 0.6 },
            neck: { x: neckMotion, y: neckMotion * 0.6 },
            // Os ombros acompanham muito discretamente a respiração + sua própria oscilação natural
            leftShoulder: { x: lShoulderMotion + breath * 0.3 }, 
            rightShoulder: { x: rShoulderMotion + breath * 0.3 },
            leftLowerArm: { x: lArmMotion },
            rightLowerArm: { x: rArmMotion },
            leftHand: { x: lHandMotion, z: lHandMotion * 0.3 },
            rightHand: { x: rHandMotion, z: rHandMotion * 0.3 },
            hips: { y: hipsMotion, x: Math.abs(hipsMotion) * 0.3 }
        };
    }
};
