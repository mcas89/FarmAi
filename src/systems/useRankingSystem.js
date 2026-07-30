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

            // 1. GLOBAL RANKING (Top 50 por Aura Total) — índice simples, funciona direto
            const qGlobal = query(usersRef, orderBy('aura', 'desc'), limit(50));
            const snapGlobal = await getDocs(qGlobal);
            const globalData = get().formatRankings(snapGlobal.docs, 'aura');

            // 2. COMBO RANKING (Top 50 por Max Combo) — índice simples, funciona direto
            const qCombo = query(usersRef, orderBy('maxCombo', 'desc'), limit(50));
            const snapCombo = await getDocs(qCombo);
            const comboData = get().formatRankings(snapCombo.docs, 'maxCombo');

            // 3. WEEKLY RANKING — campo dinâmico (weeklyAura_2026_W07_27) exige índice
            // composto no Firestore. Para evitar erro, buscamos todos os docs e ordenamos
            // localmente no cliente. Limitamos a 200 docs para não explodir o plano free.
            const currentWeek = getCurrentWeekString();
            const weeklyField = `weeklyAura_${currentWeek}`;

            let weeklyData = [];
            try {
                // Tenta primeiro com orderBy (funciona se o índice já existir)
                const qWeekly = query(usersRef, orderBy(weeklyField, 'desc'), limit(50));
                const snapWeekly = await getDocs(qWeekly);
                weeklyData = get().formatRankings(snapWeekly.docs, weeklyField);
            } catch (weeklyError) {
                console.warn(`[Ranking] Índice semanal não encontrado, ordenando no cliente...`, weeklyError.message);
                // Fallback: busca todos, filtra quem tem score esta semana, ordena no cliente
                const qAll = query(usersRef, limit(200));
                const snapAll = await getDocs(qAll);
                const sorted = snapAll.docs
                    .filter(doc => (doc.data()[weeklyField] || 0) > 0)
                    .sort((a, b) => (b.data()[weeklyField] || 0) - (a.data()[weeklyField] || 0))
                    .slice(0, 50);
                weeklyData = get().formatRankings(sorted, weeklyField);
            }

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
