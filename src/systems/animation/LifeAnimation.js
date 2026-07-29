import { getPoseValue } from './PoseRegistry';

const vidaCompletoData = {
  "name": "vida_completo",
  "frames": [
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0173 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0401 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0158 }, "spine": { "x": 0.0023, "y": 0, "z": 0 }, "chest": { "x": 0.0068, "y": 0, "z": 0 }, "upperChest": { "x": 0.0045, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.0773, "z": 0 }, "head": { "x": 0.0027, "y": 0.2473, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0381 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0008, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0141 }, "spine": { "x": 0.0044, "y": 0, "z": 0 }, "chest": { "x": 0.0131, "y": 0, "z": 0 }, "upperChest": { "x": 0.0087, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1016, "z": 0 }, "head": { "x": 0.0052, "y": 0.3253, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0359 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0015, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0121 }, "spine": { "x": 0.0062, "y": 0, "z": 0 }, "chest": { "x": 0.0185, "y": 0, "z": 0 }, "upperChest": { "x": 0.0123, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1189, "z": 0 }, "head": { "x": 0.0074, "y": 0.3803, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0333 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0021, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0099 }, "spine": { "x": 0.0076, "y": 0, "z": 0 }, "chest": { "x": 0.0227, "y": 0, "z": 0 }, "upperChest": { "x": 0.0151, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1323, "z": 0 }, "head": { "x": 0.0091, "y": 0.4233, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0304 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0026, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0075 }, "spine": { "x": 0.0084, "y": 0, "z": 0 }, "chest": { "x": 0.0253, "y": 0, "z": 0 }, "upperChest": { "x": 0.0169, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1431, "z": 0 }, "head": { "x": 0.0101, "y": 0.4579, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0273 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0029, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0051 }, "spine": { "x": 0.0087, "y": 0, "z": 0 }, "chest": { "x": 0.0262, "y": 0, "z": 0 }, "upperChest": { "x": 0.0175, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1519, "z": 0 }, "head": { "x": 0.0105, "y": 0.4862, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0241 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.003, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0025 }, "spine": { "x": 0.0084, "y": 0, "z": 0 }, "chest": { "x": 0.0253, "y": 0, "z": 0 }, "upperChest": { "x": 0.0169, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1591, "z": 0 }, "head": { "x": 0.0101, "y": 0.5091, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0207 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0029, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0001 }, "spine": { "x": 0.0076, "y": 0, "z": 0 }, "chest": { "x": 0.0227, "y": 0, "z": 0 }, "upperChest": { "x": 0.0151, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1648, "z": 0 }, "head": { "x": 0.0091, "y": 0.5273, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0176 }, "hipsPosition": { "x": 0, "y": 0.0026, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0027 }, "spine": { "x": 0.0062, "y": 0, "z": 0 }, "chest": { "x": 0.0185, "y": 0, "z": 0 }, "upperChest": { "x": 0.0123, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1691, "z": 0 }, "head": { "x": 0.0074, "y": 0.5411, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.021 }, "hipsPosition": { "x": 0, "y": 0.0021, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0053 }, "spine": { "x": 0.0044, "y": 0, "z": 0 }, "chest": { "x": 0.0131, "y": 0, "z": 0 }, "upperChest": { "x": 0.0087, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1721, "z": 0 }, "head": { "x": 0.0052, "y": 0.5508, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0244 }, "hipsPosition": { "x": 0, "y": 0.0015, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0078 }, "spine": { "x": 0.0023, "y": 0, "z": 0 }, "chest": { "x": 0.0068, "y": 0, "z": 0 }, "upperChest": { "x": 0.0045, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1739, "z": 0 }, "head": { "x": 0.0027, "y": 0.5566, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0276 }, "hipsPosition": { "x": 0, "y": 0.0008, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0101 }, "neck": { "x": 0, "y": 0.1745, "z": 0 }, "head": { "x": 0, "y": 0.5585, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0307 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0123 }, "spine": { "x": -0.0023, "y": 0, "z": 0 }, "chest": { "x": -0.0068, "y": 0, "z": 0 }, "upperChest": { "x": -0.0045, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1739, "z": 0 }, "head": { "x": -0.0027, "y": 0.5566, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0335 }, "hipsPosition": { "x": 0, "y": -0.0008, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0142 }, "spine": { "x": -0.0044, "y": 0, "z": 0 }, "chest": { "x": -0.0131, "y": 0, "z": 0 }, "upperChest": { "x": -0.0087, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1721, "z": 0 }, "head": { "x": -0.0052, "y": 0.5508, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0361 }, "hipsPosition": { "x": 0, "y": -0.0015, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0159 }, "spine": { "x": -0.0062, "y": 0, "z": 0 }, "chest": { "x": -0.0185, "y": 0, "z": 0 }, "upperChest": { "x": -0.0123, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1691, "z": 0 }, "head": { "x": -0.0074, "y": 0.5411, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0383 }, "hipsPosition": { "x": 0, "y": -0.0021, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0174 }, "spine": { "x": -0.0076, "y": 0, "z": 0 }, "chest": { "x": -0.0227, "y": 0, "z": 0 }, "upperChest": { "x": -0.0151, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1648, "z": 0 }, "head": { "x": -0.0091, "y": 0.5273, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0402 }, "hipsPosition": { "x": 0, "y": -0.0026, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0185 }, "spine": { "x": -0.0084, "y": 0, "z": 0 }, "chest": { "x": -0.0253, "y": 0, "z": 0 }, "upperChest": { "x": -0.0169, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1591, "z": 0 }, "head": { "x": -0.0101, "y": 0.5091, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0417 }, "hipsPosition": { "x": 0, "y": -0.0029, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0193 }, "spine": { "x": -0.0087, "y": 0, "z": 0 }, "chest": { "x": -0.0262, "y": 0, "z": 0 }, "upperChest": { "x": -0.0175, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1519, "z": 0 }, "head": { "x": -0.0105, "y": 0.4862, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0428 }, "hipsPosition": { "x": 0, "y": -0.003, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0198 }, "spine": { "x": -0.0084, "y": 0, "z": 0 }, "chest": { "x": -0.0253, "y": 0, "z": 0 }, "upperChest": { "x": -0.0169, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1431, "z": 0 }, "head": { "x": -0.0101, "y": 0.4579, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0434 }, "hipsPosition": { "x": 0, "y": -0.0029, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.02 }, "spine": { "x": -0.0076, "y": 0, "z": 0 }, "chest": { "x": -0.0227, "y": 0, "z": 0 }, "upperChest": { "x": -0.0151, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1323, "z": 0 }, "head": { "x": -0.0091, "y": 0.4233, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0436 }, "hipsPosition": { "x": 0, "y": -0.0026, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0198 }, "spine": { "x": -0.0062, "y": 0, "z": 0 }, "chest": { "x": -0.0185, "y": 0, "z": 0 }, "upperChest": { "x": -0.0123, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1189, "z": 0 }, "head": { "x": -0.0074, "y": 0.3803, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0434 }, "hipsPosition": { "x": 0, "y": -0.0021, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0193 }, "spine": { "x": -0.0044, "y": 0, "z": 0 }, "chest": { "x": -0.0131, "y": 0, "z": 0 }, "upperChest": { "x": -0.0087, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.1016, "z": 0 }, "head": { "x": -0.0052, "y": 0.3253, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0427 }, "hipsPosition": { "x": 0, "y": -0.0015, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0184 }, "spine": { "x": -0.0023, "y": 0, "z": 0 }, "chest": { "x": -0.0068, "y": 0, "z": 0 }, "upperChest": { "x": -0.0045, "y": 0, "z": 0 }, "neck": { "x": 0, "y": 0.0773, "z": 0 }, "head": { "x": -0.0027, "y": 0.2473, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0416 }, "hipsPosition": { "x": 0, "y": -0.0008, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0173 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0401 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0158 }, "spine": { "x": 0.0023, "y": 0, "z": 0 }, "chest": { "x": 0.0068, "y": 0, "z": 0 }, "upperChest": { "x": 0.0045, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.0773, "z": 0 }, "head": { "x": 0.0027, "y": -0.2473, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0381 }, "hipsPosition": { "x": 0, "y": 0.0008, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0141 }, "spine": { "x": 0.0044, "y": 0, "z": 0 }, "chest": { "x": 0.0131, "y": 0, "z": 0 }, "upperChest": { "x": 0.0087, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1016, "z": 0 }, "head": { "x": 0.0052, "y": -0.3253, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0359 }, "hipsPosition": { "x": 0, "y": 0.0015, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0121 }, "spine": { "x": 0.0062, "y": 0, "z": 0 }, "chest": { "x": 0.0185, "y": 0, "z": 0 }, "upperChest": { "x": 0.0123, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1189, "z": 0 }, "head": { "x": 0.0074, "y": -0.3803, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0333 }, "hipsPosition": { "x": 0, "y": 0.0021, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0099 }, "spine": { "x": 0.0076, "y": 0, "z": 0 }, "chest": { "x": 0.0227, "y": 0, "z": 0 }, "upperChest": { "x": 0.0151, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1323, "z": 0 }, "head": { "x": 0.0091, "y": -0.4233, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0304 }, "hipsPosition": { "x": 0, "y": 0.0026, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0075 }, "spine": { "x": 0.0084, "y": 0, "z": 0 }, "chest": { "x": 0.0253, "y": 0, "z": 0 }, "upperChest": { "x": 0.0169, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1431, "z": 0 }, "head": { "x": 0.0101, "y": -0.4579, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0273 }, "hipsPosition": { "x": 0, "y": 0.0029, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0051 }, "spine": { "x": 0.0087, "y": 0, "z": 0 }, "chest": { "x": 0.0262, "y": 0, "z": 0 }, "upperChest": { "x": 0.0175, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1519, "z": 0 }, "head": { "x": 0.0105, "y": -0.4862, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0241 }, "hipsPosition": { "x": 0, "y": 0.003, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": -0.0025 }, "spine": { "x": 0.0084, "y": 0, "z": 0 }, "chest": { "x": 0.0253, "y": 0, "z": 0 }, "upperChest": { "x": 0.0169, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1591, "z": 0 }, "head": { "x": 0.0101, "y": -0.5091, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0175 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0207 }, "hipsPosition": { "x": 0, "y": 0.0029, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0001 }, "spine": { "x": 0.0076, "y": 0, "z": 0 }, "chest": { "x": 0.0227, "y": 0, "z": 0 }, "upperChest": { "x": 0.0151, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1648, "z": 0 }, "head": { "x": 0.0091, "y": -0.5273, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0176 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0026, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0027 }, "spine": { "x": 0.0062, "y": 0, "z": 0 }, "chest": { "x": 0.0185, "y": 0, "z": 0 }, "upperChest": { "x": 0.0123, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1691, "z": 0 }, "head": { "x": 0.0074, "y": -0.5411, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.021 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0021, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0053 }, "spine": { "x": 0.0044, "y": 0, "z": 0 }, "chest": { "x": 0.0131, "y": 0, "z": 0 }, "upperChest": { "x": 0.0087, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1721, "z": 0 }, "head": { "x": 0.0052, "y": -0.5508, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0244 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0015, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0078 }, "spine": { "x": 0.0023, "y": 0, "z": 0 }, "chest": { "x": 0.0068, "y": 0, "z": 0 }, "upperChest": { "x": 0.0045, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1739, "z": 0 }, "head": { "x": 0.0027, "y": -0.5566, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0276 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": 0.0008, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0101 }, "neck": { "x": 0, "y": -0.1745, "z": 0 }, "head": { "x": 0, "y": -0.5585, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0307 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0123 }, "spine": { "x": -0.0023, "y": 0, "z": 0 }, "chest": { "x": -0.0068, "y": 0, "z": 0 }, "upperChest": { "x": -0.0045, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1739, "z": 0 }, "head": { "x": -0.0027, "y": -0.5566, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0335 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0008, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0142 }, "spine": { "x": -0.0044, "y": 0, "z": 0 }, "chest": { "x": -0.0131, "y": 0, "z": 0 }, "upperChest": { "x": -0.0087, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1721, "z": 0 }, "head": { "x": -0.0052, "y": -0.5508, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0361 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0015, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0159 }, "spine": { "x": -0.0062, "y": 0, "z": 0 }, "chest": { "x": -0.0185, "y": 0, "z": 0 }, "upperChest": { "x": -0.0123, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1691, "z": 0 }, "head": { "x": -0.0074, "y": -0.5411, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0383 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0021, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0174 }, "spine": { "x": -0.0076, "y": 0, "z": 0 }, "chest": { "x": -0.0227, "y": 0, "z": 0 }, "upperChest": { "x": -0.0151, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1648, "z": 0 }, "head": { "x": -0.0091, "y": -0.5273, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0402 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0026, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0185 }, "spine": { "x": -0.0084, "y": 0, "z": 0 }, "chest": { "x": -0.0253, "y": 0, "z": 0 }, "upperChest": { "x": -0.0169, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1591, "z": 0 }, "head": { "x": -0.0101, "y": -0.5091, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0417 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0029, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0193 }, "spine": { "x": -0.0087, "y": 0, "z": 0 }, "chest": { "x": -0.0262, "y": 0, "z": 0 }, "upperChest": { "x": -0.0175, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1519, "z": 0 }, "head": { "x": -0.0105, "y": -0.4862, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0428 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.003, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0198 }, "spine": { "x": -0.0084, "y": 0, "z": 0 }, "chest": { "x": -0.0253, "y": 0, "z": 0 }, "upperChest": { "x": -0.0169, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1431, "z": 0 }, "head": { "x": -0.0101, "y": -0.4579, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0434 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0029, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.02 }, "spine": { "x": -0.0076, "y": 0, "z": 0 }, "chest": { "x": -0.0227, "y": 0, "z": 0 }, "upperChest": { "x": -0.0151, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1323, "z": 0 }, "head": { "x": -0.0091, "y": -0.4233, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0436 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0026, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0198 }, "spine": { "x": -0.0062, "y": 0, "z": 0 }, "chest": { "x": -0.0185, "y": 0, "z": 0 }, "upperChest": { "x": -0.0123, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1189, "z": 0 }, "head": { "x": -0.0074, "y": -0.3803, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0434 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0021, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0193 }, "spine": { "x": -0.0044, "y": 0, "z": 0 }, "chest": { "x": -0.0131, "y": 0, "z": 0 }, "upperChest": { "x": -0.0087, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.1016, "z": 0 }, "head": { "x": -0.0052, "y": -0.3253, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0427 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0015, "z": 0 } } },
    { "duration": 0.25, "pose": { "hips": { "x": 0, "y": 0, "z": 0.0184 }, "spine": { "x": -0.0023, "y": 0, "z": 0 }, "chest": { "x": -0.0068, "y": 0, "z": 0 }, "upperChest": { "x": -0.0045, "y": 0, "z": 0 }, "neck": { "x": 0, "y": -0.0773, "z": 0 }, "head": { "x": -0.0027, "y": -0.2473, "z": 0 }, "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 }, "leftUpperArm": { "x": 0, "y": 0, "z": -1.309 }, "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 }, "rightUpperArm": { "x": 0, "y": 0, "z": 1.309 }, "leftUpperLeg": { "x": 0, "y": 0, "z": -0.0416 }, "rightUpperLeg": { "x": 0, "y": 0, "z": 0.0175 }, "hipsPosition": { "x": 0, "y": -0.0008, "z": 0 } } }
  ]
};

const FIDGETS = [
    {
      name: "aceno",
      frames: [
        { duration: 0.4, pose: { leftUpperArm: {x:-2.84,y:-1.74,z:-1.51}, rightUpperArm: {x:-0.01,y:-0.05,z:1.28}, leftShoulder: {x:-0.27,y:0.08,z:-0.32} } },
        { duration: 0.28, pose: { leftUpperArm: {x:-2.84,y:-1.74,z:-1.51}, rightUpperArm: {x:-0.01,y:-0.05,z:1.28}, leftShoulder: {x:0,y:0.44,z:-0.58}, leftLowerArm: {x:0,y:-0.8,z:0}, leftHand: {x:-0.14,y:-0.41,z:0.13} } },
        { duration: 0.28, pose: { leftUpperArm: {x:-2.84,y:-1.74,z:-1.51}, rightUpperArm: {x:-0.01,y:-0.05,z:1.28}, leftShoulder: {x:0,y:0.44,z:-0.58}, leftLowerArm: {x:0,y:-0.1,z:0}, leftHand: {x:-0.36,y:0.21,z:0.21} } }
      ]
    },
    {
      name: "mao_no_cabelo",
      frames: [
        { duration: 1.5, pose: { leftUpperArm: {x:0,y:0,z:-1.34}, rightUpperArm: {x:-1.51,y:-0.58,z:1.37}, rightLowerArm: {x:-0.54,y:0.08,z:1.68}, rightHand: {x:0,y:0,z:0.57} } }
      ]
    },
    {
      name: "alongar_coluna",
      frames: [
        { duration: 1.5, pose: { leftUpperArm: {x:0,y:0,z:-1.38}, rightUpperArm: {x:-0.01,y:-0.05,z:1.28}, leftHand: {x:-0.36,y:0.21,z:0.21}, spine: {x:-0.18,y:0,z:0} } }
      ]
    },
    {
      name: "virar_torso",
      frames: [
        { duration: 1.5, pose: { leftUpperArm: {x:0,y:0,z:-1.38}, rightUpperArm: {x:-0.01,y:-0.05,z:1.28}, leftHand: {x:-0.36,y:0.21,z:0.21}, spine: {x:0,y:0.84,z:0} } }
      ]
    },
    {
      name: "relaxar_perna",
      frames: [
        { duration: 1.5, pose: { leftUpperArm: {x:0,y:0,z:-1.34}, rightUpperArm: {x:-0.01,y:-0.05,z:1.28}, leftHand: {x:-0.36,y:0.21,z:0.21}, rightLowerLeg: {x:0.66,y:0,z:0}, rightFoot: {x:0.44,y:0,z:0} } }
      ]
    }
];

const IDLE_CYCLE_DURATION = vidaCompletoData.frames.reduce((sum, f) => sum + f.duration, 0);

let idleBaseTime = 0;
let activeFidget = null;
let fidgetTime = 0;
let idleTimer = 0;
let nextFidgetDelay = Math.random() * 5 + 3; // de 3 a 8 segundos
let fidgetBlend = 0;

export const LifeAnimation = {
    getOffsets: (delta, brainBreathMultiplier = 1.0, isIdle = false) => {
        let offsets = {};

        // 1. Loop Base Idle (Substitui os senos antigos pela animação completa e natural)
        idleBaseTime += delta;
        let tBase = idleBaseTime % IDLE_CYCLE_DURATION;
        if (tBase < 0) tBase += IDLE_CYCLE_DURATION;
        
        let accumulatedBase = 0;
        let frameIndexBase = 0;
        
        for (let i = 0; i < vidaCompletoData.frames.length; i++) {
            if (tBase >= accumulatedBase && tBase < accumulatedBase + vidaCompletoData.frames[i].duration) {
                frameIndexBase = i;
                break;
            }
            accumulatedBase += vidaCompletoData.frames[i].duration;
        }
        
        const nextFrameIndexBase = (frameIndexBase + 1) % vidaCompletoData.frames.length;
        const frameABase = vidaCompletoData.frames[frameIndexBase];
        const frameBBase = vidaCompletoData.frames[nextFrameIndexBase];
        const progressBase = (tBase - accumulatedBase) / frameABase.duration;

        // Função auxiliar para subtrair a pose base em tempo real e evitar inversões
        const getRelativeBone = (boneName, frameA, frameB, progress) => {
            const a = frameA.pose[boneName] || { x:0, y:0, z:0 };
            const b = frameB.pose[boneName] || { x:0, y:0, z:0 };
            
            const baseX = boneName === 'hipsPosition' ? 0 : getPoseValue('arms_down_pose', boneName, 'x');
            const baseY = boneName === 'hipsPosition' ? 0 : getPoseValue('arms_down_pose', boneName, 'y');
            const baseZ = boneName === 'hipsPosition' ? 0 : getPoseValue('arms_down_pose', boneName, 'z');

            return {
                x: ((a.x || 0) + ((b.x || 0) - (a.x || 0)) * progress) - baseX,
                y: ((a.y || 0) + ((b.y || 0) - (a.y || 0)) * progress) - baseY,
                z: ((a.z || 0) + ((b.z || 0) - (a.z || 0)) * progress) - baseZ
            };
        };

        // Aplica o loop de base idle (Vida Completo)
        const allIdleBones = Object.keys(frameABase.pose);
        allIdleBones.forEach(bone => {
            offsets[bone] = getRelativeBone(bone, frameABase, frameBBase, progressBase);
        });

        // 2. Lógica de Fidgets
        if (isIdle) {
            if (!activeFidget) {
                idleTimer += delta;
                if (idleTimer > nextFidgetDelay) {
                    activeFidget = FIDGETS[Math.floor(Math.random() * FIDGETS.length)];
                    fidgetTime = 0;
                    idleTimer = 0;
                    nextFidgetDelay = Math.random() * 5 + 3;
                }
            }
        } else {
            if (activeFidget) fidgetTime += delta * 3; // aborta rápido se mover
            idleTimer = 0;
        }

        if (activeFidget) {
            fidgetTime += delta;
            const totalDuration = activeFidget.frames.reduce((sum, f) => sum + f.duration, 0);
            
            const BLEND_TIME = 0.3;
            if (fidgetTime < BLEND_TIME) {
                fidgetBlend = fidgetTime / BLEND_TIME;
            } else if (fidgetTime > totalDuration - BLEND_TIME) {
                fidgetBlend = (totalDuration - fidgetTime) / BLEND_TIME;
            } else {
                fidgetBlend = 1.0;
            }

            fidgetBlend = Math.max(0, Math.min(1, fidgetBlend));

            if (fidgetTime >= totalDuration) {
                activeFidget = null;
                fidgetBlend = 0;
            } else {
                let t = fidgetTime;
                let accumulated = 0;
                let frameIndex = 0;
                
                for (let i = 0; i < activeFidget.frames.length; i++) {
                    if (t >= accumulated && t < accumulated + activeFidget.frames[i].duration) {
                        frameIndex = i;
                        break;
                    }
                    accumulated += activeFidget.frames[i].duration;
                }
                
                const frameA = activeFidget.frames[frameIndex];
                const frameB = frameIndex + 1 < activeFidget.frames.length ? activeFidget.frames[frameIndex + 1] : frameA;
                const progress = (t - accumulated) / frameA.duration;
                
                const fidgetBones = Object.keys(frameA.pose);
                fidgetBones.forEach(bone => {
                    const relativeVal = getRelativeBone(bone, frameA, frameB, progress);
                    
                    if (!offsets[bone]) offsets[bone] = { x: 0, y: 0, z: 0 };
                    
                    // Transita suavemente do base idle pro fidget
                    offsets[bone].x = offsets[bone].x + (relativeVal.x - offsets[bone].x) * fidgetBlend;
                    offsets[bone].y = offsets[bone].y + (relativeVal.y - offsets[bone].y) * fidgetBlend;
                    offsets[bone].z = offsets[bone].z + (relativeVal.z - offsets[bone].z) * fidgetBlend;
                });
            }
        }

        return offsets;
    }
};
