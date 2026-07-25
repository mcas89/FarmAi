import * as THREE from 'three';

const SIX_SEVEN_BASE = {
  hips: { x: 0.18, y: 3.14 },
  leftShoulder: { x: -1.59 },
  rightShoulder: { x: -1.85 },
  leftUpperArm: { y: 1.25 },
  rightUpperArm: { y: -1.32, z: 0.3 },
  leftLowerArm: { x: 0.39, z: -1.82 },
  rightLowerArm: { z: 0.12 },
  chest: { z: -0.12 }
};

let leftPhase = 0;
let rightPhase = 0;

export const FarmController = {
  update: (vrm, isLeft, isRight, delta, auraMultipliers) => {
    if (!vrm || !vrm.humanoid) return;

    const farmSpeed = 15 * (auraMultipliers?.speed || 1);
    const amp = auraMultipliers?.farmAmp || 1;

    // Acumula a onda senoidal apenas enquanto estiver clicado, senão reseta suavemente
    if (isLeft) leftPhase += delta * farmSpeed;
    else leftPhase = THREE.MathUtils.lerp(leftPhase, 0, 0.1);

    if (isRight) rightPhase += delta * farmSpeed;
    else rightPhase = THREE.MathUtils.lerp(rightPhase, 0, 0.1);

    // O seno gera o ciclo: Puxa -> Volta -> Puxa
    const pullL = Math.sin(leftPhase);
    const pullR = Math.sin(rightPhase);

    const get = (name) => vrm.humanoid.getNormalizedBoneNode(name);

    // ===============================================
    // BRAÇO ESQUERDO (Aplica por cima do Idle se ativo)
    // ===============================================
    if (isLeft || leftPhase > 0.01) {
        // OMBRO: apenas acompanha a pose base
        const lShoulder = get('leftShoulder');
        if (lShoulder) lShoulder.rotation.x = THREE.MathUtils.lerp(lShoulder.rotation.x, SIX_SEVEN_BASE.leftShoulder.x, 0.1);
        
        // UPPER ARM: apenas acompanha
        const lUpper = get('leftUpperArm');
        if (lUpper) lUpper.rotation.y = THREE.MathUtils.lerp(lUpper.rotation.y, SIX_SEVEN_BASE.leftUpperArm.y, 0.1);

        // LOWER ARM (ANTEBRAÇO): Foco PRINCIPAL do movimento Six Seven
        const lLower = get('leftLowerArm');
        if (lLower) {
            lLower.rotation.z = THREE.MathUtils.lerp(lLower.rotation.z, SIX_SEVEN_BASE.leftLowerArm.z + (pullL * 0.6 * amp), 0.2);
            lLower.rotation.x = THREE.MathUtils.lerp(lLower.rotation.x, SIX_SEVEN_BASE.leftLowerArm.x, 0.2);
        }

        // HAND (MÃO): Fecha o movimento junto
        const lHand = get('leftHand');
        if (lHand) lHand.rotation.z = THREE.MathUtils.lerp(lHand.rotation.z, -0.8 + (pullL * 0.4 * amp), 0.2);
    }

    // ===============================================
    // BRAÇO DIREITO
    // ===============================================
    if (isRight || rightPhase > 0.01) {
        // OMBRO
        const rShoulder = get('rightShoulder');
        if (rShoulder) rShoulder.rotation.x = THREE.MathUtils.lerp(rShoulder.rotation.x, SIX_SEVEN_BASE.rightShoulder.x, 0.1);
        
        // UPPER ARM
        const rUpper = get('rightUpperArm');
        if (rUpper) {
            rUpper.rotation.y = THREE.MathUtils.lerp(rUpper.rotation.y, SIX_SEVEN_BASE.rightUpperArm.y, 0.1);
            rUpper.rotation.z = THREE.MathUtils.lerp(rUpper.rotation.z, SIX_SEVEN_BASE.rightUpperArm.z, 0.1);
        }

        // LOWER ARM
        const rLower = get('rightLowerArm');
        if (rLower) {
            rLower.rotation.z = THREE.MathUtils.lerp(rLower.rotation.z, SIX_SEVEN_BASE.rightLowerArm.z - (pullR * 0.6 * amp), 0.2);
        }

        // HAND
        const rHand = get('rightHand');
        if (rHand) rHand.rotation.z = THREE.MathUtils.lerp(rHand.rotation.z, 0.8 - (pullR * 0.4 * amp), 0.2);
    }
  }
};
