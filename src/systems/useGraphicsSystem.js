import { create } from 'zustand';
import { detectGraphicsTier } from '../utils/graphicsDetection';

const STORAGE_KEY = 'farmaai_graphics_mode';
const TIER_ORDER = ['high', 'medium', 'low'];
const FPS_DOWNGRADE_THRESHOLD = 28;

export const QUALITY_PRESETS = {
    low: {
        dpr: 1,
        antialias: false,
        shadows: true,
        shadowMapSize: 512,
        propCastShadows: false,
        powerPreference: 'low-power',
        // Arena de duelo — corta custo GPU sem remover o visual de ataque
        duelEnvironment: false,
        duelMaxEffects: 4,
        duelParticlesNormal: 12,
        duelParticlesCombo: 22,
        duelProjectileLights: false,
        duelImpactLights: false,
        duelArenaPulse: false,
        duelSidePointLights: false,
        duelExtraDirectional: false,
    },
    medium: {
        dpr: [1, 1.5],
        antialias: true,
        shadows: true,
        shadowMapSize: 1024,
        propCastShadows: true,
        powerPreference: 'high-performance',
        duelEnvironment: false,
        duelMaxEffects: 6,
        duelParticlesNormal: 22,
        duelParticlesCombo: 36,
        duelProjectileLights: false,
        duelImpactLights: true,
        duelArenaPulse: true,
        duelSidePointLights: true,
        duelExtraDirectional: true,
    },
    high: {
        dpr: [1, 2],
        antialias: true,
        shadows: true,
        shadowMapSize: 2048,
        propCastShadows: true,
        powerPreference: 'high-performance',
        duelEnvironment: true,
        duelMaxEffects: 10,
        duelParticlesNormal: 34,
        duelParticlesCombo: 54,
        duelProjectileLights: true,
        duelImpactLights: true,
        duelArenaPulse: true,
        duelSidePointLights: true,
        duelExtraDirectional: true,
    },
};

const VALID_MODES = ['auto', 'low', 'medium', 'high'];
const VALID_TIERS = ['low', 'medium', 'high'];

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
    mode: initial.mode, // auto | low | medium | high
    effectiveTier: initial.effectiveTier,
    settings: initial.settings,
    /** Evita downgrade repetido na mesma sessão (ex.: após remount do Canvas) */
    fpsAdaptedThisSession: false,
    toast: null,

    clearToast: () => set({ toast: null }),

    /** Aplica modo (auto/low/medium/high), persiste e recalcula o tier efetivo */
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
        // Ao mudar o modo, libera nova medição de FPS (só relevante se voltar para auto)
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

        // Marca a sessão mesmo se não houver downgrade (evita re-medir após remount)
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
        const toast = 'Gráficos reduzidos para melhorar o desempenho';

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
