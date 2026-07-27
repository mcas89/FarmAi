/**
 * SixSevenAction
 * PRIORIDADE 04 (Esquerda) e 05 (Direita)
 * Agora com cálculo dinâmico de velocidade de clique e proteção anti-travamento.
 */

const STATES = {
    IDLE: 'IDLE', 
    FRAME_1: 'six_seven_ready_pose',
    FRAME_2: 'six_seven_left_arm_high_pose',
    FRAME_3: 'six_seven_cross_limit_pose',
    FRAME_4: 'six_seven_reverse_limit_pose'
};

const createStateMachine = () => ({
    currentState: STATES.IDLE,
    timeInState: 0,
    timeSinceLastClick: 0,
    idleCooldown: 0,
    currentSpeed: 1.0, 
    wasActive: false
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
    // Conta o tempo livre para saber se o cara clica rápido ou devagar
    sm.timeSinceLastClick += delta;

    // Detecta o exato momento do clique (mudança de Falso para Verdadeiro)
    if (isActive && !sm.wasActive) {
        const tempoEntreCliques = sm.timeSinceLastClick;
        
        // Matemática de velocidade: Se clicou em 0.1s, fica super rápido. Se foi em 0.5s, fica normal/lento.
        sm.currentSpeed = Math.max(0.5, Math.min(3.0, 0.2 / (tempoEntreCliques + 0.01)));
        
        sm.timeSinceLastClick = 0; 
        sm.idleCooldown = 0; // Cancela a intenção de abaixar o braço
    }
    sm.wasActive = isActive;

    // CORREÇÃO DO BRAÇO TRAVADO: Em vez de cortar no frame 1, damos uma tolerância de 200ms
    if (!isActive) {
        sm.idleCooldown += delta;
        if (sm.idleCooldown > 0.2) { 
            sm.currentState = STATES.IDLE;
            sm.timeInState = 0;
            return { targetPose: null, lerpFactor: 0.1 }; 
        }
    } else {
        sm.idleCooldown = 0; // Se segurar o botão, não deixa abaixar
    }

    // O tempo passa mais rápido ou devagar dependendo da fúria do jogador
    sm.timeInState += (delta * sm.currentSpeed);
    const baseSpeed = 0.18; // Tempo alvo base por frame 

    if (sm.currentState === STATES.IDLE) {
        sm.currentState = STATES.FRAME_1;
        sm.timeInState = 0;
    } else if (sm.currentState === STATES.FRAME_1 && sm.timeInState > baseSpeed) {
        sm.currentState = STATES.FRAME_2;
        sm.timeInState = 0;
    } else if (sm.currentState === STATES.FRAME_2 && sm.timeInState > baseSpeed) {
        sm.currentState = STATES.FRAME_3;
        sm.timeInState = 0;
    } else if (sm.currentState === STATES.FRAME_3 && sm.timeInState > baseSpeed) {
        sm.currentState = STATES.FRAME_4;
        sm.timeInState = 0;
    } else if (sm.currentState === STATES.FRAME_4 && sm.timeInState > baseSpeed) {
        sm.currentState = STATES.FRAME_3; // LOOP: 3 -> 4 -> 3
        sm.timeInState = 0;
    }

    return {
        targetPose: sm.currentState,
        // Mantém a sua lógica original de interpolação, mas levemente mais ágil no início
        lerpFactor: (sm.currentState === STATES.FRAME_1) ? 0.15 : 0.25 
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
