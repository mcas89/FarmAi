/**
 * SixSevenAction
 * PRIORIDADE 04 (Esquerda) e 05 (Direita)
 * Duas máquinas de estado 100% independentes (linhas temporais próprias).
 */

const STATES = {
    IDLE: 'IDLE',
    FRAME_1: 'six_seven_ready_pose',
    FRAME_2: 'six_seven_left_arm_high_pose',
    FRAME_3: 'six_seven_cross_limit_pose',
    FRAME_4: 'six_seven_reverse_limit_pose'
};

// Dicionário de tempos de duração para cada estado (em segundos)
// Ajuste esses valores para deixar o farm mais rápido ou mais cadenciado
const DURATIONS = {
    [STATES.IDLE]: 0.5,
    [STATES.FRAME_1]: 0.15, // Preparação (um pouco mais perceptível)
    [STATES.FRAME_2]: 0.10, // Transição rápida
    [STATES.FRAME_3]: 0.12, // Hit do movimento (Farm)
    [STATES.FRAME_4]: 0.12  // Retorno do movimento (Loop)
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
    // 1. Tratamento suave de saída (Anti-Jitter)
    // Se o jogador soltar o clique, o braço volta para o IDLE suavemente
    if (!isActive) {
        if (sm.currentState !== STATES.IDLE) {
            sm.currentState = STATES.IDLE;
            sm.timeInState = 0;
        }
        return { 
            targetPose: null, 
            lerpFactor: 0.05, 
            progress: 0 
        }; 
    }

    sm.timeInState += delta;
    let currentDuration = DURATIONS[sm.currentState];

    // 2. Lógica de transição de Estados
    if (sm.currentState === STATES.IDLE) {
        sm.currentState = STATES.FRAME_1;
        sm.timeInState = 0;
        currentDuration = DURATIONS[STATES.FRAME_1];
    } 
    else if (sm.timeInState >= currentDuration) {
        // O tempo do frame atual acabou, avança para o próximo
        if (sm.currentState === STATES.FRAME_1) sm.currentState = STATES.FRAME_2;
        else if (sm.currentState === STATES.FRAME_2) sm.currentState = STATES.FRAME_3;
        else if (sm.currentState === STATES.FRAME_3) sm.currentState = STATES.FRAME_4;
        else if (sm.currentState === STATES.FRAME_4) sm.currentState = STATES.FRAME_3; // LOOP do Farm

        sm.timeInState = 0; // Reseta o cronômetro para o novo estado
        currentDuration = DURATIONS[sm.currentState];
    }

    // 3. Calculando o progresso real (de 0.0 a 1.0)
    let t = currentDuration > 0 ? (sm.timeInState / currentDuration) : 0;
    
    // Matemática de Ease-Out (começa rápido, termina suave no limite da pose)
    let easeOutProgress = 1 - Math.pow(1 - t, 3);

    return {
        targetPose: sm.currentState,
        lerpFactor: (sm.currentState === STATES.FRAME_1) ? 0.15 : 0.3,
        progress: easeOutProgress 
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
