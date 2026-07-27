/**
 * SixSevenAction
 * PRIORIDADE 04 (Esquerda) e 05 (Direita) + Animação de Pernas
 * Máquinas de estado independentes com velocidade dinâmica baseada nos cliques.
 */

const STATES = {
    // Braços e Tronco
    IDLE: 'IDLE',
    FRAME_1: 'six_seven_ready_pose',
    FRAME_2: 'six_seven_left_arm_high_pose',
    FRAME_3: 'six_seven_cross_limit_pose',
    FRAME_4: 'six_seven_reverse_limit_pose',
    
    // Pernas
    LEG_IDLE: 'leg_idle_pose',
    LEG_LIFT: 'six_seven_feminino_leg_lift' // A pose com a perna esquerda levantada
};

// Duração base de cada estado (em segundos)
// Esta é a velocidade "normal". O speedMultiplier vai acelerar ou desacelerar isso.
const DURATIONS = {
    [STATES.IDLE]: 0.5,
    [STATES.FRAME_1]: 0.15, 
    [STATES.FRAME_2]: 0.10, 
    [STATES.FRAME_3]: 0.12, 
    [STATES.FRAME_4]: 0.12,
    [STATES.LEG_IDLE]: 0.5,
    [STATES.LEG_LIFT]: 0.35 // Tempo de suspensão da perna
};

const createStateMachine = (initialState) => ({
    currentState: initialState,
    timeInState: 0
});

const instances = {};

const getInstance = (uuid) => {
    if (!instances[uuid]) {
        instances[uuid] = {
            leftSM: createStateMachine(STATES.IDLE),
            rightSM: createStateMachine(STATES.IDLE),
            legSM: createStateMachine(STATES.LEG_IDLE) // Nova máquina para as pernas
        };
    }
    return instances[uuid];
};

// Função genérica para atualizar braços
const updateArmMachine = (sm, isActive, delta, speedMultiplier) => {
    if (!isActive) {
        if (sm.currentState !== STATES.IDLE) {
            sm.currentState = STATES.IDLE;
            sm.timeInState = 0;
        }
        return { targetPose: null, lerpFactor: 0.05, progress: 0 }; 
    }

    // A MÁGICA DA VELOCIDADE: Multiplicamos o delta pela velocidade do clique!
    // Se o jogador clica rápido (speedMultiplier = 2.0), o tempo passa 2x mais rápido.
    sm.timeInState += (delta * speedMultiplier);
    
    let currentDuration = DURATIONS[sm.currentState];

    if (sm.currentState === STATES.IDLE) {
        sm.currentState = STATES.FRAME_1;
        sm.timeInState = 0;
        currentDuration = DURATIONS[STATES.FRAME_1];
    } 
    else if (sm.timeInState >= currentDuration) {
        if (sm.currentState === STATES.FRAME_1) sm.currentState = STATES.FRAME_2;
        else if (sm.currentState === STATES.FRAME_2) sm.currentState = STATES.FRAME_3;
        else if (sm.currentState === STATES.FRAME_3) sm.currentState = STATES.FRAME_4;
        else if (sm.currentState === STATES.FRAME_4) sm.currentState = STATES.FRAME_3; // LOOP do Farm

        sm.timeInState = 0; 
        currentDuration = DURATIONS[sm.currentState];
    }

    let t = currentDuration > 0 ? (sm.timeInState / currentDuration) : 0;
    let easeOutProgress = 1 - Math.pow(1 - t, 3);

    return {
        targetPose: sm.currentState,
        lerpFactor: (sm.currentState === STATES.FRAME_1) ? 0.15 : 0.3,
        progress: easeOutProgress 
    };
};

// Função específica para atualizar as pernas de forma suave
const updateLegMachine = (sm, isAnyArmFarming, delta, speedMultiplier) => {
    // Se nenhum braço está farmando, desce a perna
    if (!isAnyArmFarming) {
        if (sm.currentState !== STATES.LEG_IDLE) {
            sm.currentState = STATES.LEG_IDLE;
            sm.timeInState = 0;
        }
        return { targetPose: STATES.LEG_IDLE, progress: 0.1 }; // Retorno suave
    }

    // Se estiver farmando, levanta a perna acompanhando o ritmo do farm
    sm.timeInState += (delta * speedMultiplier);
    
    if (sm.currentState === STATES.LEG_IDLE) {
        sm.currentState = STATES.LEG_LIFT;
        sm.timeInState = 0;
    }

    let currentDuration = DURATIONS[sm.currentState];
    let t = currentDuration > 0 ? (sm.timeInState / currentDuration) : 0;
    
    // Evita que o valor passe de 1.0 (mantém a perna no ar enquanto farma)
    let clampedT = Math.min(t, 1.0); 
    let easeOutProgress = 1 - Math.pow(1 - clampedT, 3);

    return {
        targetPose: sm.currentState,
        progress: easeOutProgress
    };
};

export const SixSevenAction = {
    // Adicionamos parâmetros de velocidade (1.0 é o normal. 0.5 é lento. 2.0 é frenético).
    update: (delta, isLeftFarming, isRightFarming, leftSpeed = 1.0, rightSpeed = 1.0, uuid = 'default') => {
        const inst = getInstance(uuid);
        
        // Verifica se algum lado da tela está sendo clicado
        const isAnyFarming = isLeftFarming || isRightFarming;
        // Usa a maior velocidade entre os dois lados para ditar o ritmo das pernas
        const legSpeed = Math.max(leftSpeed, rightSpeed);

        return {
            left: updateArmMachine(inst.leftSM, isLeftFarming, delta, leftSpeed),
            right: updateArmMachine(inst.rightSM, isRightFarming, delta, rightSpeed),
            legs: updateLegMachine(inst.legSM, isAnyFarming, delta, legSpeed)
        };
    }
};
