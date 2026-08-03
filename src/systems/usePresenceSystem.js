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
const EMPTY_TOASTS = Object.freeze([]);
const EMPTY_ONLINE = Object.freeze({});

let myPresenceRef = null;
let friendUnsubs = [];
const knownOnline = new Map();
let presenceBlocked = false; // true após 403 (regras RTDB)

function clearFriendWatchers() {
  for (const unsub of friendUnsubs) {
    try {
      if (typeof unsub === 'function') unsub();
    } catch (_) { /* ignore */ }
  }
  friendUnsubs = [];
}

function isPermissionError(e) {
  const code = e?.code || e?.message || '';
  return String(code).includes('PERMISSION_DENIED') || String(code) === '403' || e?.code === 403;
}

function blockPresence(reason) {
  if (presenceBlocked) return;
  presenceBlocked = true;
  clearFriendWatchers();
  console.warn('[Presence] Desativado (sem permissão RTDB). Publique as rules. Motivo:', reason);
}

export const usePresenceSystem = create((set, get) => ({
  onlineByUid: EMPTY_ONLINE,
  toasts: EMPTY_TOASTS,
  enabled: true,

  isFriendOnline: (uid) => !!(get().onlineByUid?.[uid]?.online),

  dismissToast: (id) => {
    set((s) => {
      const prev = Array.isArray(s.toasts) ? s.toasts : EMPTY_TOASTS;
      const next = prev.filter((t) => t.id !== id);
      return { toasts: next.length ? next : EMPTY_TOASTS };
    });
  },

  pushOnlineToast: (name) => {
    if (presenceBlocked) return;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const until = Date.now() + TOAST_MS;
    set((s) => {
      const prev = Array.isArray(s.toasts) ? s.toasts : EMPTY_TOASTS;
      return {
        toasts: [...prev.slice(-4), { id, name: name || 'Um amigo', until }],
      };
    });
    setTimeout(() => {
      get().dismissToast(id);
    }, TOAST_MS + 50);
  },

  startMyPresence: async (displayName) => {
    if (presenceBlocked || !rtdb || !auth?.currentUser) return;
    const uid = auth.currentUser.uid;
    const name = String(
      displayName || auth.currentUser.displayName || 'Jogador'
    ).split(' ')[0];

    if (myPresenceRef) {
      try {
        await onDisconnect(myPresenceRef).cancel();
      } catch (_) { /* ignore */ }
    }

    myPresenceRef = ref(rtdb, `presence/${uid}`);
    const payload = {
      online: true,
      name,
      lastSeen: serverTimestamp(),
    };

    try {
      await set(myPresenceRef, payload);
      try {
        await onDisconnect(myPresenceRef).set({
          online: false,
          name,
          lastSeen: serverTimestamp(),
        });
      } catch (e) {
        if (isPermissionError(e)) blockPresence(e?.code || e);
      }
    } catch (e) {
      if (isPermissionError(e)) {
        blockPresence(e?.code || e);
        set({ enabled: false });
      } else {
        console.warn('[Presence] startMyPresence:', e?.code || e?.message || e);
      }
    }
  },

  stopMyPresence: async () => {
    clearFriendWatchers();
    knownOnline.clear();

    if (myPresenceRef && rtdb && auth?.currentUser && !presenceBlocked) {
      try {
        await onDisconnect(myPresenceRef).cancel();
      } catch (_) { /* ignore */ }
      try {
        await set(myPresenceRef, {
          online: false,
          name: 'Jogador',
          lastSeen: serverTimestamp(),
        });
      } catch (_) { /* ignore */ }
    }
    myPresenceRef = null;
    set({ onlineByUid: EMPTY_ONLINE, toasts: EMPTY_TOASTS });
  },

  watchFriends: (friends = []) => {
    if (presenceBlocked || !rtdb) return;
    clearFriendWatchers();

    const list = Array.isArray(friends) ? friends : [];
    const nextKnown = new Set();

    for (const f of list) {
      const uid = f?.uid;
      if (!uid) continue;
      nextKnown.add(uid);

      const pref = ref(rtdb, `presence/${uid}`);
      const handler = (snap) => {
        if (presenceBlocked) return;
        const data = snap.val() || {};
        const online = !!data.online;
        const name = data.name || f.name || 'Amigo';
        const prev = knownOnline.get(uid);
        const prevEntry = get().onlineByUid?.[uid];

        // Evita set() se nada mudou (quebra loop de re-render)
        if (prevEntry && prevEntry.online === online && prevEntry.name === name) {
          knownOnline.set(uid, online);
          return;
        }

        knownOnline.set(uid, online);

        set((s) => ({
          onlineByUid: {
            ...(s.onlineByUid || EMPTY_ONLINE),
            [uid]: { online, name },
          },
        }));

        if (prev === false && online === true) {
          get().pushOnlineToast(name);
        }
      };

      try {
        const unsub = onValue(
          pref,
          handler,
          (err) => {
            if (isPermissionError(err)) {
              blockPresence(err?.code || err);
              set({ enabled: false });
            } else {
              console.warn('[Presence] watch friend', uid, err?.code || err?.message || err);
            }
          }
        );
        if (typeof unsub === 'function') friendUnsubs.push(unsub);
      } catch (e) {
        if (isPermissionError(e)) {
          blockPresence(e?.code || e);
          set({ enabled: false });
        }
      }
    }

    // Limpa uids removidos — só set se mudou
    set((s) => {
      const prev = s.onlineByUid || EMPTY_ONLINE;
      let changed = false;
      const next = { ...prev };
      for (const uid of Object.keys(next)) {
        if (!nextKnown.has(uid)) {
          delete next[uid];
          changed = true;
        }
      }
      for (const uid of [...knownOnline.keys()]) {
        if (!nextKnown.has(uid)) knownOnline.delete(uid);
      }
      if (!changed) return s;
      return { onlineByUid: Object.keys(next).length ? next : EMPTY_ONLINE };
    });
  },
}));

/** Selectors estáveis (nunca retornam `{}` / `[]` novos). */
export const selectPresenceToasts = (s) =>
  Array.isArray(s.toasts) ? s.toasts : EMPTY_TOASTS;
export const selectOnlineByUid = (s) => s.onlineByUid || EMPTY_ONLINE;
