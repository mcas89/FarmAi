import { create } from 'zustand';

function detectStandalone() {
    if (typeof window === 'undefined') return false;
    try {
        if (window.matchMedia('(display-mode: standalone)').matches) return true;
        if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
        if (window.navigator.standalone === true) return true; // iOS Safari
    } catch {
        // ignore
    }
    return false;
}

export const usePWASystem = create((set, get) => ({
    deferredPrompt: null,
    isInstallable: false,
    isInstalled: detectStandalone(),

    setPrompt: (prompt) => set({ deferredPrompt: prompt, isInstallable: true }),

    refreshInstallState: () => set({ isInstalled: detectStandalone() }),

    installPWA: async () => {
        const { deferredPrompt } = get();
        if (!deferredPrompt) return false;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA Installation: ${outcome}`);

        set({ deferredPrompt: null, isInstallable: false });
        if (outcome === 'accepted') {
            set({ isInstalled: true });
        }
        return outcome === 'accepted';
    },
}));
