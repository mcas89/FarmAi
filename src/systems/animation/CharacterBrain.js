/**
 * CharacterBrain
 * O "Cérebro" do personagem: escolhe UM gesto orgânico por vez (nunca vários
 * disputando os mesmos ossos ao mesmo tempo), anima ele em 3 fases
 * (subida -> pausa -> volta) e só começa a voltar depois que o gesto
 * realmente chegou perto do alvo.
 *
 * Cada osso é controlado como {x, y, z}, no mesmo formato das poses
 * capturadas (posições_3d.txt) — assim, poses novas podem ser coladas
 * direto em GESTURES sem precisar converter nada.
 *
 * IMPORTANTE: os valores de cada gesto abaixo são DELTAS em relação à
 * "posição inicial" (mãos pra baixo, pernas retas), não a rotação
 * absoluta do osso. Ou seja: delta = pose_capturada - pose_inicial.
 * Se o seu sistema de blend espera valor absoluto em vez de delta, avise
 * que a conversão é trocar `joints: () => ({...})` para os valores crus.
 *
 * Trabalha na PRIORIDADE 02 (acima da Vida, abaixo das Ações diretas).
 */

// Ossos controlados como rotação {x,y,z}. Cada um começa em 0 (= nenhuma
// alteração sobre a pose base) e só se move quando um gesto o usa.
const BONES = [
    'leftShoulder', 'rightShoulder',
    'leftUpperArm', 'rightUpperArm',
    'leftLowerArm', 'rightLowerArm',
    'leftHand', 'rightHand',
    'hips', 'spine',
    'leftUpperLeg', 'rightUpperLeg',
    'leftLowerLeg', 'rightLowerLeg',
    'leftFoot', 'rightFoot',
];

const current = {};
BONES.forEach(b => (current[b] = { x: 0, y: 0, z: 0 }));

// Cabeça/pescoço continuam num sistema próprio de "olhar" (não vêm do
// arquivo de poses, são calculados como direção de olhar).
const look = { headLookX: 0, headLookY: 0, neckTwitch: 0 };
let hipsPosY = 0; // posição vertical do quadril (reservado p/ agachar/pular futuramente)

let breath = { active: false, multiplier: 1.0, duration: 0 };
let breathCooldown = 5 + Math.random() * 10;

// Preenche x/y/z que não foram especificados no gesto com 0
function normalizeBone(partial) {
    return { x: partial.x || 0, y: partial.y || 0, z: partial.z || 0 };
}
function normalizeTargets(raw) {
    const out = {};
    for (const bone in raw) out[bone] = normalizeBone(raw[bone]);
    return out;
}

// ==========================================
// CATÁLOGO DE GESTOS
// Cada gesto é UM movimento completo e coerente (nunca um pedaço de um
// gesto se misturando com pedaço de outro).
//   weight = chance relativa de ser sorteado (gestos maiores = mais raros)
//   rise   = velocidade pra alcançar o alvo (maior = mais rápido/vivo)
//   fall   = velocidade de retorno ao neutro
//   hold   = [min, max] segundos que o gesto "segura" a pose antes de voltar
//   joints = função que devolve { osso: {x,y,z}, ... } — só precisa citar
//            os ossos e eixos que esse gesto realmente muda.
//   look   = (opcional) também move a cabeça/pescoço junto com o gesto
// ==========================================
const GESTURES = [
    {
        name: 'olharDireita', weight: 3, rise: 0.09, fall: 0.06, hold: [1.2, 2.5],
        joints: () => ({}),
        look: () => ({ headLookY: 0.4 + Math.random() * 0.3 }),
    },
    {
        name: 'olharEsquerda', weight: 3, rise: 0.09, fall: 0.06, hold: [1.2, 2.5],
        joints: () => ({}),
        look: () => ({ headLookY: -0.4 - Math.random() * 0.3 }),
    },
    {
        name: 'olharBaixo', weight: 2, rise: 0.08, fall: 0.06, hold: [1.5, 3.0],
        joints: () => ({}),
        look: () => ({ headLookX: -0.2 - Math.random() * 0.3 }),
    },
    {
        name: 'tiquePescoco', weight: 2, rise: 0.15, fall: 0.08, hold: [0.3, 0.8],
        joints: () => ({}),
        look: () => ({
            neckTwitch: (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.1),
        }),
    },
    {
        name: 'alongamentoBracoEsq', weight: 1.5, rise: 0.05, fall: 0.05, hold: [1.0, 2.0],
        joints: () => ({
            leftUpperArm: { x: 0.15 + Math.random() * 0.15 },
            leftShoulder: { z: 0.12 },
        }),
    },
    {
        name: 'balancoBracoDir', weight: 1.5, rise: 0.06, fall: 0.05, hold: [0.8, 1.6],
        joints: () => ({
            rightUpperArm: { x: -0.35 - Math.random() * 0.2 },
            rightShoulder: { z: -0.15 },
        }),
    },
    {
        name: 'trocaDePeso', weight: 2, rise: 0.05, fall: 0.04, hold: [2.0, 4.0],
        joints: () => ({
            hips: { x: 0.15 },
            leftUpperLeg: { x: -0.2 },
            rightUpperLeg: { x: 0.1 },
        }),
    },
    {
        name: 'ajeitarPerna', weight: 1.2, rise: 0.06, fall: 0.05, hold: [1.0, 2.0],
        joints: () => ({
            leftUpperLeg: { x: -0.3 },
            leftLowerLeg: { x: 0.5 },
        }),
    },
    // ---- Gestos abaixo vieram das poses capturadas em posições_3d.txt ----
    {
        // "mão direita no rosto como se passasse a mão no cabelo"
        name: 'maoNoCabelo', weight: 0.5, rise: 0.05, fall: 0.04, hold: [1.5, 2.5],
        joints: () => ({
            rightUpperArm: { x: -1.51, y: -0.58 },
            rightLowerArm: { x: -0.54, y: 0.08, z: 1.68 },
            rightHand: { z: 0.57 },
        }),
        look: () => ({ headLookY: 0.3 }),
    },
    {
        // "posição de relaxar o pé direito, pequena dobra na perna e pé"
        name: 'relaxarPe', weight: 1.5, rise: 0.05, fall: 0.05, hold: [2.0, 4.0],
        joints: () => ({
            rightLowerLeg: { x: 0.66 },
            rightFoot: { x: 0.44 },
        }),
    },
    {
        // "virando o quadril no máximo para o lado esquerdo" — na prática é a
        // coluna que gira, o quadril em si não muda nos dados capturados.
        name: 'virarTorso', weight: 0.8, rise: 0.04, fall: 0.04, hold: [1.5, 2.5],
        joints: () => ({
            spine: { y: 0.84 },
        }),
        look: () => ({ headLookY: 0.3 }),
    },
    {
        // "torcendo a coluna no máximo pra trás pra alongar"
        name: 'alongarColuna', weight: 1.0, rise: 0.04, fall: 0.04, hold: [1.5, 3.0],
        joints: () => ({
            spine: { x: -0.18 },
        }),
    },
    {
        name: 'esticarPerna', weight: 0.7, rise: 0.05, fall: 0.05, hold: [1.0, 2.0],
        joints: () => ({
            rightUpperLeg: { x: -0.2 },
            rightLowerLeg: { x: 0.3 },
        }),
    },
];

const GESTURE_BY_NAME = Object.fromEntries(GESTURES.map(g => [g.name, g]));

// Marcos garantidos de tempo parado: sempre acontecem nessa ordem se o
// personagem ficar idle por muito tempo, dando "pontos altos" previsíveis
// no meio da aleatoriedade dos outros gestos.
const MILESTONES = [
    { at: 10, gesture: 'trocaDePeso' },
    { at: 20, gesture: 'relaxarPe' },
    { at: 40, gesture: 'virarTorso' },
    { at: 50, gesture: 'maoNoCabelo' },
    { at: 60, gesture: 'alongarColuna' },
];

let idleTimer = 0;
let firedMilestones = new Set();

// Só existe UM gesto de corpo ativo por vez — é isso que garante que os
// movimentos não pareçam aleatórios/desconexos: o personagem sempre termina
// um gesto antes de começar o próximo.
let active = null; // { def, targets, lookTargets, phase, phaseTimer }
let cooldown = 1.0; // pausa natural entre um gesto e outro
let lastGestureName = null;

function pickWeightedGesture() {
    const pool = GESTURES.filter(g => g.name !== lastGestureName);
    const total = pool.reduce((s, g) => s + g.weight, 0);
    let r = Math.random() * total;
    for (const g of pool) {
        r -= g.weight;
        if (r <= 0) return g;
    }
    return pool[pool.length - 1];
}

function startGesture(def) {
    active = {
        def,
        targets: normalizeTargets(def.joints()),
        lookTargets: def.look ? def.look() : {},
        phase: 'rising',
        phaseTimer: 0,
    };
}

function stepBones(targets, speed, current, eps) {
    let allArrived = true;
    for (const bone in targets) {
        for (const axis of ['x', 'y', 'z']) {
            current[bone][axis] += (targets[bone][axis] - current[bone][axis]) * speed;
            if (Math.abs(targets[bone][axis] - current[bone][axis]) > eps) allArrived = false;
        }
    }
    return allArrived;
}

function stepLook(targets, speed, eps) {
    let allArrived = true;
    for (const key in targets) {
        look[key] += (targets[key] - look[key]) * speed;
        if (Math.abs(targets[key] - look[key]) > eps) allArrived = false;
    }
    return allArrived;
}

export const CharacterBrain = {
    update: (delta, isIdle = false) => {
        if (isIdle) {
            idleTimer += delta;
        } else {
            idleTimer = 0;
            firedMilestones.clear();
            // Se o usuário assume o controle no meio de um gesto, manda ele pra
            // fase de retorno em vez de deixar o idle brigar com a ação do jogador.
            if (active && active.phase !== 'falling') active.phase = 'falling';
        }

        // Marcos garantidos de tempo parado
        if (isIdle) {
            for (const m of MILESTONES) {
                if (idleTimer >= m.at && !firedMilestones.has(m.at)) {
                    firedMilestones.add(m.at);
                    startGesture(GESTURE_BY_NAME[m.gesture]);
                }
            }
        }

        // Sorteio de gestos orgânicos — só quando parado e sem gesto ativo
        if (isIdle) {
            cooldown -= delta;
            if (!active && cooldown <= 0) {
                startGesture(pickWeightedGesture());
            }
        }

        // ==========================================
        // Motor de 3 fases: subir -> segurar -> voltar
        // ==========================================
        if (active) {
            const { def, targets, lookTargets } = active;
            const eps = 0.01;

            if (active.phase === 'rising') {
                const bonesArrived = stepBones(targets, def.rise, current, eps);
                const lookArrived = stepLook(lookTargets, def.rise, eps);
                if (bonesArrived && lookArrived) {
                    active.phase = 'holding';
                    const [min, max] = def.hold;
                    active.phaseTimer = min + Math.random() * (max - min);
                }
            } else if (active.phase === 'holding') {
                stepBones(targets, def.rise, current, eps);
                stepLook(lookTargets, def.rise, eps);
                active.phaseTimer -= delta;
                if (active.phaseTimer <= 0) active.phase = 'falling';
            } else {
                // falling
                const zeroBones = {};
                for (const bone in targets) zeroBones[bone] = { x: 0, y: 0, z: 0 };
                const zeroLook = {};
                for (const key in lookTargets) zeroLook[key] = 0;

                const bonesHome = stepBones(zeroBones, def.fall, current, eps);
                const lookHome = stepLook(zeroLook, def.fall, eps);
                if (bonesHome && lookHome) {
                    lastGestureName = def.name;
                    active = null;
                    cooldown = 1.5 + Math.random() * 3.5; // pausa natural até o próximo gesto
                }
            }
        }

        // Ossos que não pertencem ao gesto ativo relaxam suavemente até 0
        const activeTargets = active ? active.targets : {};
        BONES.forEach(bone => {
            if (!(bone in activeTargets)) {
                current[bone].x += (0 - current[bone].x) * 0.05;
                current[bone].y += (0 - current[bone].y) * 0.05;
                current[bone].z += (0 - current[bone].z) * 0.05;
            }
        });
        const activeLook = active ? active.lookTargets : {};
        if (!('neckTwitch' in activeLook)) look.neckTwitch += (0 - look.neckTwitch) * 0.05;

        // ==========================================
        // Respiração — independente, não briga com o resto do corpo
        // ==========================================
        if (isIdle) {
            breathCooldown -= delta;
            if (!breath.active && breathCooldown <= 0) {
                breath.active = true;
                breath.multiplier = 3.5;
                breath.duration = 2.5;
                breathCooldown = 8 + Math.random() * 12;
            }
        }
        if (breath.duration > 0) {
            breath.duration -= delta;
        } else {
            breath.active = false;
            breath.multiplier += (1.0 - breath.multiplier) * 0.02;
        }

        return {
            hipsPosY,
            hips: current.hips,
            spine: current.spine,
            head: { x: look.headLookX, y: look.headLookY },
            neck: {
                x: look.headLookX * 0.3,
                y: look.headLookY * 0.3 + look.neckTwitch,
                z: look.neckTwitch * 0.5,
            },
            leftShoulder: current.leftShoulder,
            rightShoulder: current.rightShoulder,
            leftUpperArm: current.leftUpperArm,
            rightUpperArm: current.rightUpperArm,
            leftLowerArm: current.leftLowerArm,
            rightLowerArm: current.rightLowerArm,
            leftHand: current.leftHand,
            rightHand: current.rightHand,
            leftUpperLeg: current.leftUpperLeg,
            leftLowerLeg: current.leftLowerLeg,
            rightUpperLeg: current.rightUpperLeg,
            rightLowerLeg: current.rightLowerLeg,
            leftFoot: current.leftFoot,
            rightFoot: current.rightFoot,
            breathMultiplier: breath.multiplier,
        };
    },
};
