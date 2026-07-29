import { getPoseValue } from './PoseRegistry';

const instances = {};

const getInstance = (uuid) => {
    if (!instances[uuid]) {
        instances[uuid] = {
            walkTime: 0,
            blendWeight: 0,
            runWeight: 0
        };
    }
    return instances[uuid];
};

const walkData = {
  "name": "andar",
  "frames": [
    {
      "name": "Andar 1",
      "duration": 0.069,
      "pose": {
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": 0, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "rightLowerLeg": { "x": 0.7854, "y": 0, "z": 0 }
      }
    },
    {
      "name": "Andar 2",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": 0.0191, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": 0.02, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.1469, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.1469, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.187, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.0668, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.187, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 0.7256, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.0668, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0077, "z": 0 }
      }
    },
    {
      "name": "Andar 3",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": 0.0354, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": 0.037, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.2715, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.2715, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.3456, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.1234, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.3456, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 0.5554, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.1234, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0141, "z": 0 }
      }
    },
    {
      "name": "Andar 4",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": 0.0462, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": 0.0484, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.3547, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.3547, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.4515, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.1612, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.4515, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 0.3006, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.1612, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0185, "z": 0 }
      }
    },
    {
      "name": "Andar 5",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": 0.05, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": 0.0524, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.384, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.384, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.4887, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.1745, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.4887, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.1745, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.02, "z": 0 }
      }
    },
    {
      "name": "Andar 6",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": 0.0462, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": 0.0484, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.3547, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.3547, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.4515, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 0.3006, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.1612, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.4515, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.1612, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0185, "z": 0 }
      }
    },
    {
      "name": "Andar 7",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": 0.0354, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": 0.037, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.2715, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.2715, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.3456, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 0.5554, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.1234, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.3456, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.1234, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0141, "z": 0 }
      }
    },
    {
      "name": "Andar 8",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": 0.0191, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": 0.02, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.1469, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.1469, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.187, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 0.7256, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.0668, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.187, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.0668, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0077, "z": 0 }
      }
    },
    {
      "name": "Andar 9",
      "duration": 0.069,
      "pose": {
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": 0, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftLowerLeg": { "x": 0.7854, "y": 0, "z": 0 }
      }
    },
    {
      "name": "Andar 10",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": -0.0191, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": -0.02, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.1469, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.1469, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.187, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 0.7256, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.0668, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.187, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.0668, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0077, "z": 0 }
      }
    },
    {
      "name": "Andar 11",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": -0.0354, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": -0.037, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.2715, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.2715, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.3456, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 0.5554, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.1234, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.3456, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.1234, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0141, "z": 0 }
      }
    },
    {
      "name": "Andar 12",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": -0.0462, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": -0.0484, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.3547, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.3547, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.4515, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 0.3006, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.1612, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.4515, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.1612, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0185, "z": 0 }
      }
    },
    {
      "name": "Andar 13",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": -0.05, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": -0.0524, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.384, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.384, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.4887, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.1745, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.4887, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.1745, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.02, "z": 0 }
      }
    },
    {
      "name": "Andar 14",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": -0.0462, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": -0.0484, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.3547, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.3547, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.4515, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.1612, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.4515, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 0.3006, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.1612, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0185, "z": 0 }
      }
    },
    {
      "name": "Andar 15",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": -0.0354, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": -0.037, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.2715, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.2715, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.3456, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.1234, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.3456, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 0.5554, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.1234, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0141, "z": 0 }
      }
    },
    {
      "name": "Andar 16",
      "duration": 0.069,
      "pose": {
        "hips": { "x": 0, "y": -0.0191, "z": 0 },
        "spine": { "x": 0.0349, "y": 0, "z": 0 },
        "chest": { "x": 0.0175, "y": -0.02, "z": 0 },
        "head": { "x": -0.0105, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.1469, "y": 0, "z": -1.0996 },
        "leftLowerArm": { "x": 0, "y": 0, "z": -0.2094 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.1469, "y": 0, "z": 1.0996 },
        "rightLowerArm": { "x": 0, "y": 0, "z": 0.2094 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.187, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.0668, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.187, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 0.7256, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.0668, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0077, "z": 0 }
      }
    }
  ]
};

const runData = {
  "name": "correr",
  "frames": [
    {
      "name": "Correr 1",
      "duration": 0.049,
      "pose": {
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": 0, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.4622, "y": 0.0208, "z": -1.097 },
        "leftLowerArm": { "x": -0.786, "y": -1.4374, "z": -0.5661 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.4622, "y": -0.0208, "z": 1.097 },
        "rightLowerArm": { "x": -0.786, "y": 1.4374, "z": 0.5661 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "rightLowerLeg": { "x": 1.4835, "y": 0, "z": 0 }
      }
    },
    {
      "name": "Correr 2",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": 0.025, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": 0.0262, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.1938, "y": -0.1591, "z": -1.0993 },
        "leftLowerArm": { "x": -2.2587, "y": -1.4275, "z": -1.9311 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.7355, "y": -0.1948, "z": 1.143 },
        "rightLowerArm": { "x": -0.2051, "y": 1.2882, "z": 0.0939 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.3927, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.0873, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.3927, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 1.2848, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.0873, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0225, "z": 0 }
      }
    },
    {
      "name": "Correr 3",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": 0.0433, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": 0.0453, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.0097, "y": -0.2869, "z": -1.1326 },
        "leftLowerArm": { "x": -2.6923, "y": -1.3185, "z": -2.2852 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.948, "y": -0.3105, "z": 1.2084 },
        "rightLowerArm": { "x": -0.0429, "y": 1.1634, "z": 0.0127 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.6802, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.1511, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.6802, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 0.7418, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.1511, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.039, "z": 0 }
      }
    },
    {
      "name": "Correr 4",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": 0.05, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": 0.0524, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.0873, "y": -0.3316, "z": -1.1519 },
        "leftLowerArm": { "x": -2.7751, "y": -1.2741, "z": -2.3387 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 1.0297, "y": -0.3491, "z": 1.2392 },
        "rightLowerArm": { "x": 0, "y": 1.117, "z": 0 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.7854, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.1745, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.7854, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.1745, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.045, "z": 0 }
      }
    },
    {
      "name": "Correr 5",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": 0.0433, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": 0.0453, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": -0.0097, "y": -0.2869, "z": -1.1326 },
        "leftLowerArm": { "x": -2.6923, "y": -1.3185, "z": -2.2852 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.948, "y": -0.3105, "z": 1.2084 },
        "rightLowerArm": { "x": -0.0429, "y": 1.1634, "z": 0.0127 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.6802, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 0.7418, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.1511, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.6802, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.1511, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.039, "z": 0 }
      }
    },
    {
      "name": "Correr 6",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": 0.025, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": 0.0262, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.1938, "y": -0.1591, "z": -1.0993 },
        "leftLowerArm": { "x": -2.2587, "y": -1.4275, "z": -1.9311 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.7355, "y": -0.1948, "z": 1.143 },
        "rightLowerArm": { "x": -0.2051, "y": 1.2882, "z": 0.0939 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": 0.3927, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 1.2848, "y": 0, "z": 0 },
        "leftFoot": { "x": -0.0873, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": -0.3927, "y": 0, "z": 0 },
        "rightFoot": { "x": 0.0873, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0225, "z": 0 }
      }
    },
    {
      "name": "Correr 7",
      "duration": 0.049,
      "pose": {
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": 0, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.4622, "y": 0.0208, "z": -1.097 },
        "leftLowerArm": { "x": -0.786, "y": -1.4374, "z": -0.5661 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.4622, "y": -0.0208, "z": 1.097 },
        "rightLowerArm": { "x": -0.786, "y": 1.4374, "z": 0.5661 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftLowerLeg": { "x": 1.4835, "y": 0, "z": 0 }
      }
    },
    {
      "name": "Correr 8",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": -0.025, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": -0.0262, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.7355, "y": 0.1948, "z": -1.143 },
        "leftLowerArm": { "x": -0.2051, "y": -1.2882, "z": -0.0939 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.1938, "y": 0.1591, "z": 1.0993 },
        "rightLowerArm": { "x": -2.2587, "y": 1.4275, "z": 1.9311 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.3927, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 1.2848, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.0873, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.3927, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.0873, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0225, "z": 0 }
      }
    },
    {
      "name": "Correr 9",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": -0.0433, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": -0.0453, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.948, "y": 0.3105, "z": -1.2084 },
        "leftLowerArm": { "x": -0.0429, "y": -1.1634, "z": -0.0127 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.0097, "y": 0.2869, "z": 1.1326 },
        "rightLowerArm": { "x": -2.6923, "y": 1.3185, "z": 2.2852 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.6802, "y": 0, "z": 0 },
        "leftLowerLeg": { "x": 0.7418, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.1511, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.6802, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.1511, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.039, "z": 0 }
      }
    },
    {
      "name": "Correr 10",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": -0.05, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": -0.0524, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 1.0297, "y": 0.3491, "z": -1.2392 },
        "leftLowerArm": { "x": 0, "y": -1.117, "z": 0 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.0873, "y": 0.3316, "z": 1.1519 },
        "rightLowerArm": { "x": -2.7751, "y": 1.2741, "z": 2.3387 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.7854, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.1745, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.7854, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.1745, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.045, "z": 0 }
      }
    },
    {
      "name": "Correr 11",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": -0.0433, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": -0.0453, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.948, "y": 0.3105, "z": -1.2084 },
        "leftLowerArm": { "x": -0.0429, "y": -1.1634, "z": -0.0127 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": -0.0097, "y": 0.2869, "z": 1.1326 },
        "rightLowerArm": { "x": -2.6923, "y": 1.3185, "z": 2.2852 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.6802, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.1511, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.6802, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 0.7418, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.1511, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.039, "z": 0 }
      }
    },
    {
      "name": "Correr 12",
      "duration": 0.049,
      "pose": {
        "hips": { "x": 0, "y": -0.025, "z": 0 },
        "spine": { "x": 0.1571, "y": 0, "z": 0 },
        "chest": { "x": 0.0785, "y": -0.0262, "z": 0 },
        "head": { "x": -0.0471, "y": 0, "z": 0 },
        "leftShoulder": { "x": 0, "y": 0, "z": -0.0524 },
        "leftUpperArm": { "x": 0.7355, "y": 0.1948, "z": -1.143 },
        "leftLowerArm": { "x": -0.2051, "y": -1.2882, "z": -0.0939 },
        "leftHand": { "x": -0.2709, "y": 0.1679, "z": 0.1536 },
        "rightShoulder": { "x": 0, "y": 0, "z": 0.0524 },
        "rightUpperArm": { "x": 0.1938, "y": 0.1591, "z": 1.0993 },
        "rightLowerArm": { "x": -2.2587, "y": 1.4275, "z": 1.9311 },
        "rightHand": { "x": 0, "y": 0, "z": 0.21 },
        "leftUpperLeg": { "x": -0.3927, "y": 0, "z": 0 },
        "leftFoot": { "x": 0.0873, "y": 0, "z": 0 },
        "rightUpperLeg": { "x": 0.3927, "y": 0, "z": 0 },
        "rightLowerLeg": { "x": 1.2848, "y": 0, "z": 0 },
        "rightFoot": { "x": -0.0873, "y": 0, "z": 0 },
        "hipsPosition": { "x": 0, "y": 0.0225, "z": 0 }
      }
    }
  ]
};

const CYCLE_DURATION_WALK = walkData.frames.reduce((sum, f) => sum + f.duration, 0);
const CYCLE_DURATION_RUN = runData.frames.reduce((sum, f) => sum + f.duration, 0);



export const WalkAnimation = {
    getOffsets: (delta, isMoving, isRunning, uuid = 'default') => {
        const inst = getInstance(uuid);

        const targetBlend = isMoving ? 1.0 : 0.0;
        inst.blendWeight = inst.blendWeight + (targetBlend - inst.blendWeight) * Math.min(delta * 10, 1);

        const targetRun = isRunning ? 1.0 : 0.0;
        inst.runWeight = inst.runWeight + (targetRun - inst.runWeight) * Math.min(delta * 8, 1);

        if (inst.blendWeight < 0.01) {
            inst.walkTime = 0;
            return { weight: 0, offsets: {} };
        }

        const speedMultiplier = 1.0 + (inst.runWeight * 0.5);
        inst.walkTime += delta * speedMultiplier;

        const getLerpedFrame = (animData, time, cycleDuration) => {
            let t = time % cycleDuration;
            if (t < 0) t += cycleDuration;
            
            let accumulated = 0;
            let frameIndex = 0;
            
            for (let i = 0; i < animData.frames.length; i++) {
                if (t >= accumulated && t < accumulated + animData.frames[i].duration) {
                    frameIndex = i;
                    break;
                }
                accumulated += animData.frames[i].duration;
            }
            
            const nextFrameIndex = (frameIndex + 1) % animData.frames.length;
            const frameA = animData.frames[frameIndex];
            const frameB = animData.frames[nextFrameIndex];
            const progress = (t - accumulated) / frameA.duration;
            
            return (boneName) => {
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
        };

        const getWalkBone = getLerpedFrame(walkData, walkTime, CYCLE_DURATION_WALK);
        // Podemos usar a mesma variável walkTime para sincronizar os passos, ou ajustar se dessincronizar
        const getRunBone = getLerpedFrame(runData, walkTime, CYCLE_DURATION_RUN);

        const lerpBone = (boneName) => {
            const walk = getWalkBone(boneName);
            if (inst.runWeight <= 0) return walk;

            const run = getRunBone(boneName);
            if (inst.runWeight >= 1) return run;

            return {
                x: walk.x + (run.x - walk.x) * inst.runWeight,
                y: walk.y + (run.y - walk.y) * inst.runWeight,
                z: walk.z + (run.z - walk.z) * inst.runWeight
            };
        };

        return {
            weight: inst.blendWeight,
            offsets: {
                spine: lerpBone('spine'),
                chest: lerpBone('chest'),
                head: lerpBone('head'),
                leftShoulder: lerpBone('leftShoulder'),
                leftUpperArm: lerpBone('leftUpperArm'),
                leftLowerArm: lerpBone('leftLowerArm'),
                leftHand: lerpBone('leftHand'),
                rightShoulder: lerpBone('rightShoulder'),
                rightUpperArm: lerpBone('rightUpperArm'),
                rightLowerArm: lerpBone('rightLowerArm'),
                rightHand: lerpBone('rightHand'),
                leftUpperLeg: lerpBone('leftUpperLeg'),
                leftLowerLeg: lerpBone('leftLowerLeg'),
                leftFoot: lerpBone('leftFoot'),
                rightUpperLeg: lerpBone('rightUpperLeg'),
                rightLowerLeg: lerpBone('rightLowerLeg'),
                rightFoot: lerpBone('rightFoot'),
                hips: lerpBone('hips'),
                hipsPosition: lerpBone('hipsPosition')
            }
        };
    }
};
