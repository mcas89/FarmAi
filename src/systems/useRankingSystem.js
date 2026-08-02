import { create } from 'zustand';
import { db, auth } from '../config/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getCurrentWeekString } from '../utils/dateUtils';
import { ensureWeeklySnapshot } from './useDatabaseSystem';

export const useRankingSystem = create((set, get) => ({
    globalRanking: [],
    comboRanking: [],
    weeklyRanking: [],
    isLoading: false,

    formatRankings: (docsArray, field) => {
        return docsArray.map((docSnap, index) => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: data.name ? data.name.split(' ')[0] : 'Jogador',
                score: data[field] || 0,
                rank: index + 1,
            };
        });
    },

    fetchRankings: async () => {
        set({ isLoading: true });
        try {
            const usersRef = collection(db, 'users');
            const currentWeek = getCurrentWeekString();

            const qGlobal = query(usersRef, orderBy('aura', 'desc'), limit(50));
            const snapGlobal = await getDocs(qGlobal);
            const globalData = get().formatRankings(snapGlobal.docs, 'aura');

            const qCombo = query(usersRef, orderBy('maxCombo', 'desc'), limit(50));
            const snapCombo = await getDocs(qCombo);
            const comboData = get().formatRankings(snapCombo.docs, 'maxCombo');

            // Semanal: campo fixo weeklyAura + filtro weekId
            let weeklyData = [];
            try {
                const qWeekly = query(usersRef, orderBy('weeklyAura', 'desc'), limit(50));
                const snapWeekly = await getDocs(qWeekly);
                const filtered = snapWeekly.docs.filter((d) => {
                    const data = d.data();
                    const week = data.weekId || data.lastWeeklyReset;
                    return week === currentWeek && (data.weeklyAura || 0) > 0;
                });
                weeklyData = get().formatRankings(filtered, 'weeklyAura');
            } catch (weeklyError) {
                console.warn('[Ranking] Fallback semanal no cliente:', weeklyError.message);
                const snapAll = await getDocs(query(usersRef, limit(200)));
                const sorted = snapAll.docs
                    .filter((d) => {
                        const data = d.data();
                        const week = data.weekId || data.lastWeeklyReset;
                        return week === currentWeek && (data.weeklyAura || 0) > 0;
                    })
                    .sort((a, b) => (b.data().weeklyAura || 0) - (a.data().weeklyAura || 0))
                    .slice(0, 50);
                weeklyData = get().formatRankings(sorted, 'weeklyAura');
            }

            set({
                globalRanking: globalData,
                comboRanking: comboData,
                weeklyRanking: weeklyData,
                isLoading: false,
            });
        } catch (error) {
            console.error('Erro ao buscar rankings:', error);
            set({ isLoading: false });
        }
    },

    getMyPosition: (rankingList) => {
        if (!auth.currentUser) return null;
        const myIndex = rankingList.findIndex((p) => p.id === auth.currentUser.uid);
        return myIndex !== -1 ? myIndex + 1 : '> 50';
    },

    /**
     * Premia Top 3 da semana passada via snapshot weekly_results/{weekId}.
     * @param {string} uid
     * @param {string} claimWeek - semana a premiar (ex.: retornada em data.claimWeek no load)
     * @param {number} currentDiamonds
     */
    checkAndClaimWeeklyRewards: async (uid, claimWeek, currentDiamonds) => {
        if (!uid || !claimWeek) return;

        const currentWeek = getCurrentWeekString();
        if (claimWeek === currentWeek) return;

        try {
            await ensureWeeklySnapshot(claimWeek);

            const resultRef = doc(db, 'weekly_results', claimWeek);
            const resultSnap = await getDoc(resultRef);
            if (!resultSnap.exists()) return;

            const result = resultSnap.data();
            if (result.claimed && result.claimed[uid]) return;

            const entry = (result.top3 || []).find((p) => p.uid === uid);
            if (!entry || !entry.reward) {
                // Marca como visto para não reprocessar
                await setDoc(
                    resultRef,
                    { claimed: { ...(result.claimed || {}), [uid]: false } },
                    { merge: true }
                );
                return;
            }

            const reward = entry.reward;
            const mUI = await import('./useUISystem');
            mUI.useUISystem.getState().updateStats({ diamonds: currentDiamonds + reward });

            const mPlayer = await import('./usePlayerSystem');
            const mQuest = await import('./useQuestSystem');
            const mDb = await import('./useDatabaseSystem');
            const mAura = await import('./useAuraSystem');

            const position = mPlayer.usePlayerSystem.getState().position;
            const activeModel = mPlayer.usePlayerSystem.getState().activeModel;
            const { comboCount, maxCombo, aura, weeklyAura } = mAura.useAuraSystem.getState();
            const { dailyQuests, lastResetDate } = mQuest.useQuestSystem.getState();

            await mDb.useDatabaseSystem.getState().saveGameState(
                position,
                comboCount,
                activeModel,
                aura,
                currentDiamonds + reward,
                maxCombo,
                dailyQuests,
                lastResetDate,
                weeklyAura,
                currentWeek
            );

            await setDoc(
                resultRef,
                { claimed: { ...(result.claimed || {}), [uid]: true } },
                { merge: true }
            );

            console.log(`🎁 Prêmio semanal Top ${entry.rank}: +${reward} AuraCash`);
        } catch (error) {
            console.error('Erro ao checar prêmios semanais:', error);
        }
    },
}));
