import * as THREE from 'three';
import { getPoseValue } from './PoseRegistry';
import { CharacterBrain } from './CharacterBrain';
import { LifeAnimation } from './LifeAnimation';
import { WalkAnimation } from './WalkAnimation';
import { SixSevenAction } from './SixSevenAction';

/**
 * AnimationEngine
 * Mestre da Integração Matemático-Acumulativa.
 * 
 * Ordem estrita de prioridades:
 * 1. Current Base Pose
 * 2. Character Brain
 * 3. Walk Animation
 * 4. Life Animation
 * 5/6. Left/Right Arm Actions
 */

const engineInstances = {};

const getEngineInstance = (uuid) => {
    if (!engineInstances[uuid]) {
        engineInstances[uuid] = {
            smoothedPose: {},
            currentBasePose: 'arms_down_pose'
        };
    }
    return engineInstances[uuid];
};

export const AnimationEngine = {
    setBasePose: (poseName, uuid = 'default') => { 
        getEngineInstance(uuid).currentBasePose = poseName; 
    },
    
    update: (vrm, delta, isLeftFarming, isRightFarming, isMoving = false, isIdle = false, isRunning = false) => {
        if (!vrm || !vrm.humanoid) return;

        const uuid = vrm.scene.uuid;
        const inst = getEngineInstance(uuid);

        // PRIO 5/6: Consulta estado atual das ações do usuário
        const actionStates = SixSevenAction.update(delta, isLeftFarming, isRightFarming, uuid);
        
        // PRIO 2: O Cérebro toma decisões do momento (olhar, respirar fundo, idle animations)
        const brainOffsets = CharacterBrain.update(delta, isIdle);

        // PRIO 3: Caminhada (Gerador procedural das pernas e braços)
        const walkData = WalkAnimation.getOffsets(delta, isMoving, isRunning);

        // PRIO 4: A Vida oscila de forma autônoma
        const lifeOffsets = LifeAnimation.getOffsets(delta, brainOffsets.breathMultiplier);

        const applyBone = (boneName, axes, side) => {
            const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
            if (!bone) return;

            if (!inst.smoothedPose[boneName]) inst.smoothedPose[boneName] = { x: 0, y: 0, z: 0 };

            // Verifica quem dita a "Camada 1" deste osso baseado no Lado.
            let actionTargetPose = null;
            let actionLerp = 0.1;
            
            if (side === 'left') {
                actionTargetPose = actionStates.left.targetPose;
                actionLerp = actionStates.left.lerpFactor;
            } else if (side === 'right') {
                actionTargetPose = actionStates.right.targetPose;
                actionLerp = actionStates.right.lerpFactor;
            }
            
            // Se o braço não está em ação, ou é um osso do corpo central, a BasePose assume.
            const targetPoseName = actionTargetPose || inst.currentBasePose;

            axes.forEach(axis => {
                // [PRIO 1] - O valor absoluto intocável da pose
                const targetValue = getPoseValue(targetPoseName, boneName, axis);
                
                // Interpola para suavizar a transição de qualquer estado para outro
                inst.smoothedPose[boneName][axis] = THREE.MathUtils.lerp(
                    inst.smoothedPose[boneName][axis], 
                    targetValue, 
                    actionLerp
                );

                // [PRIO 2] - Puxa o offset do cérebro
                const brainOffset = (brainOffsets[boneName] && brainOffsets[boneName][axis] !== undefined)
                    ? brainOffsets[boneName][axis]
                    : 0;

                // [PRIO 3] - Puxa o offset da caminhada
                let walkOffset = 0;
                if (walkData && walkData.offsets[boneName] && walkData.offsets[boneName][axis] !== undefined) {
                    // O braço só balança pela caminhada se NÃO estiver farmando!
                    const isFarmingThisSide = (side === 'left' && actionTargetPose) || (side === 'right' && actionTargetPose);
                    if (!isFarmingThisSide) {
                        walkOffset = walkData.offsets[boneName][axis] * walkData.weight;
                    }
                }

                // [PRIO 4] - Puxa a oscilação ininterrupta de vida
                const lifeOffset = (lifeOffsets[boneName] && lifeOffsets[boneName][axis] !== undefined) 
                    ? lifeOffsets[boneName][axis] 
                    : 0;

                // A MATEMÁTICA FINAL ACUMULATIVA (Nenhuma camada apaga a outra)
                bone.rotation[axis] = inst.smoothedPose[boneName][axis] + brainOffset + walkOffset + lifeOffset;
            });
        };

        // ==========================================
        // DESLOCAMENTOS DE POSIÇÃO (Eixo Y para Agachamentos)
        // ==========================================
        const hipsBone = vrm.humanoid.getNormalizedBoneNode('hips');
        if (hipsBone) {
            if (hipsBone.userData.baseY === undefined) hipsBone.userData.baseY = hipsBone.position.y;
            const brainHipsY = brainOffsets.hipsPosY || 0;
            hipsBone.position.y = hipsBone.userData.baseY + brainHipsY;
        }

        // CORPO CENTRAL
        applyBone('hips', ['x', 'y', 'z'], 'body');
        applyBone('chest', ['x', 'y', 'z'], 'body');
        applyBone('neck', ['x', 'y', 'z'], 'body');
        applyBone('head', ['x', 'y', 'z'], 'body');
        
        // BRAÇO ESQUERDO
        applyBone('leftShoulder', ['x', 'y', 'z'], 'left');
        applyBone('leftUpperArm', ['x', 'y', 'z'], 'left');
        applyBone('leftLowerArm', ['x', 'y', 'z'], 'left');
        applyBone('leftHand', ['x', 'y', 'z'], 'left');
        
        // BRAÇO DIREITO
        applyBone('rightShoulder', ['x', 'y', 'z'], 'right');
        applyBone('rightUpperArm', ['x', 'y', 'z'], 'right');
        applyBone('rightLowerArm', ['x', 'y', 'z'], 'right');
        applyBone('rightHand', ['x', 'y', 'z'], 'right');

        // PERNAS
        applyBone('leftUpperLeg', ['x', 'y', 'z'], 'body');
        applyBone('leftLowerLeg', ['x', 'y', 'z'], 'body');
        applyBone('rightUpperLeg', ['x', 'y', 'z'], 'body');
        applyBone('rightLowerLeg', ['x', 'y', 'z'], 'body');
    }
};
