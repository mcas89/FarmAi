/**
 * Passo do Jamal — coreografia correta:
 *   1,2 normal  →  1,2,3 rápido  →  (repete)
 *
 * Poses: 1=esquerda, 2=direita, 3=esquerda
 * Transições suaves (ease + bounce) entre cada passo.
 */

const LEFT = {
  hips: { x: 0, y: -0.2618, z: 0.2443 },
  chest: { x: 0.02, y: -0.13, z: 0.1 },
  head: { x: -0.2269, y: 0.2094, z: -0.1745 },
  leftShoulder: { x: -0.5411, y: -0.2967, z: -0.2094 },
  leftUpperArm: { x: 0.3316, y: -0.9076, z: -0.4014 },
  leftLowerArm: { x: 0, y: -1.1694, z: 0.2443 },
  leftHand: { x: 0.05, y: -0.12, z: -0.18 },
  rightShoulder: { x: -0.2, y: 0.12, z: 0.15 },
  rightUpperArm: { x: 0.2967, y: -0.0873, z: 0.5934 },
  rightLowerArm: { x: 0, y: 1.1519, z: 0.8203 },
  rightHand: { x: 0.04, y: 0.08, z: 0.22 },
  leftUpperLeg: { x: -1.35, y: 0.0524, z: 0.1571 },
  leftLowerLeg: { x: 1.55, y: -0.0524, z: 0.0175 },
  leftFoot: { x: 0.35, y: 0, z: 0.04 },
  leftToes: { x: 0.05, y: 0, z: 0 },
  rightUpperLeg: { x: 0.08, y: 0.04, z: -0.1 },
  rightLowerLeg: { x: 0.12, y: 0, z: 0 },
  rightFoot: { x: -0.12, y: 0, z: 0 },
  rightToes: { x: 0.04, y: 0, z: 0 },
  hipsPosition: { x: -0.008, y: 0.002, z: 0.004 },
};

const RIGHT = {
  hips: { x: 0, y: 0.2618, z: -0.2443 },
  chest: { x: 0.02, y: 0.13, z: -0.1 },
  head: { x: -0.2269, y: -0.2094, z: 0.1745 },
  rightShoulder: { x: -0.5411, y: 0.2967, z: 0.2094 },
  rightUpperArm: { x: 0.3316, y: 0.9076, z: 0.4014 },
  rightLowerArm: { x: 0, y: 1.1694, z: -0.2443 },
  rightHand: { x: 0.05, y: 0.12, z: 0.18 },
  leftShoulder: { x: -0.2, y: -0.12, z: -0.15 },
  leftUpperArm: { x: 0.2967, y: 0.0873, z: -0.5934 },
  leftLowerArm: { x: 0, y: -1.1519, z: -0.8203 },
  leftHand: { x: 0.04, y: -0.08, z: -0.22 },
  rightUpperLeg: { x: -1.35, y: -0.0524, z: -0.1571 },
  rightLowerLeg: { x: 1.55, y: 0.0524, z: -0.0175 },
  rightFoot: { x: 0.35, y: 0, z: -0.04 },
  rightToes: { x: 0.05, y: 0, z: 0 },
  leftUpperLeg: { x: 0.08, y: -0.04, z: 0.1 },
  leftLowerLeg: { x: 0.12, y: 0, z: 0 },
  leftFoot: { x: -0.12, y: 0, z: 0 },
  leftToes: { x: 0.04, y: 0, z: 0 },
  hipsPosition: { x: 0.008, y: 0.002, z: 0.004 },
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpVec(a = { x: 0, y: 0, z: 0 }, b = { x: 0, y: 0, z: 0 }, t) {
  return {
    x: lerp(a.x ?? 0, b.x ?? 0, t),
    y: lerp(a.y ?? 0, b.y ?? 0, t),
    z: lerp(a.z ?? 0, b.z ?? 0, t),
  };
}

function lerpPose(a, b, t) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = {};
  for (const k of keys) {
    out[k] = lerpVec(a[k], b[k], t);
  }
  const bounce = Math.sin(t * Math.PI) * 0.028;
  out.hipsPosition = {
    ...out.hipsPosition,
    y: (out.hipsPosition?.y ?? 0) + bounce,
  };
  const kneeKick = Math.sin(t * Math.PI) * 0.12;
  if (t < 0.5) {
    out.leftUpperLeg = {
      ...out.leftUpperLeg,
      x: (out.leftUpperLeg?.x ?? 0) - kneeKick * 0.35,
    };
  } else {
    out.rightUpperLeg = {
      ...out.rightUpperLeg,
      x: (out.rightUpperLeg?.x ?? 0) - kneeKick * 0.35,
    };
  }
  return out;
}

/** Um passo: transição from → to + leve hold na pose de chegada. */
function buildStep(from, to, { steps, moveDur, holdDur, label }) {
  const frames = [];
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    frames.push({
      name: `${label} move ${i}/${steps}`,
      duration: moveDur,
      pose: lerpPose(from, to, easeInOutCubic(u)),
    });
  }
  frames.push({
    name: `${label} hold`,
    duration: holdDur,
    pose: { ...to, hipsPosition: { ...to.hipsPosition } },
  });
  return frames;
}

/**
 * Ciclo completo da dança:
 *   normal: 1(L), 2(R)
 *   rápido: 1(L), 2(R), 3(L)
 */
export const jamalFrames = [
  // —— NORMAL (mais lento) ——
  ...buildStep(RIGHT, LEFT, {
    steps: 8,
    moveDur: 0.048,
    holdDur: 0.1,
    label: 'Normal 1',
  }),
  ...buildStep(LEFT, RIGHT, {
    steps: 8,
    moveDur: 0.048,
    holdDur: 0.1,
    label: 'Normal 2',
  }),
  // —— RÁPIDO ——
  ...buildStep(RIGHT, LEFT, {
    steps: 5,
    moveDur: 0.03,
    holdDur: 0.045,
    label: 'Rápido 1',
  }),
  ...buildStep(LEFT, RIGHT, {
    steps: 5,
    moveDur: 0.03,
    holdDur: 0.045,
    label: 'Rápido 2',
  }),
  ...buildStep(RIGHT, LEFT, {
    steps: 5,
    moveDur: 0.03,
    holdDur: 0.045,
    label: 'Rápido 3',
  }),
];

export const jamalKeyPoses = { LEFT, RIGHT };
