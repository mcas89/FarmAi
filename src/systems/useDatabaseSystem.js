import { create } from 'zustand';
import { db, auth } from '../config/firebase';
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getCurrentWeekString } from '../utils/dateUtils';

export const useDatabaseSystem = create((set, get) => ({
  isSaving: false,
  lastSavedAt: null,

  // Verifica se a semana virou e, se sim, consolida os ganhadores da semana anterior.
  // Esta função é o Gatilho Descentralizado.
  checkAndProcessWeeklyRollover: async () => {
    if (!db) return;
    const currentWeek = getCurrentWeekString();
    
    try {
      const stateRef = doc(db, 'serverData', 'state');
      const stateSnap = await getDoc(stateRef);
      
      let savedWeek = null;
      if (stateSnap.exists()) {
        savedWeek = stateSnap.data().currentWeek;
      }

      if (savedWeek && savedWeek !== currentWeek) {
        console.log(`⏳ Virada de semana detectada: ${savedWeek} -> ${currentWeek}`);
        // A semana virou! Vamos buscar os Top 3 da semana que acabou de passar.
        const q = query(
          collection(db, 'users'), 
          orderBy(`weeklyAura_${savedWeek}`, 'desc'), 
          limit(3)
        );
        
        const snapshot = await getDocs(q);
        let rank = 1;
        const rewards = { 1: 100, 2: 50, 3: 20 };

        snapshot.forEach(async (docSnap) => {
          const data = docSnap.data();
          if (data[`weeklyAura_${savedWeek}`] > 0 && rank <= 3) {
            // Salva o prêmio disponível para o ganhador
            const prizeRef = doc(db, 'claimable_prizes', `${docSnap.id}_${savedWeek}`);
            await setDoc(prizeRef, {
              uid: docSnap.id,
              week: savedWeek,
              rank: rank,
              aura: data[`weeklyAura_${savedWeek}`],
              reward: rewards[rank],
              claimed: false,
              title: `Top ${rank} Semanal`,
              desc: `Ficou em ${rank}º lugar na semana ${savedWeek}.`
            }, { merge: true });
            
            rank++;
          }
        });

        console.log(`🏆 Prêmios da semana ${savedWeek} distribuídos com sucesso!`);

        // Atualiza a semana atual no servidor
        await setDoc(stateRef, { currentWeek: currentWeek }, { merge: true });
      } else if (!savedWeek) {
        // Se nunca teve semana salva, salva a primeira vez
        await setDoc(stateRef, { currentWeek: currentWeek }, { merge: true });
      }
    } catch (error) {
      console.error('❌ Erro no fechamento da semana (Rollover):', error);
    }
  },

  // Carrega os dados do jogador quando o jogo abre
  loadPlayerData: async () => {
    if (!db || !auth.currentUser) return null; 
    
    // Roda a verificação de virada de semana antes de puxar os dados
    await get().checkAndProcessWeeklyRollover();
    
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Verifica se a aura semanal do cara precisa ser zerada (se a semana virou)
        const currentWeek = getCurrentWeekString();
        if (data.lastWeeklyReset !== currentWeek) {
          data.weeklyAura = 0; // Zera a aura localmente porque é uma nova semana
        } else {
          // Se for a mesma semana, lê do campo específico da semana
          data.weeklyAura = data[`weeklyAura_${currentWeek}`] || 0;
        }

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
  saveGameState: async (position, comboCount, activeModel, aura, diamonds, maxCombo, dailyQuests, lastResetDate, weeklyAura = 0, lastWeeklyReset = '', achievements = [], unlockedCharacters = ['san.vrm', 'deric.vrm'], inventory = []) => {
    if (!db || !auth.currentUser) return; 
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const currentWeek = getCurrentWeekString();
      
      const payload = {
        position: { 
            x: (position && position[0]) || 0, 
            y: (position && position[1]) || 0, 
            z: (position && position[2]) || 0 
        },
        comboCount: comboCount || 0,
        maxCombo: maxCombo || 0,
        activeModel: activeModel || 'san.vrm',
        aura: aura || 0,
        auracash: diamonds || 0,
        dailyQuests: dailyQuests || [],
        achievements: achievements || [],
        unlockedCharacters: unlockedCharacters || ['san.vrm', 'deric.vrm'],
        inventory: inventory || [],
        lastResetDate: lastResetDate || '',
        lastWeeklyReset: currentWeek, // Marca que a aura salva pertence à semana atual
        lastUpdate: new Date().toISOString()
      };

      // Salva a Aura semanal no campo com o nome específico da semana (Ex: weeklyAura_2026_W30)
      payload[`weeklyAura_${currentWeek}`] = weeklyAura || 0;

      await setDoc(userRef, payload, { merge: true }); 
      
      set({ lastSavedAt: Date.now() });
    } catch (error) {
      console.error('❌ Erro ao salvar no Firebase:', error);
    }
  }
}));
