/**
 * Detecta o tier gráfico inicial com base em sinais do aparelho.
 * iPhone/iPad Safari: sem deviceMemory — default conservador (low/potato).
 */
export function detectGraphicsTier() {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
        return 'medium';
    }

    const ua = navigator.userAgent || '';
    const isIOS =
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    const mem = navigator.deviceMemory; // GB, pode ser undefined
    const cores = navigator.hardwareConcurrency || 4;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    // WebGL software / falha → mínimo
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'potato';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
            if (/swiftshader|llvmpipe|software|mali-4|mali-t6|adreno \(tm\) 3|adreno 3|powvr sgx/.test(renderer)) {
                return 'potato';
            }
            if (/mali-t7|mali-g31|adreno \(tm\) 4|adreno 4|adreno \(tm\) 5[0-3]/.test(renderer)) {
                return 'low';
            }
        }
    } catch {
        return 'potato';
    }

    // iOS / Safari touch: Safari WebGL é sensível a fill-rate e sombras
    if (isIOS || (isSafari && navigator.maxTouchPoints > 1)) {
        if (dpr >= 3) return 'potato';
        return 'low';
    }

    if (typeof mem === 'number') {
        if (mem <= 1) return 'potato';
        if (mem <= 2 || cores <= 4) return 'low';
        if (mem <= 4) return 'medium';
        return 'high';
    }

    // Sem deviceMemory (Android/Firefox): conservador
    if (cores <= 2 || (cores <= 4 && dpr >= 3)) return 'potato';
    if (cores <= 4) return 'low';
    return 'medium';
}
