import { create } from 'zustand';
import { db, auth } from '../config/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getCurrentWeekString } from '../utils/dateUtils';

export const useRankingSystem = create((set, get) => ({
    globalRanking: [],
    comboRanking: [],
    weeklyRanking: [],
    isLoading: false,
    
    // Calcula o rank exato de um usuário e garante que o nome seja extraído corretamente
    formatRankings: (docsArray, field) => {
        return docsArray.map((doc, index) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name ? data.name.split(' ')[0] : 'Jogador',
                score: data[field] || 0,
                rank: index + 1
            };
        });
    },

    fetchRankings: async () => {
        set({ isLoading: true });
        try {
            const usersRef = collection(db, 'users');

            // 1. GLOBAL RANKING (Top 50 por Aura Total)
            const qGlobal = query(usersRef, orderBy('aura', 'desc'), limit(50));
            const snapGlobal = await getDocs(qGlobal);
            const globalData = get().formatRankings(snapGlobal.docs, 'aura');

            // 2. COMBO RANKING (Top 50 por Max Combo)
            const qCombo = query(usersRef, orderBy('maxCombo', 'desc'), limit(50));
            const snapCombo = await getDocs(qCombo);
            const comboData = get().formatRankings(snapCombo.docs, 'maxCombo');

            // 3. WEEKLY RANKING (Top 50 por Aura Semanal)
            const currentWeek = getCurrentWeekString();
            const weeklyField = `weeklyAura_${currentWeek}`;
            const qWeekly = query(usersRef, orderBy(weeklyField, 'desc'), limit(50));
            const snapWeekly = await getDocs(qWeekly);
            const weeklyData = get().formatRankings(snapWeekly.docs, weeklyField);

            set({
                globalRanking: globalData,
                comboRanking: comboData,
                weeklyRanking: weeklyData,
                isLoading: false
            });
        } catch (error) {
            console.error("Erro ao buscar rankings:", error);
            set({ isLoading: false });
        }
    },

    // Retorna a posição do jogador atual num ranking específico
    getMyPosition: (rankingList) => {
        if (!auth.currentUser) return null;
        const myIndex = rankingList.findIndex(p => p.id === auth.currentUser.uid);
        return myIndex !== -1 ? myIndex + 1 : '> 50';
    },

    checkAndClaimWeeklyRewards: async (uid, lastWeeklyReset, currentDiamonds) => {
        const currentWeek = getCurrentWeekString();
        
        if (lastWeeklyReset && lastWeeklyReset !== currentWeek) {
            try {
                const usersRef = collection(db, 'users');
                // The rewards belong to the PREVIOUS week, wait!
                // If lastWeeklyReset !== currentWeek, then we want to check the rank of the PREVIOUS week (lastWeeklyReset).
                const weeklyField = `weeklyAura_${lastWeeklyReset}`;
                const qWeekly = query(usersRef, orderBy(weeklyField, 'desc'), limit(3));
                const snap = await getDocs(qWeekly);
                
                let reward = 0;
                let myRank = -1;
                snap.docs.forEach((doc, index) => {
                    if (doc.id === uid) {
                        myRank = index + 1;
                        if (index === 0) reward = 1000;
                        else if (index === 1) reward = 500;
                        else if (index === 2) reward = 200;
                    }
                });

                if (reward > 0) {
                    const mUI = await import('./useUISystem');
                    mUI.useUISystem.getState().updateStats({ diamonds: currentDiamonds + reward });
                    // O prêmio foi entregue silenciosamente. (O alerta do navegador foi removido a pedido)
                    
                    // Salva apenas o prêmio atualizado no Firebase sem resetar a aura atual!
                    const mPlayer = await import('./usePlayerSystem');
                    const mQuest = await import('./useQuestSystem');
                    const mDb = await import('./useDatabaseSystem');
                    const mAura = await import('./useAuraSystem');
                    
                    const position = mPlayer.usePlayerSystem.getState().position;
                    const activeModel = mPlayer.usePlayerSystem.getState().activeModel;
                    const { comboCount, maxCombo, aura, weeklyAura } = mAura.useAuraSystem.getState();
                    const { dailyQuests, lastResetDate } = mQuest.useQuestSystem.getState();
                    
                    mDb.useDatabaseSystem.getState().saveGameState(
                        position, comboCount, activeModel, aura, currentDiamonds + reward, maxCombo, dailyQuests, lastResetDate, weeklyAura, currentWeek
                    );
                }

            } catch (error) {
                console.error("Erro ao checar prêmios semanais:", error);
            }
        }
    }
}));
