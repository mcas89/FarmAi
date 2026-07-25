import { create } from 'zustand';

export const useMovementSystem = create((set) => ({
    joystick: { x: 0, y: 0 }, // Valores normalizados de -1 a +1
    isMoving: false,
    setJoystick: (x, y) => set({ joystick: { x, y }, isMoving: Math.abs(x) > 0.1 || Math.abs(y) > 0.1 })
}));
