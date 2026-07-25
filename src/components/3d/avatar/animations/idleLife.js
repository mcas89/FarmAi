import * as THREE from 'three';
import calibrationData from './sixSeven_pose_01_full_body.json';

/**
 * IDLE LIFE CONTROLLER
 * 
 * Responsável EXCLUSIVAMENTE por dar vida ao personagem quando parado.
 * 
 * Bones controlados pelo Idle (NÃO toca nos bones do farm):
 *   - head, neck, chest, spine, hips
 *   - leftUpperLeg, rightUpperLeg, leftLowerLeg, rightLowerLeg
 * 
 * Bones que o Idle NÃO mexe (reservados para o FarmController):
 *   - leftShoulder, rightShoulder
 *   - leftUpperArm, rightUpperArm
 *   - leftLowerArm, rightLowerArm
 *   - leftHand, rightHand
 */

let idleTime = 0;

export function updateIdle(vrm, delta) {
  if (!vrm || !vrm.humanoid) return;

  idleTime += delta;
  const t = idleTime;

  const get = (name) => vrm.humanoid.getNormalizedBoneNode(name);

  // === HEAD – olhar ao redor suavemente ===
  const head = get('head');
  if (head) {
    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, Math.sin(t * 0.3) * 0.06, 0.05);
    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, Math.sin(t * 0.2 + 1) * 0.03, 0.05);
  }

  // === NECK – segue a cabeça com atraso ===
  const neck = get('neck');
  if (neck) {
    neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, Math.sin(t * 0.3) * 0.03, 0.04);
  }

  // === CHEST – respiração ===
  const chest = get('chest');
  const baseChestZ = calibrationData.chest?.z || 0;
  if (chest) {
    const breath = Math.sin(t * 1.2) * 0.025;
    chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, breath, 0.08);
    chest.rotation.z = THREE.MathUtils.lerp(chest.rotation.z, baseChestZ, 0.05);
  }

  // === HIPS – balanço suave lateral ===
  const hips = get('hips');
  const baseHipsX = calibrationData.hips?.x || 0;
  const baseHipsY = calibrationData.hips?.y || 0;
  if (hips) {
    const sway = Math.sin(t * 0.4) * 0.03;
    hips.rotation.x = THREE.MathUtils.lerp(hips.rotation.x, baseHipsX, 0.05);
    hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, baseHipsY + sway, 0.05);
  }

  // === LEGS – transferência de peso ===
  const leftUpperLeg = get('leftUpperLeg');
  const rightUpperLeg = get('rightUpperLeg');
  const leftLowerLeg = get('leftLowerLeg');
  const rightLowerLeg = get('rightLowerLeg');

  const legSwing = Math.sin(t * 0.5) * 0.025;
  const baseLULx = calibrationData.leftUpperLeg?.x || 0;
  const baseLLLx = calibrationData.leftLowerLeg?.x || 0;

  if (leftUpperLeg) {
    leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, baseLULx + legSwing, 0.05);
  }
  if (rightUpperLeg) {
    rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, -legSwing, 0.05);
  }
  if (leftLowerLeg) {
    leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, baseLLLx + legSwing * 0.5, 0.05);
  }
  if (rightLowerLeg) {
    rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, -legSwing * 0.5, 0.05);
  }
}
