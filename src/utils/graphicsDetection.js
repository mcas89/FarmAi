/**
 * Detecta o tier gráfico inicial com base em sinais do aparelho.
 * iOS/Firefox muitas vezes não expõem deviceMemory — nesses casos usa médio.
 */
export function detectGraphicsTier() {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
        return 'medium';
    }

    const mem = navigator.deviceMemory; // GB, pode ser undefined
    const cores = navigator.hardwareConcurrency || 4;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    // WebGL software / falha → baixo
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'low';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
            if (renderer.includes('swiftshader') || renderer.includes('llvmpipe') || renderer.includes('software')) {
                return 'low';
            }
        }
    } catch {
        return 'low';
    }

    if (typeof mem === 'number') {
        if (mem <= 2 || cores <= 4) return 'low';
        if (mem <= 4) return 'medium';
        return 'high';
    }

    // Sem deviceMemory (comum no iPhone): conservador
    if (cores <= 4 && dpr >= 3) return 'medium';
    if (cores <= 4) return 'medium';
    return 'medium';
}
