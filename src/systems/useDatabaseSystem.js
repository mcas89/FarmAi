import { create } from 'zustand';
import { db, auth } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const useDatabaseSystem = create((set, get) => ({
  isSaving: false,
  lastSavedAt: null,

  // Carrega os dados do jogador quando o jogo abre
  loadPlayerData: async () => {
    if (!db || !auth.currentUser) return null; 
    
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📦 Dados carregados do Firebase:', data);
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar do Firebase:', error);
      return null;
    }
  },

  // Salva o estado atual do jogo no Firebase
  saveGameState: async (position, comboCount, activeModel, aura, diamonds, maxCombo, dailyQuests, lastResetDate, weeklyAura = 0, lastWeeklyReset = '') => {
    if (!db || !auth.currentUser) return; 
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      const payload = {
        position: { x: position[0], y: position[1], z: position[2] },
        comboCount: comboCount,
        maxCombo: maxCombo,
        activeModel: activeModel,
        aura: aura,
        weeklyAura: weeklyAura,
        auracash: diamonds,
        dailyQuests: dailyQuests || [],
        lastResetDate: lastResetDate || '',
        lastUpdate: new Date().toISOString()
      };

      if (lastWeeklyReset) {
        payload.lastWeeklyReset = lastWeeklyReset;
      }

      await setDoc(userRef, payload, { merge: true }); // Merge true atualiza apenas o que mudou
      
      set({ lastSavedAt: Date.now() });
      console.log('💾 Jogo salvo na nuvem!');
    } catch (error) {
      console.error('❌ Erro ao salvar no Firebase:', error);
    }
  }
}));
