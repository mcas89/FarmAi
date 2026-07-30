import { create } from 'zustand';

export const useMovementSystem = create((set) => ({
    joystick: { x: 0, y: 0 }, // Valores normalizados de -1 a +1
    isMoving: false,
    setJoystick: (x, y) => {
        const isMovingNow = Math.abs(x) > 0.1 || Math.abs(y) > 0.1;
        set((state) => {
            if (isMovingNow && !state.isMoving) {
                import('./useAudioSystem').then(m => m.useAudioSystem.getState().startWalkSFX());
            } else if (!isMovingNow && state.isMoving) {
                import('./useAudioSystem').then(m => m.useAudioSystem.getState().stopWalkSFX());
            }
            return { joystick: { x, y }, isMoving: isMovingNow };
        });
    }
}));
