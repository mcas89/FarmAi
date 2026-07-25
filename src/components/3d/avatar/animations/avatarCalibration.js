import calibrationData from './sixSeven_pose_01_full_body.json';

export function applyBasePose(vrm) {
    if (!vrm || !vrm.humanoid) return;

    // Função auxiliar para aplicar a rotação se o osso e o valor existirem
    const setBone = (boneName, eulerData) => {
        const node = vrm.humanoid.getNormalizedBoneNode(boneName);
        if (node && eulerData) {
            if (eulerData.x !== undefined) node.rotation.x = eulerData.x;
            if (eulerData.y !== undefined) node.rotation.y = eulerData.y;
            if (eulerData.z !== undefined) node.rotation.z = eulerData.z;
        }
    };

    setBone('hips', calibrationData.hips);
    setBone('leftShoulder', calibrationData.leftShoulder);
    setBone('rightShoulder', calibrationData.rightShoulder);
    setBone('leftUpperArm', calibrationData.leftUpperArm);
    setBone('rightUpperArm', calibrationData.rightUpperArm);
    setBone('leftLowerArm', calibrationData.leftLowerArm);
    setBone('rightLowerArm', calibrationData.rightLowerArm);
    setBone('chest', calibrationData.chest);
    setBone('leftHand', calibrationData.leftHand);
    setBone('rightHand', calibrationData.rightHand);
    setBone('leftUpperLeg', calibrationData.leftUpperLeg);
    setBone('rightUpperLeg', calibrationData.rightUpperLeg);
    setBone('leftLowerLeg', calibrationData.leftLowerLeg);
}
