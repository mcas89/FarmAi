import calibrationData from './sixSeven_pose_01_full_body.json';
import { updateIdle } from './idleLife';
import { updateFarm } from './farmSixSeven';

/**
 * ANIMATION CONTROLLER
 * 
 * Arquitetura limpa:
 *   Avatar.jsx
 *     └── animationController
 *           ├── applyBasePose()     → aplica calibração JSON uma vez
 *           ├── updateIdle()        → head, neck, chest, hips, legs (sempre ativo)
 *           └── updateFarm()        → shoulders, arms, lowerArms, hands (só quando farming)
 * 
 * REGRA: cada bone é controlado por UM ÚNICO sistema.
 * Idle e Farm NUNCA mexem nos mesmos bones.
 */

let initialized = false;

function applyBasePose(vrm) {
  if (!vrm || !vrm.humanoid) return;

  const setBone = (boneName, data) => {
    const node = vrm.humanoid.getNormalizedBoneNode(boneName);
    if (node && data) {
      if (data.x !== undefined) node.rotation.x = data.x;
      if (data.y !== undefined) node.rotation.y = data.y;
      if (data.z !== undefined) node.rotation.z = data.z;
    }
  };

  // Aplica TODOS os bones da calibração
  Object.keys(calibrationData).forEach((boneName) => {
    setBone(boneName, calibrationData[boneName]);
  });

  console.log('[AnimController] Base pose applied. Bones found:');
  Object.keys(calibrationData).forEach((boneName) => {
    const node = vrm.humanoid.getNormalizedBoneNode(boneName);
    if (node) {
      console.log(`  ✅ ${boneName} → x:${node.rotation.x.toFixed(2)} y:${node.rotation.y.toFixed(2)} z:${node.rotation.z.toFixed(2)}`);
    } else {
      console.log(`  ❌ ${boneName} → NOT FOUND in VRM`);
    }
  });
}

export const animationController = {
  init: (vrm) => {
    if (!vrm) return;
    applyBasePose(vrm);
    initialized = true;
  },

  update: (vrm, isLeftFarming, isRightFarming, level, delta) => {
    if (!vrm || !vrm.humanoid) return;

    if (!initialized) {
      applyBasePose(vrm);
      initialized = true;
    }

    // 1️⃣ IDLE – corpo vivo (head, neck, chest, hips, legs)
    updateIdle(vrm, delta);

    // 2️⃣ FARM – puxar energia (shoulders, arms, lowerArms, hands)
    updateFarm(vrm, isLeftFarming, isRightFarming, level, delta);
  },
};
