/**
 * DanceSystem
 * Passinho do Jamal (botão toggle) — usa frames suavizados de jamalData.
 */

import { create } from 'zustand';
import { AnimationEngine } from './AnimationEngine';
import { Poses } from './PoseRegistry';
import { jamalFrames, jamalKeyPoses } from './jamalData';

// Injeta key poses no PoseRegistry (fallback / base)
Poses.jamal_base = jamalKeyPoses.LEFT;
Poses.jamal_pos1 = jamalKeyPoses.LEFT;
Poses.jamal_pos2 = jamalKeyPoses.RIGHT;

let avatarUuid = 'default';
let danceStep = 0;
let idleTimer = null;
let danceActive = false;

export const useDanceSystem = create((set) => ({
    isDancing: false,
    _setDancing: (v) => set({ isDancing: v }),
}));

function applyFramePose(pose) {
    // Registra pose temporária e aplica via basePose name
    const name = `jamal_frame_${danceStep}`;
    Poses[name] = pose;
    AnimationEngine.setBasePose(name, avatarUuid);
}

export const DanceSystem = {
    register: (uuid) => {
        avatarUuid = uuid;
    },

    toggleDance: () => {
        const state = useDanceSystem.getState();
        if (state.isDancing) {
            DanceSystem.stop();
        } else {
            state._setDancing(true);
            danceActive = true;
            danceStep = 0;
            DanceSystem._loop();
        }
    },

    _loop: () => {
        if (!danceActive || !useDanceSystem.getState().isDancing) return;

        const frames = jamalFrames;
        if (!frames.length) return;

        const frame = frames[danceStep % frames.length];
        applyFramePose(frame.pose);
        danceStep = (danceStep + 1) % frames.length;

        const ms = Math.max(40, Math.round((frame.duration || 0.055) * 1000));
        idleTimer = setTimeout(() => {
            DanceSystem._loop();
        }, ms);
    },

    stop: () => {
        danceActive = false;
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = null;
        danceStep = 0;
        AnimationEngine.setBasePose('arms_down_pose', avatarUuid);
        useDanceSystem.getState()._setDancing(false);
    },
};
