import { create } from 'zustand';
import { useAuraSystem } from './useAuraSystem';

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
    [-28.5, 0.35, 32],   // foodtruck
    [-21.5, 0.3, -26.5], // mesa piquenique
    [23.5, 0.5, 1.5],    // pipoqueiro
    [19.2, 0.35, 20.5],  // slide playground
    [-34, 0.3, -16],     // mesa NW
    [29, 0.3, -31],      // mesa SE
];

const POTION_COUNT = 5;

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
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        persistTimer = null;
        import('./useDatabaseSystem').then((dbSys) => {
            const payload = useMapActivitiesSystem.getState().getPersistable();
            dbSys.useDatabaseSystem.getState().saveMapActivities(payload);
        });
    }, 400);
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

    mapToast: null, // { text, until }

    // Proximidade (banner interativo no topo)
    nearFountain: false,
    nearShop: false,
    nearChest: false,

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
        };
    },

    hydrate: (saved) => {
        const dayId = getTodayDateString();
        const hourId = getHourBucket();
        const layout = buildDayLayout(dayId);

        if (!saved || saved.dayId !== dayId) {
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
            });
            persistSoon();
            return;
        }

        const sameHour = saved.potionHourId === hourId;
        const potions = sameHour
            ? pickPotionSpots(hourId).map((p) => ({
                  ...p,
                  collected: (saved.potionsCollected || []).includes(p.id),
              }))
            : pickPotionSpots(hourId);

        // Fonte não bloqueia o dia — sempre disponível na próxima entrada no mapa
        set({
            ready: true,
            dayId,
            chestIndex: saved.chestIndex ?? layout.chestIndex,
            keyIndex: saved.keyIndex ?? layout.keyIndex,
            keyFound: !!saved.keyFound,
            chestOpened: !!saved.chestOpened,
            fountainTarget: randomFountainTarget(),
            fountainState: 'idle',
            fountainPromptDismissed: false,
            gems: emptyGems(),
            potionHourId: hourId,
            potionSpawns: potions,
        });

        if (!sameHour) persistSoon();
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

        set({
            potionSpawns: s.potionSpawns.map((p) =>
                p.id === potionId ? { ...p, collected: true } : p
            ),
        });

        import('./useUISystem').then((ui) => {
            ui.useUISystem.getState().addPotionToInventory({
                name: 'Poção 2x (Mapa)',
                multiplier: 2,
                price: 0,
                source: 'map',
            });
            import('./useDatabaseSystem').then((dbSys) => {
                import('./usePlayerSystem').then((pMod) => {
                    import('./useAuraSystem').then((aMod) => {
                        const pos = pMod.usePlayerSystem.getState().position;
                        const model = pMod.usePlayerSystem.getState().activeModel;
                        const { comboCount, maxCombo, aura, weeklyAura } =
                            aMod.useAuraSystem.getState();
                        const diamonds = ui.useUISystem.getState().playerStats.diamonds;
                        const inventory = ui.useUISystem.getState().inventory;
                        dbSys.useDatabaseSystem.getState().saveGameState(
                            pos,
                            comboCount,
                            model,
                            aura,
                            diamonds,
                            maxCombo,
                            undefined,
                            undefined,
                            weeklyAura,
                            undefined,
                            undefined,
                            undefined,
                            inventory
                        );
                    });
                });
            });
        });

        get().showToast('Poção 2x adicionada ao inventário!', 3500);
        persistSoon();
        return true;
    },
}));
