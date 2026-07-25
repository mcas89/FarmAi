import { create } from 'zustand';

export const useAnimationSystem = create((set) => ({
    leftArmIntensity: 0,
    rightArmIntensity: 0,
    setLeftArmIntensity: (val) => set({ leftArmIntensity: val }),
    setRightArmIntensity: (val) => set({ rightArmIntensity: val }),
}));
