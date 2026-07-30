import { create } from 'zustand';

const MUSIC_PATH = '/music/';

const bgmFiles = {
    intro: 'intro.mp3',
    home: '67sixseven.mp3',
    game: 'telagame.mp3'
};

const sfxFiles = {
    click: 'click_botão.mp3',
    powerStart: 'iniciopower.mp3',
    power: 'power.mp3',
    farm: 'movimento.mp3',
    walk: 'passos.mp3'
};

// Inicialização LAZY — só cria os objetos Audio no primeiro uso real (gesto do usuário)
// Evita erros no mobile onde new Audio() fora de um gesto é bloqueado
let bgmAudio = null;
const sfxCache = {};

const getBgmAudio = () => {
    if (!bgmAudio) {
        bgmAudio = new Audio();
        bgmAudio.loop = true;
    }
    return bgmAudio;
};

const getSfxAudio = (key) => {
    if (!sfxCache[key]) {
        const audio = new Audio(`${MUSIC_PATH}${sfxFiles[key]}`);
        audio.preload = 'auto';
        sfxCache[key] = audio;
    }
    return sfxCache[key];
};

export const useAudioSystem = create((set, get) => ({
    isMuted: false,
    currentBGM: null,

    toggleMute: () => set(state => {
        const newMuted = !state.isMuted;
        try {
            if (bgmAudio) bgmAudio.muted = newMuted;
            Object.values(sfxCache).forEach(audio => { audio.muted = newMuted; });
        } catch (e) {
            console.warn('[Audio] toggleMute error:', e);
        }
        return { isMuted: newMuted };
    }),

    playBGM: (bgmKey) => {
        const { isMuted, currentBGM } = get();
        if (currentBGM === bgmKey) return;

        if (bgmFiles[bgmKey]) {
            try {
                const audio = getBgmAudio();
                audio.src = `${MUSIC_PATH}${bgmFiles[bgmKey]}`;
                audio.muted = isMuted;
                setTimeout(() => {
                    audio.play().catch(e => console.warn('Autoplay prevented:', e));
                }, 100);
                set({ currentBGM: bgmKey });
            } catch (e) {
                console.warn('[Audio] playBGM error:', e);
            }
        }
    },

    stopBGM: () => {
        try {
            if (bgmAudio) {
                bgmAudio.pause();
                bgmAudio.currentTime = 0;
            }
        } catch (e) {}
        set({ currentBGM: null });
    },

    playSFX: (sfxKey) => {
        const { isMuted } = get();
        if (isMuted) return;
        try {
            const audio = getSfxAudio(sfxKey);
            if (audio) {
                const soundClone = audio.cloneNode();
                soundClone.volume = sfxKey === 'walk' ? 0.3 : (sfxKey === 'farm' ? 0.6 : 1.0);
                soundClone.muted = isMuted;
                soundClone.play().catch(e => console.warn('Autoplay prevented:', e));
            }
        } catch (e) {
            console.warn('[Audio] playSFX error:', e);
        }
    },

    walkAudioNode: null,
    startWalkSFX: () => {
        const { isMuted, walkAudioNode } = get();
        if (isMuted || walkAudioNode) return;
        try {
            const audio = getSfxAudio('walk');
            if (audio) {
                const node = audio.cloneNode();
                node.loop = true;
                node.volume = 0.5;
                node.muted = isMuted;
                node.play().catch(e => console.warn('Autoplay prevented:', e));
                set({ walkAudioNode: node });
            }
        } catch (e) {
            console.warn('[Audio] startWalkSFX error:', e);
        }
    },
    stopWalkSFX: () => {
        const { walkAudioNode } = get();
        if (walkAudioNode) {
            try {
                walkAudioNode.pause();
                walkAudioNode.currentTime = 0;
            } catch (e) {}
            set({ walkAudioNode: null });
        }
    }
}));
