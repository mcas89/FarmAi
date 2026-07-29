import { sixSevenFrames } from './sixSevenData';

const instances = {};

const getInstance = (uuid) => {
    if (!instances[uuid]) {
        instances[uuid] = {
            floatFrameIndex: 0,
            prevLeft: false,
            prevRight: false,
            timeSinceLastClick: 999,
            clickInterval: 1.0
        };
    }
    return instances[uuid];
};

export const SixSevenAction = {
    update: (delta, isLeftFarming, isRightFarming, comboCount = 0, uuid = 'default') => {
        const inst = getInstance(uuid);

        // Inicializa a variável de energia (CPS) se não existir
        if (inst.cps === undefined) inst.cps = 0;
        if (inst.prevComboCount === undefined) inst.prevComboCount = 0;

        inst.timeSinceLastClick += delta;

        // Detecta o clique e injeta "energia". Como isLeftFarming tem cooldown visual de 800ms, 
        // a única forma de garantir a leitura de todo toque em sequência rápida é pelo incremento do comboCount!
        if (comboCount > inst.prevComboCount) {
            inst.cps += 1.0; 
            inst.timeSinceLastClick = 0;
        }

        inst.prevComboCount = comboCount;
        const isInCombo = comboCount > 0;

        inst.prevLeft = isLeftFarming;
        inst.prevRight = isRightFarming;

        // Decai a energia pela metade a cada 0.4 segundos (suaviza a transição e mantém a inércia)
        inst.cps = inst.cps * Math.pow(0.5, delta / 0.4);

        // Se passar muito tempo sem clicar E NÃO estiver no combo, volta para IDLE (null)
        if (inst.timeSinceLastClick > 0.4 && !isInCombo) {
            return {
                left: { targetPose: null, lerpFactor: 0.1 },
                right: { targetPose: null, lerpFactor: 0.1 }
            };
        }

        // Velocidade baseada na energia acumulada (cps).
        // 15 = velocidade base. 90 = frenético.
        // Como antes dividíamos por 24 frames, a frequência correta é:
        let freq = (15 + (inst.cps * 25)) / 24;
        inst.floatFrameIndex += delta * freq;
        const phase = inst.floatFrameIndex * Math.PI * 2;
        
        // 1. Pose Base fixa (Pernas, Quadril, Peito e Ombros) - ENVIADA PELO USUARIO
        const mathPose = {
            hips: { "x": 0.0175, "y": -0.2618, "z": 0 },
            chest: { "x": 0, "y": 0, "z": -0.0168 },
            hipsPosition: { "x": 0.0003, "y": 0.0025, "z": 0.0036 },
            
            leftShoulder: { "x": -1.85, "y": 0, "z": 0 },
            rightShoulder: { "x": -1.85, "y": 0, "z": 0 },
            
            leftUpperArm: { "x": -0.1745, "y": 1.3614, "z": -0.2793 },
            rightUpperArm: { "x": 0, "y": -1.32, "z": 0.3 },
            
            leftUpperLeg: { "x": 0.0175, "y": -0.0175, "z": 0.1222 },
            leftLowerLeg: { "x": 0.0175, "y": 0.3316, "z": -0.0349 },
            leftFoot: { "x": -0.1348, "y": 0, "z": 0 },
            leftToes: { "x": 0.0519, "y": 0, "z": 0 },
            
            rightUpperLeg: { "x": 0.0175, "y": 0.1745, "z": -0.0873 },
            rightLowerLeg: { "x": 0.0391, "y": 0, "z": 0 },
            rightFoot: { "x": -0.1715, "y": 0, "z": 0 },
            rightToes: { "x": 0.066, "y": 0, "z": 0 }
        };

        const pumpR = (Math.sin(phase) + 1) / 2; // Oscila de 0 a 1
        const pumpL = 1 - pumpR;
        
        const lerp = (a, b, t) => a + (b - a) * t;
        
        // "limite do braço alto" = Braço DIREITO fornecido no JSON
        const rLowerClosed = { "x": 0.2269, "y": -0.1745, "z": 1.9722 };
        const rHandClosed  = { "x": 0.057, "y": 0.0159, "z": 0.2203 };
        
        // "limite do braço baixo" = Braço ESQUERDO fornecido no JSON
        const lLowerOpen   = { "x": 0.1396, "y": 0.3142, "z": 0.1396 }; 
        const lHandOpen    = { "x": 0.035, "y": -0.0071, "z": -0.077 };

        // Agora calculamos os espelhos espelhando no eixo Y e Z (x, -y, -z)
        const rLowerOpen   = { "x": 0.1396, "y": -0.3142, "z": -0.1396 };
        const rHandOpen    = { "x": 0.035, "y": 0.0071, "z": 0.077 };
        
        const lLowerClosed = { "x": 0.2269, "y": 0.1745, "z": -1.9722 }; 
        const lHandClosed  = { "x": 0.057, "y": -0.0159, "z": -0.2203 }; 
        
        // Aplica blend
        mathPose.rightLowerArm = {
            x: lerp(rLowerOpen.x, rLowerClosed.x, pumpR),
            y: lerp(rLowerOpen.y, rLowerClosed.y, pumpR),
            z: lerp(rLowerOpen.z, rLowerClosed.z, pumpR)
        };
        mathPose.rightHand = {
            x: lerp(rHandOpen.x, rHandClosed.x, pumpR),
            y: lerp(rHandOpen.y, rHandClosed.y, pumpR),
            z: lerp(rHandOpen.z, rHandClosed.z, pumpR)
        };
        
        mathPose.leftLowerArm = {
            x: lerp(lLowerOpen.x, lLowerClosed.x, pumpL),
            y: lerp(lLowerOpen.y, lLowerClosed.y, pumpL),
            z: lerp(lLowerOpen.z, lLowerClosed.z, pumpL)
        };
        mathPose.leftHand = {
            x: lerp(lHandOpen.x, lHandClosed.x, pumpL),
            y: lerp(lHandOpen.y, lHandClosed.y, pumpL),
            z: lerp(lHandOpen.z, lHandClosed.z, pumpL)
        };

        // LERP muito alto (0.85) é obrigatório aqui! Se for baixo (ex: 0.3), 
        const lerpFactor = 0.85; 

        // Se o jogador não fez uma sequência mínima de 4 toques (6,7,6,7), 
        // a animação não inicia e os braços ficam em repouso.
        if (comboCount < 4) {
            return {
                left: { targetPose: null, lerpFactor },
                right: { targetPose: null, lerpFactor },
                body: { targetPose: null, lerpFactor }
            };
        }

        // Se estiver num combo acelerado (>= 4), a pose de corpo toma conta.
        // Se estiver apenas solto batendo 1 lado (não combo), apenas aquele braço e o corpo acompanham.
        return {
            left: { targetPose: (isInCombo || isLeftFarming) ? mathPose : null, lerpFactor },
            right: { targetPose: (isInCombo || isRightFarming) ? mathPose : null, lerpFactor },
            body: { targetPose: mathPose, lerpFactor }
        };
    }
};
