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

export const useAudioSystem = create((set, get) => {
    const bgmAudio = new Audio();
    bgmAudio.loop = true;
    
    const sfxCache = {};
    
    Object.keys(sfxFiles).forEach(key => {
        const audio = new Audio(`${MUSIC_PATH}${sfxFiles[key]}`);
        audio.preload = 'auto';
        sfxCache[key] = audio;
    });

    return {
        isMuted: false,
        currentBGM: null,
        
        toggleMute: () => set(state => {
            const newMuted = !state.isMuted;
            bgmAudio.muted = newMuted;
            Object.values(sfxCache).forEach(audio => {
                audio.muted = newMuted;
            });
            return { isMuted: newMuted };
        }),
        
        playBGM: (bgmKey) => {
            const { isMuted, currentBGM } = get();
            
            if (currentBGM === bgmKey) return;

            if (bgmFiles[bgmKey]) {
                bgmAudio.src = `${MUSIC_PATH}${bgmFiles[bgmKey]}`;
                bgmAudio.muted = isMuted;
                // Add a small delay to handle autoplay restrictions on some browsers
                setTimeout(() => {
                    bgmAudio.play().catch(e => console.warn('Autoplay prevented:', e));
                }, 100);
                set({ currentBGM: bgmKey });
            }
        },

        stopBGM: () => {
            bgmAudio.pause();
            bgmAudio.currentTime = 0;
            set({ currentBGM: null });
        },
        
        playSFX: (sfxKey) => {
            const { isMuted } = get();
            if (isMuted) return;

            const audio = sfxCache[sfxKey];
            if (audio) {
                const soundClone = audio.cloneNode();
                soundClone.volume = sfxKey === 'walk' ? 0.3 : (sfxKey === 'farm' ? 0.6 : 1.0);
                soundClone.muted = isMuted;
                soundClone.play().catch(e => console.warn('Autoplay prevented:', e));
            }
        },
        
        walkAudioNode: null,
        startWalkSFX: () => {
            const { isMuted, walkAudioNode } = get();
            if (isMuted || walkAudioNode) return;
            
            const audio = sfxCache['walk'];
            if (audio) {
                const node = audio.cloneNode();
                node.loop = true;
                node.volume = 0.5;
                node.muted = isMuted;
                node.play().catch(e => console.warn('Autoplay prevented:', e));
                set({ walkAudioNode: node });
            }
        },
        stopWalkSFX: () => {
            const { walkAudioNode } = get();
            if (walkAudioNode) {
                walkAudioNode.pause();
                walkAudioNode.currentTime = 0;
                set({ walkAudioNode: null });
            }
        }
    };
});
