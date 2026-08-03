import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { usePresenceSystem } from './usePresenceSystem';

const nickKey = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Garante nicknameLower + friendCode no doc do usuário. */
export async function ensureSocialProfileFields() {
  if (!db || !auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const name = data.name ? String(data.name).split(' ')[0] : 'Jogador';
  const nicknameLower = nickKey(name);
  const friendCode = (data.friendCode || uid.slice(0, 6)).toUpperCase();
  if (data.nicknameLower !== nicknameLower || !data.friendCode) {
    await setDoc(ref, { nicknameLower, friendCode, name }, { merge: true });
  }
  return { name, nicknameLower, friendCode };
}

async function findUserByNicknameOrCode(raw) {
  const q = String(raw || '').trim();
  if (!q || !db) return null;

  const code = q.replace(/^#/, '').toUpperCase();
  if (/^[A-Z0-9]{5,8}$/.test(code)) {
    const byCode = await getDocs(
      query(collection(db, 'users'), where('friendCode', '==', code), limit(5))
    );
    if (!byCode.empty) {
      const d = byCode.docs[0];
      return { uid: d.id, ...d.data() };
    }
  }

  const lower = nickKey(q);
  if (!lower) return null;
  const byNick = await getDocs(
    query(collection(db, 'users'), where('nicknameLower', '==', lower), limit(5))
  );
  if (byNick.empty) return null;
  const d = byNick.docs[0];
  return { uid: d.id, ...d.data() };
}

export const useFriendsSystem = create((set, get) => ({
  friends: [],
  incoming: [],
  outgoing: [],
  loading: false,
  error: null,
  myFriendCode: '',
  searchQuery: '',
  viewingFriend: null,
  lastSuccess: null,

  setSearchQuery: (v) => set({ searchQuery: v }),
  clearError: () => set({ error: null, lastSuccess: null }),
  closeFriendProfile: () => set({ viewingFriend: null }),

  refresh: async () => {
    if (!db || !auth.currentUser) return;
    set({ loading: true, error: null });
    try {
      const social = await ensureSocialProfileFields();
      const uid = auth.currentUser.uid;

      const [friendsSnap, incomingSnap, outgoingSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'friends')),
        getDocs(collection(db, 'users', uid, 'incoming')),
        getDocs(collection(db, 'users', uid, 'outgoing')),
      ]);

      const friends = friendsSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const incoming = incomingSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const outgoing = outgoingSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));

      const enriched = await Promise.all(
        friends.map(async (f) => {
          try {
            const snap = await getDoc(doc(db, 'users', f.uid));
            if (!snap.exists()) return f;
            const u = snap.data();
            return {
              ...f,
              name: u.name ? String(u.name).split(' ')[0] : f.name,
              aura: u.aura || 0,
              maxCombo: u.maxCombo || 0,
              activeModel: u.activeModel || f.activeModel || 'carol.vrm',
              friendCode: u.friendCode || '',
            };
          } catch {
            return f;
          }
        })
      );

      set({
        friends: enriched,
        incoming,
        outgoing,
        myFriendCode: social?.friendCode || '',
        loading: false,
      });

      try {
        usePresenceSystem.getState().watchFriends?.(enriched);
      } catch (err) {
        console.warn('[Friends] watchFriends:', err?.message || err);
      }
    } catch (e) {
      console.error('[Friends] refresh:', e);
      set({ loading: false, error: 'Não foi possível carregar amigos.' });
    }
  },

  sendRequest: async (rawQuery) => {
    if (!db || !auth.currentUser) {
      set({ error: 'Faça login para adicionar amigos.' });
      return false;
    }
    const me = auth.currentUser.uid;
    set({ error: null, lastSuccess: null, loading: true });
    try {
      const mySnap = await getDoc(doc(db, 'users', me));
      const myName = mySnap.data()?.name
        ? String(mySnap.data().name).split(' ')[0]
        : 'Jogador';

      const target = await findUserByNicknameOrCode(rawQuery);
      if (!target) {
        set({ loading: false, error: 'Jogador não encontrado. Confira o nick ou código.' });
        return false;
      }
      if (target.uid === me) {
        set({ loading: false, error: 'Você não pode adicionar a si mesmo.' });
        return false;
      }

      if (get().friends.some((f) => f.uid === target.uid)) {
        set({ loading: false, error: 'Vocês já são amigos.' });
        return false;
      }
      if (get().outgoing.some((o) => o.uid === target.uid)) {
        set({ loading: false, error: 'Pedido já enviado para este jogador.' });
        return false;
      }

      if (get().incoming.find((i) => i.uid === target.uid)) {
        await get().acceptRequest(target.uid);
        set({ loading: false, searchQuery: '', lastSuccess: 'Amizade formada!' });
        return true;
      }

      const targetName = target.name
        ? String(target.name).split(' ')[0]
        : 'Jogador';

      await setDoc(doc(db, 'users', target.uid, 'incoming', me), {
        fromUid: me,
        fromName: myName,
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      await setDoc(doc(db, 'users', me, 'outgoing', target.uid), {
        toUid: target.uid,
        toName: targetName,
        createdAt: serverTimestamp(),
        status: 'pending',
      });

      await get().refresh();
      set({
        loading: false,
        searchQuery: '',
        error: null,
        lastSuccess: `Pedido enviado para ${targetName}!`,
      });
      return true;
    } catch (e) {
      console.error('[Friends] sendRequest:', e);
      set({
        loading: false,
        error: 'Erro ao enviar pedido. Verifique as regras do Firestore.',
      });
      return false;
    }
  },

  acceptRequest: async (fromUid) => {
    if (!db || !auth.currentUser || !fromUid) return false;
    const me = auth.currentUser.uid;
    set({ loading: true, error: null });
    try {
      const mySnap = await getDoc(doc(db, 'users', me));
      const theirSnap = await getDoc(doc(db, 'users', fromUid));
      const myName = mySnap.data()?.name?.split(' ')[0] || 'Jogador';
      const theirName = theirSnap.data()?.name?.split(' ')[0] || 'Jogador';
      const theirAura = theirSnap.data()?.aura || 0;
      const theirMax = theirSnap.data()?.maxCombo || 0;
      const theirModel = theirSnap.data()?.activeModel || 'carol.vrm';
      const myAura = mySnap.data()?.aura || 0;
      const myMax = mySnap.data()?.maxCombo || 0;
      const myModel = mySnap.data()?.activeModel || 'carol.vrm';

      const incomingRef = doc(db, 'users', me, 'incoming', fromUid);
      const incomingSnap = await getDoc(incomingRef);
      const fromName = incomingSnap.data()?.fromName || theirName;

      await setDoc(doc(db, 'users', me, 'friends', fromUid), {
        name: fromName,
        aura: theirAura,
        maxCombo: theirMax,
        activeModel: theirModel,
        addedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'users', fromUid, 'friends', me), {
        name: myName,
        aura: myAura,
        maxCombo: myMax,
        activeModel: myModel,
        addedAt: serverTimestamp(),
      });

      await deleteDoc(incomingRef);
      await deleteDoc(doc(db, 'users', fromUid, 'outgoing', me)).catch(() => {});
      await deleteDoc(doc(db, 'users', me, 'outgoing', fromUid)).catch(() => {});
      await deleteDoc(doc(db, 'users', fromUid, 'incoming', me)).catch(() => {});

      await get().refresh();
      set({ loading: false, lastSuccess: `${fromName} agora é seu amigo!` });
      return true;
    } catch (e) {
      console.error('[Friends] accept:', e);
      set({ loading: false, error: 'Erro ao aceitar pedido.' });
      return false;
    }
  },

  rejectRequest: async (fromUid) => {
    if (!db || !auth.currentUser || !fromUid) return false;
    const me = auth.currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', me, 'incoming', fromUid));
      await deleteDoc(doc(db, 'users', fromUid, 'outgoing', me)).catch(() => {});
      await get().refresh();
      return true;
    } catch (e) {
      console.error('[Friends] reject:', e);
      set({ error: 'Erro ao recusar pedido.' });
      return false;
    }
  },

  cancelOutgoing: async (toUid) => {
    if (!db || !auth.currentUser || !toUid) return false;
    const me = auth.currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', me, 'outgoing', toUid));
      await deleteDoc(doc(db, 'users', toUid, 'incoming', me)).catch(() => {});
      await get().refresh();
      return true;
    } catch (e) {
      set({ error: 'Erro ao cancelar pedido.' });
      return false;
    }
  },

  removeFriend: async (friendUid) => {
    if (!db || !auth.currentUser || !friendUid) return false;
    const me = auth.currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', me, 'friends', friendUid));
      await deleteDoc(doc(db, 'users', friendUid, 'friends', me)).catch(() => {});
      await get().refresh();
      set({ viewingFriend: null });
      return true;
    } catch (e) {
      set({ error: 'Erro ao remover amigo.' });
      return false;
    }
  },

  openFriendProfile: async (friendUid) => {
    if (!db || !friendUid) return;
    try {
      const snap = await getDoc(doc(db, 'users', friendUid));
      if (!snap.exists()) {
        set({ error: 'Perfil do amigo não encontrado.' });
        return;
      }
      const u = snap.data();
      set({
        viewingFriend: {
          uid: friendUid,
          name: u.name ? String(u.name).split(' ')[0] : 'Jogador',
          aura: u.aura || 0,
          maxCombo: u.maxCombo || 0,
          weeklyAura: u.weeklyAura || 0,
          activeModel: u.activeModel || 'carol.vrm',
          friendCode: u.friendCode || '',
        },
      });
    } catch (e) {
      set({ error: 'Não foi possível abrir o perfil.' });
    }
  },
}));
