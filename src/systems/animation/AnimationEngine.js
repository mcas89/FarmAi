import * as THREE from 'three';

import { getPoseValue } from './PoseRegistry';
import { CharacterBrain } from './CharacterBrain';
import { LifeAnimation } from './LifeAnimation';
import { WalkAnimation } from './WalkAnimation';
import { SixSevenAction } from './SixSevenAction';

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

    setBasePose: (
        poseName,
        uuid = 'default'
    ) => {

        getEngineInstance(uuid)
            .currentBasePose = poseName;
    },

    update: (
        vrm,
        delta,
        isLeftFarming,
        isRightFarming,
        isMoving = false,
        isIdle = false,
        isRunning = false
    ) => {

        if (!vrm || !vrm.humanoid) {
            return;
        }

        const uuid =
            vrm.scene.uuid;

        const inst =
            getEngineInstance(uuid);

        // ====================================================
        // FARMING
        // ====================================================

        const isFarming =
            isLeftFarming ||
            isRightFarming;

        // ====================================================
        // SIX SEVEN
        // ====================================================

        const actionStates =
            SixSevenAction.update(
                delta,
                isLeftFarming,
                isRightFarming,
                uuid
            );

        // ====================================================
        // CHARACTER BRAIN
        // ====================================================

        const brainOffsets =
            CharacterBrain.update(
                delta,
                isIdle
            );

        // ====================================================
        // WALK
        // ====================================================

        const walkData =
            WalkAnimation.getOffsets(
                delta,
                isMoving,
                isRunning
            );

        // ====================================================
        // LIFE + BODY PROGRESSION
        // ====================================================

        const lifeOffsets =
            LifeAnimation.getOffsets(
                delta,
                brainOffsets.breathMultiplier,
                isFarming
            );

        // ====================================================
        // APLICAÇÃO DE OSSO
        // ====================================================

        const applyBone = (
            boneName,
            axes,
            side
        ) => {

            const bone =
                vrm.humanoid
                    .getNormalizedBoneNode(
                        boneName
                    );

            if (!bone) {
                return;
            }

            if (
                !inst.smoothedPose[boneName]
            ) {

                inst.smoothedPose[boneName] = {
                    x: 0,
                    y: 0,
                    z: 0
                };
            }

            // ------------------------------------------------
            // SIX SEVEN
            // ------------------------------------------------

            let actionTargetPose = null;

            let actionLerp = 0.1;

            if (side === 'left') {

                actionTargetPose =
                    actionStates.left.targetPose;

                actionLerp =
                    actionStates.left.lerpFactor;
            }

            else if (side === 'right') {

                actionTargetPose =
                    actionStates.right.targetPose;

                actionLerp =
                    actionStates.right.lerpFactor;
            }

            // ------------------------------------------------
            // POSE BASE
            // ------------------------------------------------

            const targetPoseName =
                actionTargetPose ||
                inst.currentBasePose;

            axes.forEach((axis) => {

                // --------------------------------------------
                // POSE ABSOLUTA
                // --------------------------------------------

                const targetValue =
                    getPoseValue(
                        targetPoseName,
                        boneName,
                        axis
                    );

                // --------------------------------------------
                // INTERPOLAÇÃO
                // --------------------------------------------

                inst.smoothedPose[boneName][axis] =
                    THREE.MathUtils.lerp(
                        inst.smoothedPose[boneName][axis],
                        targetValue,
                        actionLerp
                    );

                // --------------------------------------------
                // CHARACTER BRAIN
                // --------------------------------------------

                const brainOffset =
                    (
                        brainOffsets[boneName] &&
                        brainOffsets[boneName][axis] !== undefined
                    )
                        ? brainOffsets[boneName][axis]
                        : 0;

                // --------------------------------------------
                // WALK
                // --------------------------------------------

                let walkOffset = 0;

                if (
                    walkData &&
                    walkData.offsets &&
                    walkData.offsets[boneName] &&
                    walkData.offsets[boneName][axis] !== undefined
                ) {

                    const isFarmingThisSide =
                        (
                            side === 'left' &&
                            actionTargetPose
                        )
                        ||
                        (
                            side === 'right' &&
                            actionTargetPose
                        );

                    // Nunca interfere no braço durante Six Seven
                    if (!isFarmingThisSide) {

                        walkOffset =
                            walkData.offsets[boneName][axis] *
                            walkData.weight;
                    }
                }

                // --------------------------------------------
                // LIFE
                // --------------------------------------------

                const lifeOffset =
                    (
                        lifeOffsets[boneName] &&
                        lifeOffsets[boneName][axis] !== undefined
                    )
                        ? lifeOffsets[boneName][axis]
                        : 0;

                // --------------------------------------------
                // RESULTADO FINAL
                // --------------------------------------------

                bone.rotation[axis] =
                    inst.smoothedPose[boneName][axis]
                    +
                    brainOffset
                    +
                    walkOffset
                    +
                    lifeOffset;
            });
        };

        // ====================================================
        // POSIÇÃO VERTICAL DO QUADRIL
        // ====================================================

        const hipsBone =
            vrm.humanoid
                .getNormalizedBoneNode(
                    'hips'
                );

        if (hipsBone) {

            if (
                hipsBone.userData.baseY === undefined
            ) {

                hipsBone.userData.baseY =
                    hipsBone.position.y;
            }

            const brainHipsY =
                brainOffsets.hipsPosY || 0;

            hipsBone.position.y =
                hipsBone.userData.baseY +
                brainHipsY;
        }

        // ====================================================
        // CORPO CENTRAL
        // ====================================================

        applyBone(
            'hips',
            ['x', 'y', 'z'],
            'body'
        );

        applyBone(
            'chest',
            ['x', 'y', 'z'],
            'body'
        );

        applyBone(
            'neck',
            ['x', 'y', 'z'],
            'body'
        );

        applyBone(
            'head',
            ['x', 'y', 'z'],
            'body'
        );

        // ====================================================
        // BRAÇO ESQUERDO
        // ====================================================

        applyBone(
            'leftShoulder',
            ['x', 'y', 'z'],
            'left'
        );

        applyBone(
            'leftUpperArm',
            ['x', 'y', 'z'],
            'left'
        );

        applyBone(
            'leftLowerArm',
            ['x', 'y', 'z'],
            'left'
        );

        applyBone(
            'leftHand',
            ['x', 'y', 'z'],
            'left'
        );

        // ====================================================
        // BRAÇO DIREITO
        // ====================================================

        applyBone(
            'rightShoulder',
            ['x', 'y', 'z'],
            'right'
        );

        applyBone(
            'rightUpperArm',
            ['x', 'y', 'z'],
            'right'
        );

        applyBone(
            'rightLowerArm',
            ['x', 'y', 'z'],
            'right'
        );

        applyBone(
            'rightHand',
            ['x', 'y', 'z'],
            'right'
        );

        // ====================================================
        // PERNAS
        // ====================================================

        applyBone(
            'leftUpperLeg',
            ['x', 'y', 'z'],
            'body'
        );

        applyBone(
            'leftLowerLeg',
            ['x', 'y', 'z'],
            'body'
        );

        applyBone(
            'rightUpperLeg',
            ['x', 'y', 'z'],
            'body'
        );

        applyBone(
            'rightLowerLeg',
            ['x', 'y', 'z'],
            'body'
        );
    }
};
