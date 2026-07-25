import { create } from 'zustand';

export const useFarmSystem = create((set) => ({
    isLeftFarming: false,
    isRightFarming: false,
    setLeftFarming: (val) => set({ isLeftFarming: val }),
    setRightFarming: (val) => set({ isRightFarming: val }),
}));
