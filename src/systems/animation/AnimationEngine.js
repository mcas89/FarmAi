const applyBone = (boneName, axes, side) => {
            const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
            if (!bone) return;

            if (!inst.smoothedPose[boneName]) inst.smoothedPose[boneName] = { x: 0, y: 0, z: 0 };

            let actionTargetPose = null;
            let actionLerp = 0.1;
            
            if (side === 'left') {
                actionTargetPose = actionStates.left.targetPose;
                actionLerp = actionStates.left.lerpFactor;
            } else if (side === 'right') {
                actionTargetPose = actionStates.right.targetPose;
                actionLerp = actionStates.right.lerpFactor;
            } else if (side === 'body') {
                // CORREÇÃO: Permite que pernas e quadril puxem a pose do braço que está farmando!
                if (actionStates.left.targetPose && actionStates.left.targetPose !== 'IDLE') {
                    actionTargetPose = actionStates.left.targetPose;
                    actionLerp = actionStates.left.lerpFactor;
                } else if (actionStates.right.targetPose && actionStates.right.targetPose !== 'IDLE') {
                    actionTargetPose = actionStates.right.targetPose;
                    actionLerp = actionStates.right.lerpFactor;
                }
            }
            
            // Se não há ação, a BasePose assume.
            const targetPoseName = actionTargetPose || inst.currentBasePose;

            axes.forEach(axis => {
                const targetValue = getPoseValue(targetPoseName, boneName, axis);
                
                inst.smoothedPose[boneName][axis] = THREE.MathUtils.lerp(
                    inst.smoothedPose[boneName][axis], 
                    targetValue, 
                    actionLerp
                );

                const brainOffset = (brainOffsets[boneName] && brainOffsets[boneName][axis] !== undefined) ? brainOffsets[boneName][axis] : 0;

                let walkOffset = 0;
                if (walkData && walkData.offsets[boneName] && walkData.offsets[boneName][axis] !== undefined) {
                    const isFarmingThisSide = (side === 'left' && actionTargetPose) || (side === 'right' && actionTargetPose);
                    if (!isFarmingThisSide) {
                        walkOffset = walkData.offsets[boneName][axis] * walkData.weight;
                    }
                }

                const lifeOffset = (lifeOffsets[boneName] && lifeOffsets[boneName][axis] !== undefined) ? lifeOffsets[boneName][axis] : 0;

                bone.rotation[axis] = inst.smoothedPose[boneName][axis] + brainOffset + walkOffset + lifeOffset;
            });
        };
