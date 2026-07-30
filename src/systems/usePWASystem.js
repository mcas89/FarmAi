import { create } from 'zustand';

export const usePWASystem = create((set, get) => ({
    deferredPrompt: null,
    isInstallable: false,

    setPrompt: (prompt) => set({ deferredPrompt: prompt, isInstallable: true }),
    
    installPWA: async () => {
        const { deferredPrompt } = get();
        if (!deferredPrompt) return;
        
        // Mostra o prompt nativo do navegador
        deferredPrompt.prompt();
        
        // Aguarda a resposta do usuário
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA Installation: ${outcome}`);
        
        // Limpa o prompt pois só pode ser usado uma vez
        set({ deferredPrompt: null, isInstallable: false });
    }
}));
