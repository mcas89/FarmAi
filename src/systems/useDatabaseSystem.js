import { create } from 'zustand';
import { db, auth } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs, increment } from 'firebase/firestore';
import { getCurrentWeekString } from '../utils/dateUtils';

/** Prêmios do Top 3 do ranking semanal (AuraCash). */
export const WEEKLY_TOP_REWARDS = { 1: 300, 2: 100, 3: 50 };

/** Garante snapshot imutável do top 3 da semana (first-writer-wins). */
export async function ensureWeeklySnapshot(weekId) {
  if (!db || !weekId) return null;

  const resultRef = doc(db, 'weekly_results', weekId);
  const existing = await getDoc(resultRef);
  if (existing.exists()) return existing.data();

  const rewards = WEEKLY_TOP_REWARDS;
  const usersRef = collection(db, 'users');

  const snapAll = await getDocs(query(usersRef, limit(200)));
  const scored = snapAll.docs
    .map((d) => {
      const data = d.data();
      const legacy = data[`weeklyAura_${weekId}`] || 0;
      const matchesWeek = (data.weekId || data.lastWeeklyReset) === weekId;
      const score = matchesWeek
        ? Math.max(data.weeklyAura || 0, legacy)
        : legacy;
      return {
        uid: d.id,
        name: data.name ? data.name.split(' ')[0] : 'Jogador',
        score: score || 0,
      };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((p, i) => ({
      ...p,
      rank: i + 1,
      reward: rewards[i + 1] || 0,
    }));

  const payload = {
    weekId,
    top3: scored,
    createdAt: new Date().toISOString(),
    claimed: {},
  };

  const again = await getDoc(resultRef);
  if (again.exists()) return again.data();

  await setDoc(resultRef, payload);
  console.log(`🏆 Snapshot semanal ${weekId} criado:`, scored);
  return payload;
}

export const useDatabaseSystem = create((set, get) => ({
  isSaving: false,
  lastSavedAt: null,
  /** Só true depois que loadPlayerData / registro hidratou o Zustand. */
  isDataLoaded: false,

  markDataLoaded: () => set({ isDataLoaded: true }),
  clearDataLoaded: () => set({ isDataLoaded: false }),

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
        await ensureWeeklySnapshot(savedWeek);
        await setDoc(stateRef, { currentWeek }, { merge: true });
      } else if (!savedWeek) {
        await setDoc(stateRef, { currentWeek }, { merge: true });
      }
    } catch (error) {
      console.error('❌ Erro no fechamento da semana (Rollover):', error);
    }
  },

  loadPlayerData: async () => {
    if (!db || !auth.currentUser) return null;

    await get().checkAndProcessWeeklyRollover();

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      const currentWeek = getCurrentWeekString();
      const userWeek = data.weekId || data.lastWeeklyReset || null;

      if (userWeek && userWeek !== currentWeek) {
        await ensureWeeklySnapshot(userWeek);
        data.claimWeek = userWeek;
        data.weeklyAura = 0;

        await setDoc(
          userRef,
          {
            weeklyAura: 0,
            weekId: currentWeek,
            lastWeeklyReset: currentWeek,
          },
          { merge: true }
        );

        data.weekId = currentWeek;
        data.lastWeeklyReset = currentWeek;
      } else {
        const legacy = data[`weeklyAura_${currentWeek}`] || 0;
        data.weeklyAura = Math.max(data.weeklyAura || 0, legacy);
        data.claimWeek = null;

        if (!docSnap.data().weekId) {
          await setDoc(
            userRef,
            {
              weeklyAura: data.weeklyAura,
              weekId: currentWeek,
              lastWeeklyReset: currentWeek,
            },
            { merge: true }
          );
        }

        data.weekId = currentWeek;
        data.lastWeeklyReset = currentWeek;
      }

      console.log('📦 Dados carregados do Firebase:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao carregar do Firebase:', error);
      return null;
    }
  },

  /**
   * Atualiza só AuraCash — não toca em aura/weeklyAura.
   * Seguro de chamar antes da hidratação completa.
   */
  saveAuracashOnly: async (amount) => {
    if (!db || !auth.currentUser || amount === undefined) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        auracash: amount,
        lastUpdate: new Date().toISOString(),
      });
      console.log(`[DiamondSave] AuraCash=${amount} (somente auracash).`);
    } catch (error) {
      // Doc novo pode não existir ainda — merge via setDoc
      try {
        await setDoc(
          doc(db, 'users', auth.currentUser.uid),
          { auracash: amount, lastUpdate: new Date().toISOString() },
          { merge: true }
        );
      } catch (e2) {
        console.error('❌ Erro ao salvar AuraCash:', e2);
      }
    }
  },

  /** Persistência leve das atividades do mapa (baú/fonte/poções). */
  saveMapActivities: async (mapActivities) => {
    if (!db || !auth.currentUser || !mapActivities) return;
    if (!get().isDataLoaded) return;
    try {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        { mapActivities, lastUpdate: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      console.error('❌ Erro ao salvar mapActivities:', e);
    }
  },

  saveGameState: async (
    position,
    comboCount,
    activeModel,
    aura,
    diamonds,
    maxCombo,
    dailyQuests,
    lastResetDate,
    weeklyAura,
    lastWeeklyReset,
    achievements,
    unlockedCharacters,
    inventory
  ) => {
    if (!db || !auth.currentUser) return;

    // Bloqueia save completo antes da hidratação (evita gravar aura: 0)
    if (!get().isDataLoaded) {
      console.warn('[Save] Ignorado: dados do jogador ainda não carregaram.');
      return;
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const currentWeek = getCurrentWeekString();

      // Rede de segurança: nunca diminuir aura/maxCombo/weeklyAura via save genérico
      let serverAura = 0;
      let serverMaxCombo = 0;
      let serverWeekly = 0;
      let serverWeekId = null;
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const s = snap.data();
          serverAura = s.aura || 0;
          serverMaxCombo = s.maxCombo || 0;
          serverWeekly = s.weeklyAura || 0;
          serverWeekId = s.weekId || s.lastWeeklyReset || null;
        }
      } catch (_) {
        /* segue com valores locais */
      }

      const payload = {
        lastUpdate: new Date().toISOString(),
      };

      if (position !== undefined) {
        payload.position = {
          x: (position && position[0]) || 0,
          y: (position && position[1]) || 0,
          z: (position && position[2]) || 0,
        };
      }
      if (comboCount !== undefined) payload.comboCount = comboCount;
      if (maxCombo !== undefined) {
        payload.maxCombo = Math.max(serverMaxCombo, maxCombo || 0);
      }
      if (activeModel !== undefined) payload.activeModel = activeModel;
      if (aura !== undefined) {
        const safeAura = Math.max(serverAura, aura || 0);
        if ((aura || 0) < serverAura) {
          console.warn(
            `[Save] Aura local (${aura}) < servidor (${serverAura}). Mantendo valor do servidor.`
          );
          // Repara o Zustand se um wipe local ainda não tinha ido pro banco
          import('./useAuraSystem').then((m) => {
            const cur = m.useAuraSystem.getState().aura || 0;
            if (cur < serverAura) {
              m.useAuraSystem.setState({ aura: serverAura });
            }
          });
        }
        payload.aura = safeAura;
      }
      if (diamonds !== undefined) payload.auracash = diamonds;
      if (dailyQuests !== undefined) payload.dailyQuests = dailyQuests;
      if (achievements !== undefined) payload.achievements = achievements;
      if (unlockedCharacters !== undefined) payload.unlockedCharacters = unlockedCharacters;
      if (inventory !== undefined) payload.inventory = inventory;
      if (lastResetDate !== undefined) payload.lastResetDate = lastResetDate;

      if (weeklyAura !== undefined) {
        // Na mesma semana, não deixa um save prematuro derrubar o placar semanal
        const sameWeek = !serverWeekId || serverWeekId === currentWeek;
        payload.weeklyAura = sameWeek
          ? Math.max(serverWeekly, weeklyAura || 0)
          : weeklyAura || 0;
        payload.weekId = currentWeek;
        payload.lastWeeklyReset = currentWeek;
      } else if (lastWeeklyReset !== undefined) {
        payload.weekId = lastWeeklyReset;
        payload.lastWeeklyReset = lastWeeklyReset;
      }

      await setDoc(userRef, payload, { merge: true });

      set({ lastSavedAt: Date.now() });
    } catch (error) {
      console.error('❌ Erro ao salvar no Firebase:', error);
    }
  },

  incrementAuracash: async (amount) => {
    if (!db || !auth.currentUser) {
      console.error('[InfinitePay] incrementAuracash: sem auth ou db disponível.');
      return false;
    }
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        auracash: increment(amount),
        lastUpdate: new Date().toISOString(),
      });
      console.log(`[InfinitePay] ✅ +${amount.toLocaleString()} AuraCash incrementados atomicamente no Firebase.`);
      return true;
    } catch (err) {
      console.error('[InfinitePay] ❌ Erro ao incrementar AuraCash no Firebase:', err);
      return false;
    }
  },
}));
