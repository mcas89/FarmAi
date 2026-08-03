import { create } from 'zustand';
import { useAuraSystem } from './useAuraSystem';
import { useUISystem } from './useUISystem';
import {
    cacheMapActivities,
    readCachedMapActivities,
    cacheOrbBank,
    readOrbBank,
} from '../utils/localGameCache';

export const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

export const getHourBucket = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`;
};

function mulberry32(a) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function daySeed(dayId) {
    let h = 0;
    for (let i = 0; i < dayId.length; i++) h = (Math.imul(31, h) + dayId.charCodeAt(i)) | 0;
    return h >>> 0;
}

/** Baús em gramado aberto (visíveis). */
export const CHEST_SPOTS = [
    [14, 0, 16],
    [-16, 0, 14],
    [18, 0, -18],
    [-22, 0, -12],
    [32, 0, 8],
    [-8, 0, 28],
];

/** Chaves perto de landmarks maiores / mais escondidas. */
export const KEY_SPOTS = [
    [31.5, 0.4, 32.5],   // playground climber
    [-28.5, 0.35, 32],   // mesa do mago
    [-21.5, 0.3, -26.5], // mesa piquenique
    [23.5, 0.5, 1.5],    // pipoqueiro
    [19.2, 0.35, 20.5],  // slide playground
    [-34, 0.3, -16],     // mesa NW
    [29, 0.3, -31],      // mesa SE
];

/** Posição da mesa do mago (substitui o foodtruck). */
export const MAGE_TABLE_POS = [-30, 0, 30];

const POTION_COUNT = 5;
/** Orbes ativas no mapa ao mesmo tempo (só multiplayer). */
const MAP_ORB_ACTIVE = 8;
/** Limite diário de orbes que podem nascer/ser coletadas no online. */
const MAP_ORB_DAILY_CAP = 500;

function pickPotionSpots(hourId) {
    const random = mulberry32(daySeed(hourId) ^ 0x9e3779b9);
    const spots = [];
    let guard = 0;
    while (spots.length < POTION_COUNT && guard < 200) {
        guard++;
        const x = (random() - 0.5) * 70;
        const z = (random() - 0.5) * 70;
        const dist = Math.hypot(x, z);
        const inCross = Math.abs(x) < 8 || Math.abs(z) < 8;
        const nearFountain = dist < 10;
        const nearShop = Math.hypot(x + 8, z + 10) < 5;
        if (dist < 18 || dist > 42 || inCross || nearFountain || nearShop) continue;
        const tooClose = spots.some((s) => Math.hypot(s.x - x, s.z - z) < 8);
        if (tooClose) continue;
        spots.push({ id: spots.length, x, z, collected: false });
    }
    while (spots.length < POTION_COUNT) {
        const i = spots.length;
        const ang = (i / POTION_COUNT) * Math.PI * 2 + 0.4;
        spots.push({
            id: i,
            x: Math.cos(ang) * 24,
            z: Math.sin(ang) * 24,
            collected: false,
        });
    }
    return spots;
}

function pickOneMapOrbSpot(dayId, salt, existing) {
    const random = mulberry32((daySeed(dayId) ^ 0xc0ffee ^ (salt * 2654435761)) >>> 0);
    for (let guard = 0; guard < 80; guard++) {
        const x = (random() - 0.5) * 72;
        const z = (random() - 0.5) * 72;
        const dist = Math.hypot(x, z);
        const inCross = Math.abs(x) < 7 || Math.abs(z) < 7;
        const nearFountain = dist < 11;
        const nearMage = Math.hypot(x - MAGE_TABLE_POS[0], z - MAGE_TABLE_POS[2]) < 6;
        const nearShop = Math.hypot(x + 8, z + 10) < 5;
        if (dist < 16 || dist > 44 || inCross || nearFountain || nearMage || nearShop) continue;
        const tooClose = existing.some((s) => Math.hypot(s.x - x, s.z - z) < 7);
        if (tooClose) continue;
        return { x, z };
    }
    const ang = (salt % 12) * 0.52 + 1.1;
    return { x: Math.cos(ang) * 26, z: Math.sin(ang) * 26 };
}

/** Até 8 orbes vivas no chão. */
function spawnActiveMapOrbs(dayId, startId = 0, count = MAP_ORB_ACTIVE) {
    const spots = [];
    let id = startId;
    for (let i = 0; i < count; i++) {
        const pos = pickOneMapOrbSpot(dayId, id + 17 + i * 3, spots);
        spots.push({ id: id++, x: pos.x, z: pos.z, collected: false });
    }
    return { orbs: spots, nextId: id };
}

function buildDayLayout(dayId) {
    const random = mulberry32(daySeed(dayId));
    const chestIndex = Math.floor(random() * CHEST_SPOTS.length);
    let keyIndex = Math.floor(random() * KEY_SPOTS.length);
    // Evita chave colada no baú
    const cx = CHEST_SPOTS[chestIndex][0];
    const cz = CHEST_SPOTS[chestIndex][2];
    let tries = 0;
    while (Math.hypot(KEY_SPOTS[keyIndex][0] - cx, KEY_SPOTS[keyIndex][2] - cz) < 12 && tries < 12) {
        keyIndex = (keyIndex + 1) % KEY_SPOTS.length;
        tries++;
    }
    // Alvo de combo: 30–500 (mais chance em faixas jogáveis)
    const fountainTarget = 30 + Math.floor(random() * 471);
    return { chestIndex, keyIndex, fountainTarget };
}

const FOUNTAIN_GEM_COUNT = 5;

const emptyGems = () =>
    Array.from({ length: FOUNTAIN_GEM_COUNT }, (_, i) => ({
        id: i,
        collected: false,
        x: 0,
        y: 1.2,
        z: 0,
    }));

function spawnFountainGems() {
    return emptyGems().map((g, i) => {
        const ang = (i / FOUNTAIN_GEM_COUNT) * Math.PI * 2;
        const r = 5.5 + (i % 3) * 0.45;
        return {
            ...g,
            x: Math.cos(ang) * r,
            y: 1.1 + (i % 2) * 0.12,
            z: Math.sin(ang) * r,
            collected: false,
        };
    });
}

function randomFountainTarget() {
    return 30 + Math.floor(Math.random() * 471);
}

let persistTimer = null;
function persistSoon() {
    // Não grava localStorage aqui de forma síncrona no mesmo instante do collect —
    // agenda tudo junto no debounce (menos hitch no iOS).
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        persistTimer = null;
        const latest = useMapActivitiesSystem.getState().getPersistable();
        cacheMapActivities(latest);
        import('./useDatabaseSystem').then((dbSys) => {
            dbSys.useDatabaseSystem.getState().saveMapActivities(latest);
        });
    }, 1500);
}

export const CHEST_REWARD = 30;
export const FOUNTAIN_REWARD = FOUNTAIN_GEM_COUNT;

export const useMapActivitiesSystem = create((set, get) => ({
    ready: false,
    dayId: '',
    chestIndex: 0,
    keyIndex: 0,
    keyFound: false,
    chestOpened: false,

    fountainTarget: 100,
    fountainState: 'idle', // idle | challenge | raining | done
    fountainPromptDismissed: false,
    gems: emptyGems(),

    potionHourId: '',
    potionSpawns: [],

    /** Banco permanente de orbes vermelhas (acumula ao coletar no mapa). */
    orbBank: 0,
    /** Quantas orbes já foram coletadas hoje (cap 500, só multiplayer). */
    orbsCollectedToday: 0,
    /** Até 8 orbes ativas no chão (online). */
    mapOrbs: [],
    orbSpawnSeq: 0,

    mapToast: null, // { text, until }

    // Proximidade (banner interativo no topo)
    nearFountain: false,
    nearShop: false,
    nearChest: false,
    nearMageTable: false,

    // Dicas rotativas no topo
    tipIndex: 0,

    showToast: (text, ms = 3500) => {
        set({ mapToast: { text, until: Date.now() + ms } });
    },

    clearToastIfExpired: () => {
        const t = get().mapToast;
        if (t && Date.now() > t.until) set({ mapToast: null });
    },

    setNearFountain: (v) => set((s) => (s.nearFountain === v ? s : { nearFountain: v })),
    setNearShop: (v) => set((s) => (s.nearShop === v ? s : { nearShop: v })),
    setNearChest: (v) => set((s) => (s.nearChest === v ? s : { nearChest: v })),
    setNearMageTable: (v) => set((s) => (s.nearMageTable === v ? s : { nearMageTable: v })),

    /** Dicas ainda pendentes (intercala; some ao concluir). */
    getGuideTips: () => {
        const s = get();
        const tips = [];

        if (!s.chestOpened) {
            tips.push({
                id: 'chest',
                color: '#f59e0b',
                title: 'Baú diário',
                text: s.keyFound
                    ? `Você já tem a chave! Encontre o baú no parque e abra para ganhar ${CHEST_REWARD} AuraCash.`
                    : `Encontre a chave escondida no parque e abra o baú para ganhar ${CHEST_REWARD} AuraCash.`,
            });
        }

        if (s.fountainState === 'idle') {
            tips.push({
                id: 'fountain',
                color: '#38bdf8',
                title: 'Missão da fonte',
                text: `Vá até a fonte no centro da praça para receber uma missão de combo e ganhar ${FOUNTAIN_REWARD} AuraCash.`,
            });
        } else if (s.fountainState === 'challenge') {
            tips.push({
                id: 'fountain_challenge',
                color: '#38bdf8',
                title: 'Missão da fonte',
                text: `Alcance exatamente o combo ${s.fountainTarget} para a fonte liberar ${FOUNTAIN_REWARD} AuraCash.`,
            });
        } else if (s.fountainState === 'raining') {
            tips.push({
                id: 'fountain_gems',
                color: '#a855f7',
                title: 'Colete os AuraCash',
                text: `A fonte liberou ${FOUNTAIN_REWARD} AuraCash! Ande perto deles para recolher.`,
            });
        }

        const left = s.potionSpawns.filter((p) => !p.collected).length;
        if (left > 0) {
            tips.push({
                id: 'potions',
                color: '#34d399',
                title: 'Poções 2x no mapa',
                text: `Procure ${left} ${left > 1 ? 'poções' : 'poção'} 2x espalhada${left > 1 ? 's' : ''} pelo parque. Ao pegar, vão para o inventário.`,
            });
        }

        const orbsLeftToday = Math.max(0, MAP_ORB_DAILY_CAP - (s.orbsCollectedToday || 0));
        if (orbsLeftToday > 0) {
            tips.push({
                id: 'orbs',
                color: '#f87171',
                title: 'Orbes vermelhas (online)',
                text: `Multiplayer: até 8 no mapa. Restam ${orbsLeftToday} orbes hoje (máx. ${MAP_ORB_DAILY_CAP}/dia). Banco: ${s.orbBank}.`,
            });
        }

        return tips;
    },

    advanceTip: () => {
        const tips = get().getGuideTips();
        if (tips.length <= 1) {
            set({ tipIndex: 0 });
            return;
        }
        set({ tipIndex: (get().tipIndex + 1) % tips.length });
    },

    /** Banner prioritário: proximidade > dica rotativa. */
    getTopBanner: () => {
        const s = get();

        if (s.nearFountain && s.fountainState !== 'done') {
            const combo = useAuraSystem.getState().comboCount || 0;
            if (s.fountainState === 'idle') {
                return {
                    kind: 'fountain_accept',
                    color: '#38bdf8',
                    title: 'Desafio da Fonte',
                    text: `Bem-vindo à fonte! Aceite a missão: farmar até alcançar exatamente o combo ${s.fountainTarget}. Ao acertar, a fonte libera ${FOUNTAIN_REWARD} AuraCash para você recolher.`,
                    actionLabel: 'Aceitar missão',
                    action: 'accept_fountain',
                };
            }
            if (s.fountainState === 'challenge') {
                return {
                    kind: 'fountain_progress',
                    color: '#38bdf8',
                    title: 'Desafio da Fonte',
                    text: `Missão ativa: alcance exatamente o combo ${s.fountainTarget}. Combo atual: ${combo}. Se passar do número, quebre o combo e tente de novo.`,
                    actionLabel: null,
                    action: null,
                };
            }
            if (s.fountainState === 'raining') {
                return {
                    kind: 'fountain_collect',
                    color: '#a855f7',
                    title: 'Recolha os AuraCash',
                    text: `A fonte liberou ${FOUNTAIN_REWARD} AuraCash ao redor! Ande perto de cada diamante para recolher.`,
                    actionLabel: null,
                    action: null,
                };
            }
        }

        if (s.nearShop) {
            return {
                kind: 'shop',
                color: '#a855f7',
                title: 'Máquina de Poções',
                text: 'Você está na máquina de poções! Abra a loja para comprar poções que multiplicam a Aura (2x, 3x, 5x e 10x) por alguns minutos.',
                actionLabel: 'Abrir loja de poções',
                action: 'open_shop',
            };
        }

        if (s.nearMageTable) {
            return {
                kind: 'mage_table',
                color: '#f87171',
                title: 'Mesa do Mago',
                text: `Banco de orbes: ${s.orbBank}. Hoje: ${s.orbsCollectedToday || 0}/${MAP_ORB_DAILY_CAP}. Em breve: trocas de orbes por poderes.`,
                actionLabel: null,
                action: null,
            };
        }

        if (s.nearChest && !s.chestOpened) {
            if (s.keyFound) {
                return {
                    kind: 'chest_open',
                    color: '#34d399',
                    title: 'Baú diário',
                    text: `Você encontrou o baú e tem a chave! Toque para abrir e receber ${CHEST_REWARD} AuraCash.`,
                    actionLabel: `Abrir baú (+${CHEST_REWARD} AuraCash)`,
                    action: 'open_chest',
                };
            }
            return {
                kind: 'chest_locked',
                color: '#f59e0b',
                title: 'Baú trancado',
                text: `Este baú contém ${CHEST_REWARD} AuraCash, mas está trancado. Explore o parque e encontre a chave escondida perto de objetos grandes.`,
                actionLabel: null,
                action: null,
            };
        }

        const tips = get().getGuideTips();
        if (!tips.length) return null;
        const tip = tips[s.tipIndex % tips.length];
        return {
            kind: 'tip',
            color: tip.color,
            title: tip.title,
            text: tip.text,
            actionLabel: null,
            action: null,
        };
    },

    getPersistable: () => {
        const s = get();
        return {
            dayId: s.dayId,
            chestIndex: s.chestIndex,
            keyIndex: s.keyIndex,
            keyFound: s.keyFound,
            chestOpened: s.chestOpened,
            fountainTarget: s.fountainTarget,
            fountainState: s.fountainState,
            gemsCollected: s.gems.filter((g) => g.collected).map((g) => g.id),
            potionHourId: s.potionHourId,
            potionsCollected: s.potionSpawns.filter((p) => p.collected).map((p) => p.id),
            orbBank: s.orbBank,
            orbsCollectedToday: s.orbsCollectedToday || 0,
        };
    },

    hydrate: (saved) => {
        const dayId = getTodayDateString();
        const hourId = getHourBucket();
        const layout = buildDayLayout(dayId);
        const localMap = readCachedMapActivities();

        // Preferir cache local do mesmo dia/hora se tiver mais progresso (ex.: poções)
        let effective = saved;
        if (localMap && localMap.dayId === dayId) {
            if (!saved || saved.dayId !== dayId) {
                effective = localMap;
            } else {
                const localPotions = (localMap.potionsCollected || []).length;
                const serverPotions = (saved.potionsCollected || []).length;
                const localToday = Number(localMap.orbsCollectedToday) || 0;
                const serverToday = Number(saved.orbsCollectedToday) || 0;
                const localAhead =
                    localPotions > serverPotions ||
                    localToday > serverToday ||
                    (Number(localMap.orbBank) || 0) > (Number(saved.orbBank) || 0) ||
                    (!!localMap.keyFound && !saved.keyFound) ||
                    (!!localMap.chestOpened && !saved.chestOpened);
                if (localAhead) effective = { ...saved, ...localMap };
            }
        }

        if (!effective || effective.dayId !== dayId) {
            const orbBank = readOrbBank(effective?.orbBank);
            const { orbs, nextId } = spawnActiveMapOrbs(dayId, 0, MAP_ORB_ACTIVE);
            set({
                ready: true,
                dayId,
                chestIndex: layout.chestIndex,
                keyIndex: layout.keyIndex,
                keyFound: false,
                chestOpened: false,
                fountainTarget: layout.fountainTarget,
                fountainState: 'idle',
                fountainPromptDismissed: false,
                gems: emptyGems(),
                potionHourId: hourId,
                potionSpawns: pickPotionSpots(hourId),
                orbBank,
                orbsCollectedToday: 0,
                mapOrbs: orbs,
                orbSpawnSeq: nextId,
            });
            cacheOrbBank(orbBank);
            persistSoon();
            return;
        }

        const sameHour = effective.potionHourId === hourId;
        const potions = sameHour
            ? pickPotionSpots(hourId).map((p) => ({
                  ...p,
                  collected: (effective.potionsCollected || []).includes(p.id),
              }))
            : pickPotionSpots(hourId);

        const orbBank = readOrbBank(effective.orbBank);
        const orbsCollectedToday = Math.min(
            MAP_ORB_DAILY_CAP,
            Math.max(0, Number(effective.orbsCollectedToday) || 0)
        );
        const remaining = Math.max(0, MAP_ORB_DAILY_CAP - orbsCollectedToday);
        const activeCount = Math.min(MAP_ORB_ACTIVE, remaining);
        const { orbs, nextId } = spawnActiveMapOrbs(dayId, orbsCollectedToday + 1, activeCount);

        // Fonte não bloqueia o dia — sempre disponível na próxima entrada no mapa
        set({
            ready: true,
            dayId,
            chestIndex: effective.chestIndex ?? layout.chestIndex,
            keyIndex: effective.keyIndex ?? layout.keyIndex,
            keyFound: !!effective.keyFound,
            chestOpened: !!effective.chestOpened,
            fountainTarget: randomFountainTarget(),
            fountainState: 'idle',
            fountainPromptDismissed: false,
            gems: emptyGems(),
            potionHourId: hourId,
            potionSpawns: potions,
            orbBank,
            orbsCollectedToday,
            mapOrbs: orbs,
            orbSpawnSeq: nextId,
        });
        cacheOrbBank(orbBank);

        if (!sameHour) persistSoon();
    },

    /** Garante 8 orbes no chão se ainda houver cota diária (multiplayer). */
    refillMapOrbsIfNeeded: () => {
        const s = get();
        const remaining = Math.max(0, MAP_ORB_DAILY_CAP - (s.orbsCollectedToday || 0));
        if (remaining <= 0) {
            if (s.mapOrbs.length) set({ mapOrbs: [] });
            return;
        }
        const need = Math.min(MAP_ORB_ACTIVE, remaining) - s.mapOrbs.filter((o) => !o.collected).length;
        if (need <= 0) return;
        let seq = s.orbSpawnSeq || 0;
        const next = [...s.mapOrbs.filter((o) => !o.collected)];
        for (let i = 0; i < need; i++) {
            const pos = pickOneMapOrbSpot(s.dayId || getTodayDateString(), seq + 41 + i * 5, next);
            next.push({ id: seq++, x: pos.x, z: pos.z, collected: false });
        }
        set({ mapOrbs: next, orbSpawnSeq: seq });
    },

    /**
     * Garante dia/hora ao entrar no mapa.
     * @param {{ resetFountain?: boolean }} opts — resetFountain: nova missão da fonte (só no enter)
     */
    ensureActive: (opts = {}) => {
        const dayId = getTodayDateString();
        const hourId = getHourBucket();
        const s = get();

        if (!s.ready) {
            get().hydrate(null);
            if (opts.resetFountain) {
                get().resetFountainMission();
            }
            return;
        }

        if (s.dayId !== dayId) {
            get().hydrate({ dayId: '__reset__' });
            if (opts.resetFountain) {
                get().resetFountainMission();
            }
            return;
        }

        if (s.potionHourId !== hourId) {
            set({
                potionHourId: hourId,
                potionSpawns: pickPotionSpots(hourId),
            });
            persistSoon();
            get().showToast('Novas poções 2x apareceram no parque!', 4000);
        }

        if (opts.resetFountain) {
            get().resetFountainMission();
        }
    },

    /** Nova missão da fonte a cada entrada no mapa (não é 1×/dia). */
    resetFountainMission: () => {
        set({
            fountainState: 'idle',
            fountainPromptDismissed: false,
            fountainTarget: randomFountainTarget(),
            gems: emptyGems(),
        });
    },

    getChestPosition: () => CHEST_SPOTS[get().chestIndex] || CHEST_SPOTS[0],
    getKeyPosition: () => KEY_SPOTS[get().keyIndex] || KEY_SPOTS[0],

    collectKey: () => {
        if (get().keyFound || get().chestOpened) return false;
        set({ keyFound: true });
        get().showToast('Chave encontrada! Abra o baú no parque.', 4000);
        persistSoon();
        return true;
    },

    openChest: () => {
        const s = get();
        if (s.chestOpened) return { ok: false, reason: 'already' };
        if (!s.keyFound) return { ok: false, reason: 'locked' };

        set({ chestOpened: true });
        const reward = CHEST_REWARD;
        import('./useUISystem').then((ui) => {
            const cur = ui.useUISystem.getState().playerStats.diamonds || 0;
            ui.useUISystem.getState().updateStats({ diamonds: cur + reward });
        });
        get().showToast(`+${reward} AuraCash do baú diário!`, 4000);
        persistSoon();
        return { ok: true, reward };
    },

    startFountainChallenge: () => {
        const s = get();
        if (s.fountainState !== 'idle') return false;
        set({ fountainState: 'challenge', fountainPromptDismissed: true });
        get().showToast(
            `Fonte: alcance exatamente o combo ${s.fountainTarget}!`,
            5000
        );
        return true;
    },

    dismissFountainPrompt: () => set({ fountainPromptDismissed: true }),

    /** Só libera se o combo atual for exatamente o pedido. */
    tryCompleteFountainCombo: (comboCount) => {
        const s = get();
        if (s.fountainState !== 'challenge') return false;
        if (comboCount !== s.fountainTarget) return false;

        const gems = spawnFountainGems();
        set({ fountainState: 'raining', gems });
        get().showToast(`A fonte liberou ${FOUNTAIN_REWARD} AuraCash! Recolha!`, 4500);
        return true;
    },

    collectGem: (gemId) => {
        const s = get();
        if (s.fountainState !== 'raining') return false;
        const gems = s.gems.map((g) =>
            g.id === gemId && !g.collected ? { ...g, collected: true } : g
        );
        const gem = s.gems.find((g) => g.id === gemId);
        if (!gem || gem.collected) return false;

        import('./useUISystem').then((ui) => {
            const cur = ui.useUISystem.getState().playerStats.diamonds || 0;
            ui.useUISystem.getState().updateStats({ diamonds: cur + 1 });
        });

        const allDone = gems.every((g) => g.collected);
        set({
            gems,
            fountainState: allDone ? 'done' : 'raining',
        });
        if (allDone) {
            get().showToast(`Você recolheu os ${FOUNTAIN_REWARD} AuraCash da fonte!`, 3500);
        }
        return true;
    },

    collectPotion: (potionId) => {
        const s = get();
        const spot = s.potionSpawns.find((p) => p.id === potionId);
        if (!spot || spot.collected) return false;

        // Tudo adiado — o useFrame só esconde a mesh; store/UI/cache no próximo ciclo
        setTimeout(() => {
            const cur = get();
            const live = cur.potionSpawns.find((p) => p.id === potionId);
            if (!live || live.collected) return;

            set({
                potionSpawns: cur.potionSpawns.map((p) =>
                    p.id === potionId ? { ...p, collected: true } : p
                ),
            });

            useUISystem.getState().addPotionToInventory({
                name: 'Poção 2x (Mapa)',
                multiplier: 2,
                price: 0,
                source: 'map',
            });
            get().showToast('Poção 2x adicionada ao inventário!', 3500);
            persistSoon();
        }, 48);

        return true;
    },

    collectMapOrb: (orbId) => {
        const s = get();
        if (!useUISystem.getState().isOnlineMode) return false;

        const spot = s.mapOrbs.find((o) => o.id === orbId);
        if (!spot || spot.collected) return false;
        if ((s.orbsCollectedToday || 0) >= MAP_ORB_DAILY_CAP) return false;

        setTimeout(() => {
            const cur = get();
            if (!useUISystem.getState().isOnlineMode) return;
            const live = cur.mapOrbs.find((o) => o.id === orbId);
            if (!live || live.collected) return;
            if ((cur.orbsCollectedToday || 0) >= MAP_ORB_DAILY_CAP) return;

            const nextBank = (cur.orbBank || 0) + 1;
            const nextToday = (cur.orbsCollectedToday || 0) + 1;
            let seq = cur.orbSpawnSeq || 0;
            const remaining = [...cur.mapOrbs.filter((o) => o.id !== orbId && !o.collected)];

            // Mantém até 8 no chão enquanto houver cota do dia
            if (nextToday < MAP_ORB_DAILY_CAP && remaining.length < MAP_ORB_ACTIVE) {
                const pos = pickOneMapOrbSpot(
                    cur.dayId || getTodayDateString(),
                    seq + 99,
                    remaining
                );
                remaining.push({ id: seq++, x: pos.x, z: pos.z, collected: false });
            }

            set({
                mapOrbs: remaining,
                orbBank: nextBank,
                orbsCollectedToday: nextToday,
                orbSpawnSeq: seq,
            });
            cacheOrbBank(nextBank);
            get().showToast(
                `+1 orbe · banco ${nextBank} · hoje ${nextToday}/${MAP_ORB_DAILY_CAP}`,
                2800
            );
            persistSoon();
        }, 48);

        return true;
    },
}));
