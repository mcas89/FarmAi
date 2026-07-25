import { create } from 'zustand';
import { db } from '../config/firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

export const useDatabaseSystem = create((set, get) => ({
  playerId: 'player_1', // Temporário enquanto não temos login
  isSaving: false,
  lastSavedAt: null,

  // Carrega os dados do jogador quando o jogo abre
  loadPlayerData: async () => {
    if (!db) return null; // Evita crash se a API Key for inválida
    
    try {
      const docRef = doc(db, 'players', get().playerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📦 Dados carregados do Firebase:', data);
        return data;
      } else {
        console.log('🆕 Novo jogador, nenhum dado encontrado.');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar do Firebase:', error);
      return null;
    }
  },

  // Salva o estado atual do jogo no Firebase
  saveGameState: async (position, comboCount, activeModel) => {
    if (!db) return; // Evita crash se a API Key for inválida
    if (get().isSaving) return; // Evita flood de requisições
    
    set({ isSaving: true });
    try {
      const playerRef = doc(db, 'players', get().playerId);
      await setDoc(playerRef, {
        position: { x: position[0], y: position[1], z: position[2] },
        comboCount: comboCount,
        activeModel: activeModel,
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
