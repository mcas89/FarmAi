import * as THREE from 'three';

export const AuraController = {
    getMultipliers: (level) => {
        // Quanto mais aura, maior a velocidade, amplitude e movimento corporal
        const isAdvanced = level >= 3;
        const isMax = level >= 5;

        return {
            speed: isMax ? 1.8 : (isAdvanced ? 1.4 : 1.0),
            farmAmp: isMax ? 1.3 : (isAdvanced ? 1.15 : 1.0),
            breathAmp: isMax ? 2.0 : (isAdvanced ? 1.5 : 1.0),
            jumpActive: isAdvanced
        };
    },

    update: (vrm, level, isLeft, isRight, delta) => {
        if (!vrm || !vrm.humanoid) return;
        
        const mult = AuraController.getMultipliers(level);
        
        // CORPO RESPONDENDO À AURA ALTA
        // Se a aura for nível 3+ e estiver farmando com ambos os braços -> pequenos pulos
        if (mult.jumpActive && isLeft && isRight) {
            const time = Date.now() * 0.001;
            const bounce = Math.abs(Math.sin(time * 15 * mult.speed)); // Pulo rítmico
            vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, bounce * 0.1, 0.2);
        } else {
            // Volta pro chão natural
            vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, 0, 0.1);
        }
    }
};
