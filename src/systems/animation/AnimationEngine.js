import * as THREE from 'three';
import { getPoseValue } from './PoseRegistry';
import { CharacterBrain } from './CharacterBrain';
import { LifeAnimation } from './LifeAnimation';
import { WalkAnimation } from './WalkAnimation';
import { SixSevenAction } from './SixSevenAction';
import { JamalAction } from './JamalAction';

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
    
    update: (vrm, delta, isLeftFarming, isRightFarming, isMoving = false, isIdle = false, isRunning = false, comboCount = 0, farmMode = 'six_seven') => {
        if (!vrm || !vrm.humanoid) return;

        const uuid = vrm.scene.uuid;
        const inst = getEngineInstance(uuid);

        // PRIO 5/6: ação de farm conforme modo selecionado
        const actionStates =
            farmMode === 'passo_jamal'
                ? JamalAction.update(delta, isLeftFarming, isRightFarming, comboCount, uuid)
                : SixSevenAction.update(delta, isLeftFarming, isRightFarming, comboCount, uuid);
        
        // PRIO 2: O Cérebro toma decisões do momento (olhar, respirar fundo, idle animations)
        const brainOffsets = CharacterBrain.update(delta, isIdle);

        // PRIO 3: Caminhada (Gerador procedural das pernas e braços)
        const walkData = WalkAnimation.getOffsets(delta, isMoving, isRunning, uuid);

        // PRIO 4: A Vida oscila de forma autônoma
        const lifeOffsets = LifeAnimation.getOffsets(delta, brainOffsets.breathMultiplier, isIdle);

        // Idle "vida" e walk ambos subtraem a pose base — somar os dois no
        // movimento gira o quadril/pernas (~15°) e parece deslize lateral.
        const lifeFade = 1 - (walkData?.weight || 0);

        const applyBone = (boneName, axes, side, lerpOverride) => {
            const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
            if (!bone) return;

            if (!inst.smoothedPose[boneName]) inst.smoothedPose[boneName] = { x: 0, y: 0, z: 0 };

            // Verifica quem dita a "Camada 1" deste osso baseado no Lado.
            let actionTargetPose = null;
            let actionLerp = lerpOverride || 0.1;
            
            if (side === 'left' && actionStates.left) {
                actionTargetPose = actionStates.left.targetPose;
                actionLerp = actionStates.left.lerpFactor;
            } else if (side === 'right' && actionStates.right) {
                actionTargetPose = actionStates.right.targetPose;
                actionLerp = actionStates.right.lerpFactor;
            } else if (side === 'body' && actionStates.body) {
                actionTargetPose = actionStates.body.targetPose;
                actionLerp = actionStates.body.lerpFactor;
            }
            
            // Se o braço não está em ação, ou a ação retornou null para ele, a BasePose assume.
            const targetPoseName = actionTargetPose || inst.currentBasePose;

            axes.forEach(axis => {
                // [PRIO 1] - O valor absoluto intocável da pose
                let targetValue;
                if (typeof targetPoseName === 'string') {
                    targetValue = getPoseValue(targetPoseName, boneName, axis);
                } else if (targetPoseName && targetPoseName[boneName] && targetPoseName[boneName][axis] !== undefined) {
                    targetValue = targetPoseName[boneName][axis];
                } else {
                    targetValue = getPoseValue(inst.currentBasePose, boneName, axis);
                }
                
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

                // [PRIO 4] - Vida (some ao andar para não brigar com o walk)
                const lifeOffset = (lifeOffsets[boneName] && lifeOffsets[boneName][axis] !== undefined) 
                    ? lifeOffsets[boneName][axis] * lifeFade
                    : 0;

                // A MATEMÁTICA FINAL ACUMULATIVA (Nenhuma camada apaga a outra)
                bone.rotation[axis] = inst.smoothedPose[boneName][axis] + brainOffset + walkOffset + lifeOffset;
            });
        };

        // ==========================================
        // DESLOCAMENTOS DE POSIÇÃO (Eixo Y para Agachamentos e Passos)
        // ==========================================
        const hipsBone = vrm.humanoid.getNormalizedBoneNode('hips');
        if (hipsBone) {
            if (hipsBone.userData.baseY === undefined) hipsBone.userData.baseY = hipsBone.position.y;
            if (hipsBone.userData.baseX === undefined) hipsBone.userData.baseX = hipsBone.position.x;
            if (hipsBone.userData.baseZ === undefined) hipsBone.userData.baseZ = hipsBone.position.z;
            
            const brainHipsY = brainOffsets.hipsPosY || 0;
            
            let walkHipsY = 0;
            if (walkData && walkData.offsets && walkData.offsets.hipsPosition && walkData.offsets.hipsPosition.y !== undefined) {
                walkHipsY = walkData.offsets.hipsPosition.y * walkData.weight;
            }

            // Puxa o hipsPosition do json se a ação body prover
            let actionHipsX = 0, actionHipsY = 0, actionHipsZ = 0;
            if (actionStates.body && actionStates.body.targetPose && actionStates.body.targetPose.hipsPosition) {
                actionHipsX = actionStates.body.targetPose.hipsPosition.x || 0;
                actionHipsY = actionStates.body.targetPose.hipsPosition.y || 0;
                actionHipsZ = actionStates.body.targetPose.hipsPosition.z || 0;
            }
            
            hipsBone.position.x = hipsBone.userData.baseX + actionHipsX;
            hipsBone.position.y = hipsBone.userData.baseY + brainHipsY + walkHipsY + actionHipsY;
            hipsBone.position.z = hipsBone.userData.baseZ + actionHipsZ;
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
        // lerp mais rápido que o padrão (0.1) — pernas com giro grande (ex: pos2)
        // não tinham tempo de chegar na extensão total antes do próximo passo do
        // passinho, então nunca ficavam retas / pareciam voltar antes de esticar.
        const LEG_LERP = farmMode === 'passo_jamal' ? 0.42 : 0.22;
        applyBone('leftUpperLeg', ['x', 'y', 'z'], 'body', LEG_LERP);
        applyBone('leftLowerLeg', ['x', 'y', 'z'], 'body', LEG_LERP);
        applyBone('rightUpperLeg', ['x', 'y', 'z'], 'body', LEG_LERP);
        applyBone('rightLowerLeg', ['x', 'y', 'z'], 'body', LEG_LERP);
        applyBone('leftFoot', ['x', 'y', 'z'], 'body', LEG_LERP);
        applyBone('rightFoot', ['x', 'y', 'z'], 'body', LEG_LERP);
        applyBone('leftToes', ['x', 'y', 'z'], 'body', LEG_LERP);
        applyBone('rightToes', ['x', 'y', 'z'], 'body', LEG_LERP);
    }
};
