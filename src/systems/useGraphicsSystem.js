import { create } from 'zustand';
import { detectGraphicsTier } from '../utils/graphicsDetection';

const STORAGE_KEY = 'farmaai_graphics_mode';
/** Mais pesado → mais leve (downgrade automático sobe o índice). */
const TIER_ORDER = ['high', 'medium', 'low', 'potato'];
const FPS_DOWNGRADE_THRESHOLD = 28;

export const QUALITY_PRESETS = {
    potato: {
        dpr: [0.65, 0.75],
        antialias: false,
        shadows: false,
        shadowMapSize: 256,
        propCastShadows: false,
        avatarCastShadows: false,
        powerPreference: 'low-power',
        particles: 'none',
        auraMode: 'off', // off | lite | full
        remoteAura: false,
        parkTrees: 8,
        parkBushes: 10,
        parkPoles: 4,
        plazaSegments: 24,
        duelEnvironment: false,
        duelMaxEffects: 2,
        duelParticlesNormal: 6,
        duelParticlesCombo: 10,
        duelProjectileLights: false,
        duelImpactLights: false,
        duelArenaPulse: false,
        duelSidePointLights: false,
        duelExtraDirectional: false,
        label: 'Mínimo',
    },
    low: {
        dpr: 1,
        antialias: false,
        shadows: false, // fill-rate alto em mobile — off no Baixo
        shadowMapSize: 512,
        propCastShadows: false,
        avatarCastShadows: false,
        powerPreference: 'low-power',
        particles: 'reduced',
        auraMode: 'lite',
        remoteAura: false,
        parkTrees: 14,
        parkBushes: 16,
        parkPoles: 6,
        plazaSegments: 32,
        duelEnvironment: false,
        duelMaxEffects: 4,
        duelParticlesNormal: 12,
        duelParticlesCombo: 22,
        duelProjectileLights: false,
        duelImpactLights: false,
        duelArenaPulse: false,
        duelSidePointLights: false,
        duelExtraDirectional: false,
        label: 'Baixo',
    },
    medium: {
        dpr: [1, 1.5],
        antialias: true,
        shadows: true,
        shadowMapSize: 1024,
        propCastShadows: true,
        avatarCastShadows: true,
        powerPreference: 'high-performance',
        particles: 'normal',
        auraMode: 'full',
        remoteAura: true,
        parkTrees: 25,
        parkBushes: 30,
        parkPoles: 10,
        plazaSegments: 64,
        duelEnvironment: false,
        duelMaxEffects: 6,
        duelParticlesNormal: 22,
        duelParticlesCombo: 36,
        duelProjectileLights: false,
        duelImpactLights: true,
        duelArenaPulse: true,
        duelSidePointLights: true,
        duelExtraDirectional: true,
        label: 'Médio',
    },
    high: {
        dpr: [1, 2],
        antialias: true,
        shadows: true,
        shadowMapSize: 2048,
        propCastShadows: true,
        avatarCastShadows: true,
        powerPreference: 'high-performance',
        particles: 'full',
        auraMode: 'full',
        remoteAura: true,
        parkTrees: 25,
        parkBushes: 30,
        parkPoles: 10,
        plazaSegments: 64,
        duelEnvironment: true,
        duelMaxEffects: 10,
        duelParticlesNormal: 34,
        duelParticlesCombo: 54,
        duelProjectileLights: true,
        duelImpactLights: true,
        duelArenaPulse: true,
        duelSidePointLights: true,
        duelExtraDirectional: true,
        label: 'Alto',
    },
};

/** Rótulos curtos para o menu (cabem no modal). */
export const TIER_SHORT_LABEL = {
    potato: 'MÍN.',
    low: 'BAIXO',
    medium: 'MÉDIO',
    high: 'ALTO',
};

const VALID_MODES = ['auto', 'potato', 'low', 'medium', 'high'];
const VALID_TIERS = ['potato', 'low', 'medium', 'high'];

function readStoredMode() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (VALID_MODES.includes(saved)) return saved;
    } catch {
        // ignore
    }
    return 'auto';
}

function resolveTier(mode) {
    if (mode === 'auto') return detectGraphicsTier();
    return VALID_TIERS.includes(mode) ? mode : 'medium';
}

function buildState(mode) {
    const effectiveTier = resolveTier(mode);
    const settings = QUALITY_PRESETS[effectiveTier] || QUALITY_PRESETS.medium;
    return { mode, effectiveTier, settings };
}

const initialMode = typeof window !== 'undefined' ? readStoredMode() : 'auto';
const initial = buildState(initialMode);

if (typeof window !== 'undefined') {
    console.log(`[Graphics] mode=${initial.mode} tier=${initial.effectiveTier}`, initial.settings);
}

let toastTimer = null;

export const useGraphicsSystem = create((set, get) => ({
    mode: initial.mode, // auto | potato | low | medium | high
    effectiveTier: initial.effectiveTier,
    settings: initial.settings,
    /** Evita downgrade repetido na mesma sessão (ex.: após remount do Canvas) */
    fpsAdaptedThisSession: false,
    toast: null,

    clearToast: () => set({ toast: null }),

    /** Aplica modo, persiste e recalcula o tier efetivo */
    setMode: (mode) => {
        const nextMode = VALID_MODES.includes(mode) ? mode : 'auto';
        try {
            localStorage.setItem(STORAGE_KEY, nextMode);
        } catch {
            // ignore
        }
        const next = buildState(nextMode);
        console.log(`[Graphics] mode=${next.mode} tier=${next.effectiveTier}`, next.settings);
        if (toastTimer) {
            clearTimeout(toastTimer);
            toastTimer = null;
        }
        set({ ...next, fpsAdaptedThisSession: false, toast: null });
    },

    /** Re-detecta se estiver em auto (útil no boot) */
    detectAndApply: () => {
        const { mode } = get();
        const next = buildState(mode);
        set({ ...next });
        return next.effectiveTier;
    },

    /**
     * Chamado após amostrar FPS no mundo.
     * Só age em modo auto, uma vez por sessão, e apenas rebaixa (nunca sobe sozinho).
     */
    adaptFromFps: (avgFps) => {
        const { mode, effectiveTier, fpsAdaptedThisSession } = get();

        if (mode !== 'auto' || fpsAdaptedThisSession) return false;

        set({ fpsAdaptedThisSession: true });

        const fps = Number(avgFps) || 0;
        console.log(`[Graphics] FPS médio amostrado: ${fps.toFixed(1)} (tier=${effectiveTier})`);

        if (fps >= FPS_DOWNGRADE_THRESHOLD) {
            return false;
        }

        const idx = TIER_ORDER.indexOf(effectiveTier);
        if (idx < 0 || idx >= TIER_ORDER.length - 1) {
            console.log('[Graphics] FPS baixo, mas já está no tier mínimo');
            return false;
        }

        const nextTier = TIER_ORDER[idx + 1];
        const settings = QUALITY_PRESETS[nextTier];
        const label = settings?.label || nextTier;
        const toast = `Gráficos reduzidos para ${label}`;

        console.log(`[Graphics] Downgrade automático: ${effectiveTier} → ${nextTier}`);

        if (toastTimer) clearTimeout(toastTimer);
        set({ effectiveTier: nextTier, settings, toast });
        toastTimer = setTimeout(() => {
            set({ toast: null });
            toastTimer = null;
        }, 4000);

        return true;
    },

    getSettings: () => get().settings,
}));
