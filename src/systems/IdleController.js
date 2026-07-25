import * as THREE from 'three';

const IDLE_BASE = {
  hips: { y: -3.14 },
  leftShoulder: { z: -0.39 },
  leftLowerArm: { z: -0.24 },
  leftUpperArm: { z: -0.6 },
  rightShoulder: { z: 0.36, y: 0.09 },
  rightUpperArm: { z: 0.65 },
  rightLowerArm: { z: 0.33 }
};

let time = 0;

export const IdleController = {
  update: (vrm, delta, auraMultipliers) => {
    if (!vrm || !vrm.humanoid) return;
    
    time += delta * (auraMultipliers?.speed || 1);
    
    const get = (name) => vrm.humanoid.getNormalizedBoneNode(name);
    
    // Aplica Pose Base com suavização (lerp)
    const setBoneBase = (name, base) => {
        const bone = get(name);
        if (!bone) return;
        if (base.x !== undefined) bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, base.x, 0.1);
        if (base.y !== undefined) bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, base.y, 0.1);
        if (base.z !== undefined) bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, base.z, 0.1);
    };

    // 1. Aplica as rotações base do IDLE
    Object.keys(IDLE_BASE).forEach(key => setBoneBase(key, IDLE_BASE[key]));

    // 2. Movimentos Procedurais (Vida)
    
    // CABEÇA: pequenos movimentos naturais de olhar
    const head = get('head');
    if (head) {
        const lookX = Math.sin(time * 0.4) * 0.05;
        const lookY = Math.sin(time * 0.2) * 0.08;
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, lookX, 0.05);
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, lookY, 0.05);
    }

    // PESCOÇO: acompanha a cabeça com atraso
    const neck = get('neck');
    if (neck && head) {
        neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, head.rotation.x * 0.5, 0.05);
        neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, head.rotation.y * 0.5, 0.05);
    }

    // PEITO: respiração contínua
    const chest = get('chest');
    if (chest) {
        const breath = Math.sin(time * 1.5) * 0.02 * (auraMultipliers?.breathAmp || 1);
        chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, breath, 0.1);
    }

    // OMBROS: pequenas correções de postura
    const leftShoulder = get('leftShoulder');
    const rightShoulder = get('rightShoulder');
    if (leftShoulder) leftShoulder.rotation.x = THREE.MathUtils.lerp(leftShoulder.rotation.x, Math.sin(time * 0.8) * 0.01, 0.05);
    if (rightShoulder) rightShoulder.rotation.x = THREE.MathUtils.lerp(rightShoulder.rotation.x, Math.sin(time * 0.8 + 1) * 0.01, 0.05);

    // QUADRIL: balanço suave esquerda/direita e peso
    const hips = get('hips');
    if (hips) {
        const sway = Math.sin(time * 0.5) * 0.03;
        hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, IDLE_BASE.hips.y + sway, 0.1);
        hips.rotation.x = THREE.MathUtils.lerp(hips.rotation.x, Math.abs(sway) * 0.5, 0.1);
    }

    // PERNAS: pequenas correções de equilíbrio relaxado
    const leftUpperLeg = get('leftUpperLeg');
    const rightUpperLeg = get('rightUpperLeg');
    if (leftUpperLeg) leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, Math.sin(time * 0.6) * 0.02, 0.05);
    if (rightUpperLeg) rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, Math.sin(time * 0.6 + Math.PI) * 0.02, 0.05);

    // BRAÇOS: pequenos movimentos naturais (mãos relaxadas)
    const leftLowerArm = get('leftLowerArm');
    const rightLowerArm = get('rightLowerArm');
    if (leftLowerArm) leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, Math.sin(time) * 0.02, 0.05);
    if (rightLowerArm) rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, Math.sin(time + 1) * 0.02, 0.05);
  }
};
