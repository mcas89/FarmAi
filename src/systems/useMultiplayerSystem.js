import { create } from 'zustand';
import { ref, onValue, set, remove, onDisconnect, update } from 'firebase/database';
import { rtdb, auth } from '../config/firebase';

let updateTimeout = null;

export const useMultiplayerSystem = create((setStore, getStore) => ({
    rooms: [],
    playersInRoom: {}, // { uid: { name, model, x, y, z, anim, timestamp } }
    currentRoomId: null,

    fetchRooms: () => {
        if (!rtdb) return;
        const roomsRef = ref(rtdb, 'rooms');
        onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roomsArray = Object.keys(data).map(key => ({
                    id: key,
                    name: data[key].name || key,
                    playersCount: data[key].players ? Object.keys(data[key].players).length : 0,
                    maxPlayers: data[key].maxPlayers || 10
                }));
                setStore({ rooms: roomsArray });
            } else {
                setStore({ rooms: [] });
            }
        });
    },

    createRoom: async (roomName) => {
        if (!rtdb) return null;
        const roomId = 'room_' + Date.now();
        const roomRef = ref(rtdb, `rooms/${roomId}`);
        await set(roomRef, {
            name: roomName,
            maxPlayers: 10
        });
        return roomId;
    },

    joinRoom: async (roomId, playerInfo) => {
        if (!rtdb || !auth.currentUser) return false;
        const uid = auth.currentUser.uid;
        
        // Sair da sala atual se tiver
        const current = getStore().currentRoomId;
        if (current) {
            getStore().leaveRoom();
        }

        const playerRef = ref(rtdb, `rooms/${roomId}/players/${uid}`);
        
        // Remove do banco ao desconectar o navegador
        onDisconnect(playerRef).remove();
        
        // Entra na sala
        await set(playerRef, {
            name: playerInfo.name || 'Jogador',
            model: playerInfo.model || 'san.vrm',
            x: 0, y: 0.1, z: 0,
            anim: 'idle',
            timestamp: Date.now()
        });

        setStore({ currentRoomId: roomId });

        // Escuta os outros jogadores
        const roomPlayersRef = ref(rtdb, `rooms/${roomId}/players`);
        onValue(roomPlayersRef, (snapshot) => {
            const players = snapshot.val() || {};
            setStore({ playersInRoom: players });
        });

        return true;
    },

    leaveRoom: () => {
        if (!rtdb || !auth.currentUser) return;
        const uid = auth.currentUser.uid;
        const currentRoomId = getStore().currentRoomId;
        
        if (currentRoomId) {
            const playerRef = ref(rtdb, `rooms/${currentRoomId}/players/${uid}`);
            remove(playerRef);
            setStore({ currentRoomId: null, playersInRoom: {} });
        }
    },

    updatePosition: (x, y, z, anim, model, aura, leftFarm = false, rightFarm = false) => {
        const { currentRoomId } = getStore();
        if (!rtdb || !auth.currentUser || !currentRoomId) return;
        
        if (updateTimeout) return;

        updateTimeout = setTimeout(() => {
            updateTimeout = null;
            const uid = auth.currentUser.uid;
            const playerRef = ref(rtdb, `rooms/${currentRoomId}/players/${uid}`);
            
            const updates = { x, y, z, anim, timestamp: Date.now(), leftFarm, rightFarm };
            if (model) updates.model = model;
            if (aura !== undefined) updates.aura = aura;
            
            update(playerRef, updates);
        }, 300);
    }
}));
