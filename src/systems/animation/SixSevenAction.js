/**
 * SixSevenAction
 * PRIORIDADE 04 (Esquerda) e 05 (Direita)
 * Duas máquinas de estado 100% independentes (linhas temporais próprias).
 */

const STATES = {
    IDLE: 'IDLE', // Estado nulo, delega de volta para a Current Base Pose
    FRAME_1: 'six_seven_ready_pose',
    FRAME_2: 'six_seven_left_arm_high_pose',
    FRAME_3: 'six_seven_cross_limit_pose',
    FRAME_4: 'six_seven_reverse_limit_pose'
};

const createStateMachine = () => ({
    currentState: STATES.IDLE,
    timeInState: 0
});

const instances = {};

const getInstance = (uuid) => {
    if (!instances[uuid]) {
        instances[uuid] = {
            leftSM: createStateMachine(),
            rightSM: createStateMachine()
        };
    }
    return instances[uuid];
};

const updateMachine = (sm, isActive, delta) => {
    if (!isActive) {
        sm.currentState = STATES.IDLE;
        sm.timeInState = 0;
        return { targetPose: null, lerpFactor: 0.1 }; 
    }

    sm.timeInState += delta;
    const speed = 0.2; 

    if (sm.currentState === STATES.IDLE) {
        sm.currentState = STATES.FRAME_1;
        sm.timeInState = 0;
    } else if (sm.currentState === STATES.FRAME_1 && sm.timeInState > speed) {
        sm.currentState = STATES.FRAME_2;
        sm.timeInState = 0;
    } else if (sm.currentState === STATES.FRAME_2 && sm.timeInState > speed) {
        sm.currentState = STATES.FRAME_3;
        sm.timeInState = 0;
    } else if (sm.currentState === STATES.FRAME_3 && sm.timeInState > speed) {
        sm.currentState = STATES.FRAME_4;
        sm.timeInState = 0;
    } else if (sm.currentState === STATES.FRAME_4 && sm.timeInState > speed) {
        sm.currentState = STATES.FRAME_3; // LOOP: 3 -> 4 -> 3
        sm.timeInState = 0;
    }

    return {
        targetPose: sm.currentState,
        lerpFactor: (sm.currentState === STATES.FRAME_1) ? 0.08 : 0.2
    };
};

export const SixSevenAction = {
    update: (delta, isLeftFarming, isRightFarming, uuid = 'default') => {
        const inst = getInstance(uuid);
        return {
            left: updateMachine(inst.leftSM, isLeftFarming, delta),
            right: updateMachine(inst.rightSM, isRightFarming, delta)
        };
    }
};
