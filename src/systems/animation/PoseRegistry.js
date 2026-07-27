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

    // Six Seven: Frame 02 (mocked values)
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
    },

    // -------------------------------------------------
    // FASE 1 – Six Seven (braços "baixos")
    // -------------------------------------------------
    six_seven_left_down: {
        leftShoulder: { z: -0.08 },
        leftUpperArm: { z: -0.15, x: 0.02 },
        leftLowerArm: { z: -0.07 }
    },
    six_seven_right_down: {
        rightShoulder: { z: 0.08 },
        rightUpperArm: { z: 0.15, x: 0.02 },
        rightLowerArm: { z: 0.07 }
    },

    // -------------------------------------------------
    // FASE 2 – Reação de cabeça (primeira reação curta)
    // -------------------------------------------------
    reaction_head_left: {
        neck: { y: 0.10, z: -0.03 },
        head: { x: 0.04 }
    },

    // -------------------------------------------------
    // FASE 3 – Esticar a coluna
    // -------------------------------------------------
    stretch_spine: {
        spine: { x: -0.08 },
        chest: { x: -0.12 },
        upperChest: { x: -0.10 }
    },

    // -------------------------------------------------
    // FASE 4 – Primeiros sinais de cansaço
    // -------------------------------------------------
    tired_pose: {
        hips: { y: -0.29 },
        spine: { x: 0.12 },
        chest: { x: 0.10 },
        neck: { x: 0.15 }
    },

    // -------------------------------------------------
    // FASE 5 – Transferência de peso
    // -------------------------------------------------
    weight_left: {
        hips: { z: 0.07, x: 0.04 },
        spine: { z: -0.05 },
        leftUpperLeg: { z: -0.03 },
        rightUpperLeg: { z: 0.04 }
    },
    weight_right: {
        hips: { z: -0.07, x: 0.04 },
        spine: { z: 0.05 },
        leftUpperLeg: { z: 0.04 },
        rightUpperLeg: { z: -0.03 }
    },

    // -------------------------------------------------
    // FASE 6 – Levantamento de perna
    // -------------------------------------------------
    leg_lift_left: {
        leftUpperLeg: { x: -0.28 },
        leftLowerLeg: { x: 0.30 },
        leftFoot: { x: 0.18 }
    },
    leg_lift_right: {
        rightUpperLeg: { x: -0.28 },
        rightLowerLeg: { x: 0.30 },
        rightFoot: { x: 0.18 }
    },

    // -------------------------------------------------
    // FASE 7 – Giro de cintura
    // -------------------------------------------------
    twist_left: {
        spine: { y: 0.18 },
        chest: { y: 0.12 }
    },
    twist_right: {
        spine: { y: -0.18 },
        chest: { y: -0.12 }
    },

    // -------------------------------------------------
    // FASE 8 – Primeiro agachamento (leve)
    // -------------------------------------------------
    squat_light: {
        hips: { y: -0.34 },
        leftUpperLeg: { x: -0.14 },
        rightUpperLeg: { x: -0.14 },
        leftLowerLeg: { x: 0.13 },
        rightLowerLeg: { x: 0.13 },
        spine: { x: 0.08 }
    },

    // -------------------------------------------------
    // FASE 9 – Agachamento de esforço extremo (pose de luta)
    // -------------------------------------------------
    fight_squat_extreme: {
        hips: { y: -0.48 },
        leftUpperLeg: { x: -0.42, z: -0.12 },
        rightUpperLeg: { x: -0.42, z: 0.12 },
        leftLowerLeg: { x: 0.38 },
        rightLowerLeg: { x: 0.38 },
        spine: { x: 0.28 },
        neck: { x: -0.18 },
        leftShoulder: { z: -0.02 },
        rightShoulder: { z: 0.02 }
    },

    // -------------------------------------------------
    // FASE 10 – Recuperação / Esticamento
    // -------------------------------------------------
    recovery_pose: {
        hips: { y: -0.27 },
        leftUpperLeg: { x: -0.12 },
        rightUpperLeg: { x: -0.12 },
        leftLowerLeg: { x: 0.10 },
        rightLowerLeg: { x: 0.10 },
        spine: { x: 0.06 }
    },
    full_stretch_pose: {
        hips: { y: -0.27 },
        spine: { x: -0.22 },
        chest: { x: -0.22 },
        neck: { x: -0.10 },
        leftUpperLeg: { x: 0.05 },
        rightUpperLeg: { x: 0.05 }
    },

    // -------------------------------------------------
    // FASE 11 – Flutuação
    // -------------------------------------------------
    ascension_pose: {
        hips: { y: 0.08 },
        leftFoot: { x: 0.38 },
        rightFoot: { x: 0.38 }
    },
    float_final_pose: {
        hips: { y: 0.80 },
        spine: { x: -0.14 },
        chest: { x: -0.10 },
        neck: { x: 0.08 },
        leftUpperLeg: { x: 0.16, z: -0.05 },
        rightUpperLeg: { x: 0.16, z: 0.05 },
        leftLowerLeg: { x: 0.22 },
        rightLowerLeg: { x: 0.22 },
        leftFoot: { x: 0.60 },
        rightFoot: { x: 0.60 }
    }
};

export function getPoseValue(poseName, boneName, axis) {
    const pose = Poses[poseName];
    if (!pose || !pose[boneName] || pose[boneName][axis] === undefined) {
        return 0;
    }
    return pose[boneName][axis];
}
