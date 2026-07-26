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
  saveGameState: async (position, comboCount, activeModel, aura, diamonds) => {
    if (!db || !auth.currentUser) return; 
    if (get().isSaving) return; 
    
    set({ isSaving: true });
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        position: { x: position[0], y: position[1], z: position[2] },
        comboCount: comboCount,
        activeModel: activeModel,
        aura: aura,
        auracash: diamonds,
        lastUpdate: new Date().toISOString()
      }, { merge: true }); // Merge true atualiza apenas o que mudou

      
      set({ isSaving: false, lastSavedAt: Date.now() });
      console.log('💾 Jogo salvo na nuvem!');
    } catch (error) {
      console.error('❌ Erro ao salvar no Firebase:', error);
      set({ isSaving: false });
    }
  }
}));
