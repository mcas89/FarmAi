/**
 * CharacterBrain
 * O "Cérebro" do personagem que toma decisões probabilísticas autônomas a longo prazo.
 * Trabalha na PRIORIDADE 02 (acima da Vida, abaixo das Ações diretas).
 */

const ACTIVE_DECISIONS = {
    headLookX: { current: 0, target: 0, duration: 0, lerp: 0.04 },
    headLookY: { current: 0, target: 0, duration: 0, lerp: 0.03 },
    neckTwitch: { current: 0, target: 0, duration: 0, lerp: 0.04 },
    deepBreath: { active: false, multiplier: 1.0, duration: 0 },
    
    // Braços (Ombro, Upper, Lower, Hand)
    leftShoulder: { current: 0, target: 0, duration: 0, lerp: 0.03 },
    rightShoulder: { current: 0, target: 0, duration: 0, lerp: 0.03 },
    leftUpperArmX: { current: 0, target: 0, duration: 0, lerp: 0.03 },
    leftUpperArmZ: { current: 0, target: 0, duration: 0, lerp: 0.03 },
    rightUpperArmX: { current: 0, target: 0, duration: 0, lerp: 0.03 },
    rightUpperArmZ: { current: 0, target: 0, duration: 0, lerp: 0.03 },
    leftLowerArm: { current: 0, target: 0, duration: 0, lerp: 0.05 },
    rightLowerArm: { current: 0, target: 0, duration: 0, lerp: 0.05 },
    
    // Pernas e Quadril
    hipsPosY: { current: 0, target: 0, duration: 0, lerp: 0.05 },
    hipsRotX: { current: 0, target: 0, duration: 0, lerp: 0.05 },
    leftUpperLeg: { current: 0, target: 0, duration: 0, lerp: 0.05 },
    leftLowerLeg: { current: 0, target: 0, duration: 0, lerp: 0.05 },
    rightUpperLeg: { current: 0, target: 0, duration: 0, lerp: 0.05 },
    rightLowerLeg: { current: 0, target: 0, duration: 0, lerp: 0.05 },
};

// Tempos de controle
let nextEventTimer = 2.0;
let idleTimer = 0;
let triggered = { 10: false, 20: false, 30: false, 40: false, 50: false, 60: false };

export const CharacterBrain = {
    update: (delta, isIdle = false) => {
        // ==========================================
        // 1. SISTEMA DE TEMPO PARADO (IDLE TIMED ANIMATIONS)
        // ==========================================
        if (isIdle) {
            idleTimer += delta;
        } else {
            idleTimer = 0;
            triggered = { 10: false, 20: false, 30: false, 40: false, 50: false, 60: false };
        }

        // 10s: Espreguiçar
        if (idleTimer >= 10 && !triggered[10]) {
            ACTIVE_DECISIONS.leftUpperArmX.target = -2.5; 
            ACTIVE_DECISIONS.leftUpperArmX.duration = 4.0;
            ACTIVE_DECISIONS.rightUpperArmX.target = -2.5;
            ACTIVE_DECISIONS.rightUpperArmX.duration = 4.0;
            ACTIVE_DECISIONS.leftShoulder.target = 0.2;
            ACTIVE_DECISIONS.leftShoulder.duration = 4.0;
            ACTIVE_DECISIONS.rightShoulder.target = -0.2;
            ACTIVE_DECISIONS.rightShoulder.duration = 4.0;
            ACTIVE_DECISIONS.headLookX.target = -0.3; 
            ACTIVE_DECISIONS.headLookX.duration = 4.0;
            triggered[10] = true;
        } 
        // 20s: Mexer as pernas
        else if (idleTimer >= 20 && !triggered[20]) {
            ACTIVE_DECISIONS.leftUpperLeg.target = -0.3;
            ACTIVE_DECISIONS.leftUpperLeg.duration = 2.0;
            ACTIVE_DECISIONS.leftLowerLeg.target = 0.5;
            ACTIVE_DECISIONS.leftLowerLeg.duration = 2.0;
            triggered[20] = true;
        }
        // 30s: Bater Palma leve
        else if (idleTimer >= 30 && !triggered[30]) {
            ACTIVE_DECISIONS.leftUpperArmX.target = -0.5;
            ACTIVE_DECISIONS.leftUpperArmX.duration = 2.5;
            ACTIVE_DECISIONS.leftUpperArmZ.target = -1.2;
            ACTIVE_DECISIONS.leftUpperArmZ.duration = 2.5;
            ACTIVE_DECISIONS.leftLowerArm.target = -1.0;
            ACTIVE_DECISIONS.leftLowerArm.duration = 2.5;
            
            ACTIVE_DECISIONS.rightUpperArmX.target = -0.5;
            ACTIVE_DECISIONS.rightUpperArmX.duration = 2.5;
            ACTIVE_DECISIONS.rightUpperArmZ.target = 1.2;
            ACTIVE_DECISIONS.rightUpperArmZ.duration = 2.5;
            ACTIVE_DECISIONS.rightLowerArm.target = -1.0;
            ACTIVE_DECISIONS.rightLowerArm.duration = 2.5;
            triggered[30] = true;
        }
        // 40s: Agachar
        else if (idleTimer >= 40 && !triggered[40]) {
            ACTIVE_DECISIONS.hipsPosY.target = -0.25; // Reduzido de -0.5 para -0.25 para não afundar no chão
            ACTIVE_DECISIONS.hipsPosY.duration = 3.5;
            ACTIVE_DECISIONS.hipsRotX.target = 0.2; 
            ACTIVE_DECISIONS.hipsRotX.duration = 3.5;
            
            ACTIVE_DECISIONS.leftUpperLeg.target = -1.2; 
            ACTIVE_DECISIONS.leftUpperLeg.duration = 3.5;
            ACTIVE_DECISIONS.leftLowerLeg.target = 1.2;  
            ACTIVE_DECISIONS.leftLowerLeg.duration = 3.5;
            
            ACTIVE_DECISIONS.rightUpperLeg.target = -1.2;
            ACTIVE_DECISIONS.rightUpperLeg.duration = 3.5;
            ACTIVE_DECISIONS.rightLowerLeg.target = 1.2;
            ACTIVE_DECISIONS.rightLowerLeg.duration = 3.5;
            triggered[40] = true;
        }
        // 50s: Mão no cabelo
        else if (idleTimer >= 50 && !triggered[50]) {
            ACTIVE_DECISIONS.rightUpperArmX.target = -2.8; 
            ACTIVE_DECISIONS.rightUpperArmX.duration = 3.0;
            ACTIVE_DECISIONS.rightUpperArmZ.target = -0.5;
            ACTIVE_DECISIONS.rightUpperArmZ.duration = 3.0;
            ACTIVE_DECISIONS.rightLowerArm.target = -2.0; 
            ACTIVE_DECISIONS.rightLowerArm.duration = 3.0;
            ACTIVE_DECISIONS.headLookY.target = 0.3; 
            ACTIVE_DECISIONS.headLookY.duration = 3.0;
            triggered[50] = true;
        }
        // 60s: Cruzar os braços
        else if (idleTimer >= 60 && !triggered[60]) {
            ACTIVE_DECISIONS.leftUpperArmZ.target = -1.0;
            ACTIVE_DECISIONS.leftUpperArmZ.duration = 6.0;
            ACTIVE_DECISIONS.leftLowerArm.target = -1.5;
            ACTIVE_DECISIONS.leftLowerArm.duration = 6.0;
            
            ACTIVE_DECISIONS.rightUpperArmZ.target = 1.0;
            ACTIVE_DECISIONS.rightUpperArmZ.duration = 6.0;
            ACTIVE_DECISIONS.rightLowerArm.target = -1.5;
            ACTIVE_DECISIONS.rightLowerArm.duration = 6.0;
            triggered[60] = true;
        }

        // ==========================================
        // 2. SISTEMA ALEATÓRIO ORGÂNICO (TWITCHES)
        // ==========================================
        nextEventTimer -= delta;
        
        // Quando o timer zera, o cérebro decide fazer UMA ação orgânica e define um novo timer longo.
        if (nextEventTimer <= 0) {
            // Sorteia o próximo evento para ocorrer entre 3 e 15 segundos!
            nextEventTimer = 3.0 + Math.random() * 12.0; 
            
            const eventId = Math.floor(Math.random() * 7);

            switch (eventId) {
                case 0: 
                    ACTIVE_DECISIONS.headLookY.target = 0.4 + Math.random() * 0.3; 
                    ACTIVE_DECISIONS.headLookY.duration = 2.0 + Math.random() * 2.0;
                    break;
                case 1: 
                    ACTIVE_DECISIONS.headLookY.target = -0.4 - Math.random() * 0.3; 
                    ACTIVE_DECISIONS.headLookY.duration = 2.0 + Math.random() * 2.0;
                    break;
                case 2: 
                    ACTIVE_DECISIONS.headLookX.target = -0.2 - Math.random() * 0.3; 
                    ACTIVE_DECISIONS.headLookX.duration = 2.0 + Math.random() * 3.0;
                    break;
                case 3: 
                    ACTIVE_DECISIONS.neckTwitch.target = (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.1);
                    ACTIVE_DECISIONS.neckTwitch.duration = 1.0 + Math.random() * 1.5;
                    break;
                case 4: 
                    ACTIVE_DECISIONS.deepBreath.active = true;
                    ACTIVE_DECISIONS.deepBreath.multiplier = 3.5; 
                    ACTIVE_DECISIONS.deepBreath.duration = 2.5;
                    break;
                case 5: 
                    // Alongamento leve
                    ACTIVE_DECISIONS.leftUpperArmX.target = 0.1 + Math.random() * 0.15;
                    ACTIVE_DECISIONS.leftUpperArmX.duration = 3.0;
                    ACTIVE_DECISIONS.leftShoulder.target = 0.1;
                    ACTIVE_DECISIONS.leftShoulder.duration = 3.0;
                    break;
                case 6: 
                    // Balanço braço direito
                    ACTIVE_DECISIONS.rightUpperArmX.target = -0.3 - Math.random() * 0.2;
                    ACTIVE_DECISIONS.rightUpperArmX.duration = 2.5;
                    ACTIVE_DECISIONS.rightShoulder.target = -0.15;
                    ACTIVE_DECISIONS.rightShoulder.duration = 2.5;
                    break;
            }
        }

        // Processamento das decisões (Interpolação contínua e suave para o target, e de volta para 0)
        const processDecision = (key, dt) => {
            const dec = ACTIVE_DECISIONS[key];
            if (dec.duration > 0) {
                dec.duration -= dt;
            } else {
                dec.target = 0; // Volta ao centro lentamente quando o evento acaba
            }
            dec.current += (dec.target - dec.current) * dec.lerp;
        };

        // Roda processDecision para TODAS as chaves (menos deepBreath)
        Object.keys(ACTIVE_DECISIONS).forEach(key => {
            if (key !== 'deepBreath') processDecision(key, delta);
        });

        // Processamento isolado da respiração (é um multiplicador, não um ângulo)
        if (ACTIVE_DECISIONS.deepBreath.duration > 0) {
            ACTIVE_DECISIONS.deepBreath.duration -= delta;
        } else {
            ACTIVE_DECISIONS.deepBreath.active = false;
            ACTIVE_DECISIONS.deepBreath.multiplier += (1.0 - ACTIVE_DECISIONS.deepBreath.multiplier) * 0.02;
        }

        return {
            hipsPosY: ACTIVE_DECISIONS.hipsPosY.current,
            hips: { x: ACTIVE_DECISIONS.hipsRotX.current },
            head: { x: ACTIVE_DECISIONS.headLookX.current, y: ACTIVE_DECISIONS.headLookY.current },
            neck: { 
                x: ACTIVE_DECISIONS.headLookX.current * 0.3, 
                y: (ACTIVE_DECISIONS.headLookY.current * 0.3) + ACTIVE_DECISIONS.neckTwitch.current,
                z: ACTIVE_DECISIONS.neckTwitch.current * 0.5 
            },
            leftShoulder: { z: ACTIVE_DECISIONS.leftShoulder.current },
            rightShoulder: { z: ACTIVE_DECISIONS.rightShoulder.current },
            leftUpperArm: { x: ACTIVE_DECISIONS.leftUpperArmX.current, z: ACTIVE_DECISIONS.leftUpperArmZ.current },
            rightUpperArm: { x: ACTIVE_DECISIONS.rightUpperArmX.current, z: ACTIVE_DECISIONS.rightUpperArmZ.current },
            leftLowerArm: { x: ACTIVE_DECISIONS.leftLowerArm.current, z: ACTIVE_DECISIONS.leftLowerArm.current * -0.5 },
            rightLowerArm: { x: ACTIVE_DECISIONS.rightLowerArm.current, z: ACTIVE_DECISIONS.rightLowerArm.current * 0.5 },
            leftUpperLeg: { x: ACTIVE_DECISIONS.leftUpperLeg.current },
            leftLowerLeg: { x: ACTIVE_DECISIONS.leftLowerLeg.current },
            rightUpperLeg: { x: ACTIVE_DECISIONS.rightUpperLeg.current },
            rightLowerLeg: { x: ACTIVE_DECISIONS.rightLowerLeg.current },
            breathMultiplier: ACTIVE_DECISIONS.deepBreath.multiplier
        };
    }
};
