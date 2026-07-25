let walkTime = 0;
let blendWeight = 0; // Permite iniciar e parar a caminhada de forma orgânica e suave

export const WalkAnimation = {
    getOffsets: (delta, isMoving, isRunning = false) => {
        // Velocidade da passada de acordo com o estado
        const cycleSpeed = isRunning ? 22.0 : 10.0;
        
        // Interpolação do peso (smooth in / smooth out)
        if (isMoving) {
            blendWeight = Math.min(1.0, blendWeight + delta * 3.0); // Acelera até 1
            walkTime += delta * cycleSpeed; 
        } else {
            blendWeight = Math.max(0.0, blendWeight - delta * 4.0); // Desacelera até 0
            if (blendWeight > 0) walkTime += delta * (cycleSpeed * 0.5); // Continua caindo devagar
        }

        if (blendWeight <= 0.01) return null;

        // Senos e Cossenos para as passadas opostas
        const leftLeg = Math.sin(walkTime);
        const rightLeg = Math.sin(walkTime + Math.PI); 

        // Joelhos (só dobram pra trás e só em um momento da passada)
        const leftKnee = Math.max(0, -Math.sin(walkTime - Math.PI / 4)) * 0.9;
        const rightKnee = Math.max(0, -Math.sin(walkTime + Math.PI - Math.PI / 4)) * 0.9;

        // ==========================================
        // PESO CORPORAL (A MÁGICA DA VIDA AO ANDAR)
        // ==========================================
        
        // 1. Quadril (Hips): Afunda 2 vezes por ciclo (a cada pisada no chão).
        const hipBounce = -Math.abs(Math.cos(walkTime)) * 0.12; // Desce bastante
        const hipTwist = Math.sin(walkTime) * 0.08; // Rotação acompanhando a perna que vai à frente
        const hipSway = Math.cos(walkTime) * 0.05; // Joga o peso lateralmente na perna de apoio

        // 2. Tronco (Chest/Spine): Reage à pisada torcendo para o lado oposto e cedendo à gravidade.
        const chestTwist = -hipTwist * 0.8; 
        const chestForward = Math.abs(Math.cos(walkTime)) * 0.04; // O peito inclina pra frente no impacto

        // 3. Pescoço e Cabeça: Amortecem o impacto final ("Bobbing").
        const neckBob = -Math.abs(Math.cos(walkTime)) * 0.03;
        
        // 4. Ombros: Caem e sobem sentindo a gravidade.
        const shoulderBounce = -Math.abs(Math.cos(walkTime)) * 0.06;

        // 5. Braços (Pêndulo com Massa)
        // Se a perna esquerda vai pra frente, o braço direito vai pra frente (e balança sutilmente pra fora).
        const armSwing = isRunning ? 0.8 : 0.45;
        const leftArmX = rightLeg * armSwing;
        const leftArmZ = rightLeg * 0.1;
        const rightArmX = leftLeg * armSwing;
        const rightArmZ = -leftLeg * 0.1;

        // Amplitude da passada (Stride Length)
        const strideLength = isRunning ? 0.9 : 0.5;

        return {
            weight: blendWeight,
            offsets: {
                leftUpperLeg: { x: leftLeg * strideLength },
                leftLowerLeg: { x: leftKnee },
                rightUpperLeg: { x: rightLeg * strideLength },
                rightLowerLeg: { x: rightKnee },
                
                // Pêndulo dinâmico dos braços
                leftUpperArm: { x: leftArmX, z: leftArmZ },
                rightUpperArm: { x: rightArmX, z: rightArmZ },
                
                // Ombros reagindo ao peso
                leftShoulder: { z: shoulderBounce },
                rightShoulder: { z: -shoulderBounce }, // Eixo Z no VRM é espelhado para os braços
                
                // Núcleo (Core) sentindo o impacto do passo
                hips: { y: hipBounce, z: hipTwist, x: hipSway },
                chest: { z: chestTwist, x: chestForward },
                neck: { x: neckBob },
                head: { x: neckBob * 0.5 } // A cabeça suaviza a reação final
            }
        };
    }
};
