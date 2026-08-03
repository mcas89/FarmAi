import { jamalFrames } from './jamalData';

const instances = {};

const getInstance = (uuid) => {
  if (!instances[uuid]) {
    instances[uuid] = {
      frameIndex: 0,
      frameTime: 0,
      cps: 0,
      prevComboCount: 0,
      timeSinceLastClick: 999,
    };
  }
  return instances[uuid];
};

/**
 * Passo do Jamal — respeita a coreografia embutida em jamalFrames:
 * 1,2 normal → 1,2,3 rápido → loop
 */
export const JamalAction = {
  update: (delta, isLeftFarming, isRightFarming, comboCount = 0, uuid = 'default') => {
    const inst = getInstance(uuid);
    const frames = jamalFrames;
    if (!frames.length) {
      return {
        left: { targetPose: null, lerpFactor: 0.2 },
        right: { targetPose: null, lerpFactor: 0.2 },
        body: { targetPose: null, lerpFactor: 0.2 },
      };
    }

    inst.timeSinceLastClick += delta;

    if (comboCount > inst.prevComboCount) {
      inst.cps += 1.0;
      inst.timeSinceLastClick = 0;
    }
    inst.prevComboCount = comboCount;
    const isInCombo = comboCount > 0;

    if (uuid !== 'default' && (isLeftFarming || isRightFarming)) {
      inst.cps = 1.6;
      inst.timeSinceLastClick = 0;
    }

    inst.cps = inst.cps * Math.pow(0.5, delta / 0.45);

    const lerpFactor = 0.62;

    if (inst.timeSinceLastClick > 0.5 && !isInCombo) {
      return {
        left: { targetPose: null, lerpFactor: 0.15 },
        right: { targetPose: null, lerpFactor: 0.15 },
        body: { targetPose: null, lerpFactor: 0.15 },
      };
    }

    if (comboCount < 4 && !(isLeftFarming || isRightFarming)) {
      return {
        left: { targetPose: null, lerpFactor },
        right: { targetPose: null, lerpFactor },
        body: { targetPose: null, lerpFactor },
      };
    }

    // Mantém a coreografia; CPS só acelera um pouco (não apaga normal vs rápido)
    const speed = 1 + Math.min(0.35, inst.cps * 0.12);
    inst.frameTime += delta * speed;

    let guard = 0;
    while (inst.frameTime >= frames[inst.frameIndex].duration && guard < 40) {
      inst.frameTime -= frames[inst.frameIndex].duration;
      inst.frameIndex = (inst.frameIndex + 1) % frames.length;
      guard++;
    }

    const pose = frames[inst.frameIndex].pose;
    const active = isInCombo || isLeftFarming || isRightFarming;

    return {
      left: { targetPose: active ? pose : null, lerpFactor },
      right: { targetPose: active ? pose : null, lerpFactor },
      body: { targetPose: active ? pose : null, lerpFactor },
    };
  },
};
