import { create } from 'zustand';
import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { auth, rtdb } from '../config/firebase';

const TOAST_MS = 4500;

let myPresenceRef = null;
let friendUnsubs = [];
/** Evita toast na primeira leitura (amigo já estava online). */
const knownOnline = new Map(); // uid -> boolean

function clearFriendWatchers() {
  for (const unsub of friendUnsubs) {
    try { unsub(); } catch (_) { /* ignore */ }
  }
  friendUnsubs = [];
}

export const usePresenceSystem = create((set, get) => ({
  /** { [uid]: { online: boolean, name: string } } */
  onlineByUid: {},
  /** Cards flutuantes: { id, name, until } */
  toasts: [],

  isFriendOnline: (uid) => !!(get().onlineByUid[uid]?.online),

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  pushOnlineToast: (name) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const until = Date.now() + TOAST_MS;
    set((s) => ({
      toasts: [...s.toasts.slice(-4), { id, name: name || 'Um amigo', until }],
    }));
    setTimeout(() => {
      get().dismissToast(id);
    }, TOAST_MS + 50);
  },

  /** Marca o jogador local como online (app inteiro). */
  startMyPresence: async (displayName) => {
    if (!rtdb || !auth?.currentUser) return;
    const uid = auth.currentUser.uid;
    const name =
      displayName ||
      auth.currentUser.displayName ||
      'Jogador';

    await get().stopMyPresence();

    myPresenceRef = ref(rtdb, `presence/${uid}`);
    const payload = {
      online: true,
      name: String(name).split(' ')[0],
      lastSeen: serverTimestamp(),
    };

    try {
      await set(myPresenceRef, payload);
      await onDisconnect(myPresenceRef).set({
        online: false,
        name: payload.name,
        lastSeen: serverTimestamp(),
      });
    } catch (e) {
      console.warn('[Presence] startMyPresence:', e?.message || e);
    }
  },

  stopMyPresence: async () => {
    clearFriendWatchers();
    knownOnline.clear();

    if (myPresenceRef && rtdb && auth?.currentUser) {
      try {
        await onDisconnect(myPresenceRef).cancel();
      } catch (_) { /* ignore */ }
      try {
        await set(myPresenceRef, {
          online: false,
          name: get().onlineByUid[auth.currentUser.uid]?.name || 'Jogador',
          lastSeen: serverTimestamp(),
        });
      } catch (_) { /* ignore */ }
    }
    myPresenceRef = null;
    set({ onlineByUid: {}, toasts: [] });
  },

  /**
   * Observa presence dos amigos.
   * Toast só quando muda de offline → online (não na 1ª leitura).
   */
  watchFriends: (friends = []) => {
    if (!rtdb) return;
    clearFriendWatchers();

    const list = Array.isArray(friends) ? friends : [];
    const nextKnown = new Set();

    for (const f of list) {
      const uid = f?.uid;
      if (!uid) continue;
      nextKnown.add(uid);

      const pref = ref(rtdb, `presence/${uid}`);
      const handler = (snap) => {
        const data = snap.val() || {};
        const online = !!data.online;
        const name = data.name || f.name || 'Amigo';
        const prev = knownOnline.get(uid);

        knownOnline.set(uid, online);

        set((s) => ({
          onlineByUid: {
            ...s.onlineByUid,
            [uid]: { online, name },
          },
        }));

        // Toast apenas em transição offline → online (após já conhecermos o estado)
        if (prev === false && online === true) {
          get().pushOnlineToast(name);
        }
      };

      const unsub = onValue(pref, handler, (err) => {
        console.warn('[Presence] watch friend', uid, err?.message || err);
      });
      friendUnsubs.push(unsub);
    }

    // Limpa uids que saíram da lista
    set((s) => {
      const next = { ...s.onlineByUid };
      for (const uid of Object.keys(next)) {
        if (!nextKnown.has(uid)) delete next[uid];
      }
      for (const uid of [...knownOnline.keys()]) {
        if (!nextKnown.has(uid)) knownOnline.delete(uid);
      }
      return { onlineByUid: next };
    });
  },
}));
