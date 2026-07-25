import * as THREE from 'three';
import calibrationData from './sixSeven_pose_01_full_body.json';

/**
 * FARM SIX SEVEN CONTROLLER
 * 
 * Responsável EXCLUSIVAMENTE pela animação de farm (puxar energia).
 * 
 * Bones controlados pelo Farm:
 *   - leftLowerArm, rightLowerArm  (PRIORIDADE - movimento principal)
 *   - leftHand, rightHand           (PRIORIDADE - finalização do gesto)
 *   - leftUpperArm, rightUpperArm   (acompanhamento leve)
 *   - leftShoulder, rightShoulder   (acompanhamento mínimo)
 * 
 * Bones que o Farm NÃO mexe (reservados para o IdleController):
 *   - head, neck, chest, spine, hips, legs
 * 
 * O movimento é: mãos afastam (posição A) -> mãos puxam para o corpo (posição B) -> loop
 */

let leftPhase = 0;
let rightPhase = 0;

// Base values from calibration
const BASE = {
  leftShoulder:  { x: calibrationData.leftShoulder?.x || 0 },
  rightShoulder: { x: calibrationData.rightShoulder?.x || 0 },
  leftUpperArm:  { x: calibrationData.leftUpperArm?.x || 0, y: calibrationData.leftUpperArm?.y || 0, z: calibrationData.leftUpperArm?.z || 0 },
  rightUpperArm: { y: calibrationData.rightUpperArm?.y || 0, z: calibrationData.rightUpperArm?.z || 0 },
  leftLowerArm:  { x: calibrationData.leftLowerArm?.x || 0, y: calibrationData.leftLowerArm?.y || 0, z: calibrationData.leftLowerArm?.z || 0 },
  rightLowerArm: { z: calibrationData.rightLowerArm?.z || 0 },
  leftHand:      { z: calibrationData.leftHand?.z || 0 },
  rightHand:     { z: calibrationData.rightHand?.z || 0 },
};

export function updateFarm(vrm, isLeft, isRight, level, delta) {
  if (!vrm || !vrm.humanoid) return;

  const get = (name) => vrm.humanoid.getNormalizedBoneNode(name);

  // Intensidade baseada no nível de aura
  const speedMul = level >= 5 ? 1.8 : (level >= 3 ? 1.4 : 1.0);
  const ampMul   = level >= 5 ? 1.3 : (level >= 3 ? 1.15 : 1.0);
  const farmSpeed = 12 * speedMul;

  // Atualizar fases
  if (isLeft)  leftPhase  += delta * farmSpeed;
  else         leftPhase  = THREE.MathUtils.lerp(leftPhase, 0, 0.12);

  if (isRight) rightPhase += delta * farmSpeed;
  else         rightPhase = THREE.MathUtils.lerp(rightPhase, 0, 0.12);

  const pullL = Math.sin(leftPhase);   // -1 (afastado) a 1 (puxado pro corpo)
  const pullR = Math.sin(rightPhase);

  const leftShoulder  = get('leftShoulder');
  const rightShoulder = get('rightShoulder');
  const leftUpperArm  = get('leftUpperArm');
  const rightUpperArm = get('rightUpperArm');
  const leftLowerArm  = get('leftLowerArm');
  const rightLowerArm = get('rightLowerArm');
  const leftHand      = get('leftHand');
  const rightHand     = get('rightHand');

  // =============================================
  // BRAÇO ESQUERDO
  // =============================================
  if (isLeft || leftPhase > 0.1) {
    const delayL = Math.sin(leftPhase - 0.4); // atraso orgânico pra antebraço/mão

    // 1. leftLowerArm – PRIORIDADE (puxada principal)
    if (leftLowerArm) {
      leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, BASE.leftLowerArm.z + (delayL * 0.5 * ampMul), 0.15);
      leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, BASE.leftLowerArm.x + (pullL * 0.3 * ampMul), 0.15);
    }

    // 2. leftHand – PRIORIDADE (finalização do gesto)
    if (leftHand) {
      leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, BASE.leftHand.z + (pullL * 0.35 * ampMul), 0.12);
    }

    // 3. leftUpperArm – acompanhamento leve
    if (leftUpperArm) {
      leftUpperArm.rotation.y = THREE.MathUtils.lerp(leftUpperArm.rotation.y, BASE.leftUpperArm.y - (pullL * 0.15 * ampMul), 0.1);
    }

    // 4. leftShoulder – acompanhamento mínimo
    if (leftShoulder) {
      leftShoulder.rotation.x = THREE.MathUtils.lerp(leftShoulder.rotation.x, BASE.leftShoulder.x + (pullL * 0.05 * ampMul), 0.08);
    }
  } else {
    // Retorno à pose calibrada
    if (leftLowerArm) {
      leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, BASE.leftLowerArm.z, 0.08);
      leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, BASE.leftLowerArm.x, 0.08);
    }
    if (leftHand)     leftHand.rotation.z     = THREE.MathUtils.lerp(leftHand.rotation.z, BASE.leftHand.z, 0.08);
    if (leftUpperArm) leftUpperArm.rotation.y = THREE.MathUtils.lerp(leftUpperArm.rotation.y, BASE.leftUpperArm.y, 0.08);
    if (leftShoulder) leftShoulder.rotation.x = THREE.MathUtils.lerp(leftShoulder.rotation.x, BASE.leftShoulder.x, 0.08);
  }

  // =============================================
  // BRAÇO DIREITO
  // =============================================
  if (isRight || rightPhase > 0.1) {
    const delayR = Math.sin(rightPhase - 0.4);

    // 1. rightLowerArm – PRIORIDADE
    if (rightLowerArm) {
      rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, BASE.rightLowerArm.z - (delayR * 0.5 * ampMul), 0.15);
    }

    // 2. rightHand – PRIORIDADE
    if (rightHand) {
      rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, BASE.rightHand.z - (pullR * 0.35 * ampMul), 0.12);
    }

    // 3. rightUpperArm – acompanhamento leve
    if (rightUpperArm) {
      rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, BASE.rightUpperArm.y + (pullR * 0.15 * ampMul), 0.1);
    }

    // 4. rightShoulder – acompanhamento mínimo
    if (rightShoulder) {
      rightShoulder.rotation.x = THREE.MathUtils.lerp(rightShoulder.rotation.x, BASE.rightShoulder.x + (pullR * 0.05 * ampMul), 0.08);
    }
  } else {
    if (rightLowerArm) rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, BASE.rightLowerArm.z, 0.08);
    if (rightHand)     rightHand.rotation.z     = THREE.MathUtils.lerp(rightHand.rotation.z, BASE.rightHand.z, 0.08);
    if (rightUpperArm) rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, BASE.rightUpperArm.y, 0.08);
    if (rightShoulder) rightShoulder.rotation.x = THREE.MathUtils.lerp(rightShoulder.rotation.x, BASE.rightShoulder.x, 0.08);
  }
}
