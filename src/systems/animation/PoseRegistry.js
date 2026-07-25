export const Poses = {
    // Pose base (neutra/descanso)
    arms_down_pose: {
        hips: { x: 0, y: -0.27, z: 0 },
        leftShoulder: { z: -0.39 },
        leftUpperArm: { z: -0.6 },
        leftLowerArm: { z: -0.24 },
        rightShoulder: { z: 0.36, y: 0.09 },
        rightUpperArm: { z: 0.65 },
        rightLowerArm: { z: 0.33 }
    },

    // Six Seven: Frame 01
    six_seven_ready_pose: {
        hips: { x: 0.18, y: -0.27, z: 0 },
        leftShoulder: { x: -1.59 },
        rightShoulder: { x: -1.85 },
        leftUpperArm: { y: 1.25 },
        rightUpperArm: { y: -1.32, z: 0.3 },
        leftLowerArm: { x: 0.39, z: -1.82 },
        rightLowerArm: { z: 0.12 },
        chest: { z: -0.12 }
    },

    // Six Seven: Frame 02 (Valores mockados para serem ajustados depois)
    six_seven_left_arm_high_pose: {
        hips: { x: 0.18, y: -0.27, z: 0 },
        leftShoulder: { x: -1.7 },
        rightShoulder: { x: -1.85 },
        leftUpperArm: { y: 1.25, z: 0.5 },
        rightUpperArm: { y: -1.32, z: 0.3 },
        leftLowerArm: { x: 0.4, z: -2.0 },
        rightLowerArm: { z: 0.12 },
        chest: { z: -0.12 }
    },

    // Six Seven: Frame 03
    six_seven_cross_limit_pose: {
        hips: { x: 0.18, y: -0.27, z: 0 },
        leftShoulder: { x: -1.5 },
        rightShoulder: { x: -1.5 },
        leftUpperArm: { y: 0.5 },
        rightUpperArm: { y: -0.5 },
        leftLowerArm: { x: 0.8, z: -1.0 },
        rightLowerArm: { x: 0.8, z: 1.0 },
        chest: { z: -0.12 }
    },

    // Six Seven: Frame 04
    six_seven_reverse_limit_pose: {
        hips: { x: 0.18, y: -0.27, z: 0 },
        leftShoulder: { x: -1.9 },
        rightShoulder: { x: -1.9 },
        leftUpperArm: { y: 1.8 },
        rightUpperArm: { y: -1.8 },
        leftLowerArm: { x: 0.0, z: -2.2 },
        rightLowerArm: { x: 0.0, z: 2.2 },
        chest: { z: -0.12 }
    }
};

export function getPoseValue(poseName, boneName, axis) {
    const pose = Poses[poseName];
    if (!pose || !pose[boneName] || pose[boneName][axis] === undefined) {
        return 0; 
    }
    return pose[boneName][axis];
}
