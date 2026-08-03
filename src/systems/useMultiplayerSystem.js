import { create } from 'zustand';
import * as Colyseus from '@colyseus/sdk';
import { auth } from '../config/firebase';

// URL do servidor de produção (Render)
// Troque para ws://localhost:2567 para testar localmente
const COLYSEUS_SERVER = "wss://farmai-server.onrender.com";
const ROOM_NAME = "farma_room";

let colyseusClient = null;
let currentRoom = null;
/** Evita que onLeave/onStateChange de uma sala antiga baguncem a conexão nova. */
let roomEpoch = 0;

async function forceLeaveRoom(room) {
    if (!room) return;
    try {
        await room.leave(true);
    } catch (e) {
        console.warn("[Multiplayer] leave:", e?.message || e);
        try {
            room.connection?.close();
        } catch (_) { /* ignore */ }
    }
}

export const useMultiplayerSystem = create((set, get) => ({
    isConnected: false,
    isTryingToJoin: false,
    currentRoomId: null,
    mySessionId: null,
    remotePlayers: {},
    localPlayerInfo: null,
    latency: 0,
    chatMessages: [],

    // Instancia o cliente Colyseus apenas uma vez
    initColyseusClient: () => {
        if (!colyseusClient) {
            colyseusClient = new Colyseus.Client(COLYSEUS_SERVER);
        }
        return colyseusClient;
    },

    getGlobalOnlineCount: async () => {
        try {
            // Converte wss://... para https://... ou ws://... para http://...
            const httpUrl = COLYSEUS_SERVER.replace('ws', 'http');
            const response = await fetch(`${httpUrl}/api/online`);
            const data = await response.json();
            return data.online || 0;
        } catch (e) {
            console.error("Erro ao buscar contagem global online:", e);
            return 0;
        }
    },

    leaveRoom: async () => {
        const room = currentRoom;
        const epochAtLeave = roomEpoch;
        currentRoom = null;
        roomEpoch += 1;

        await forceLeaveRoom(room);

        // Só limpa se ninguém entrou em outra sala nesse meio tempo
        if (roomEpoch === epochAtLeave + 1 && !currentRoom) {
            set({
                isConnected: false,
                isTryingToJoin: false,
                currentRoomId: null,
                mySessionId: null,
                remotePlayers: {},
            });
        }
    },

    joinRoom: async (roomId, playerInfo = {}) => {
        if (get().isTryingToJoin) return false;

        // Sempre sai da sessão anterior (evita clone/fantasma da própria sessão)
        await get().leaveRoom();

        const { initColyseusClient } = get();
        const client = initColyseusClient();
        const epoch = roomEpoch;
        const uid = playerInfo?.uid || auth?.currentUser?.uid || '';

        const localInfo = { ...playerInfo, uid };
        set({ localPlayerInfo: localInfo, isTryingToJoin: true, remotePlayers: {} });

        try {
            const room = await client.joinOrCreate(ROOM_NAME, {
                name: localInfo?.name || 'Jogador',
                model: localInfo?.model || 'carol.vrm',
                aura: localInfo?.aura || 0,
                uid,
            });

            // leaveRoom paralelo / cancelamento
            if (epoch !== roomEpoch) {
                await forceLeaveRoom(room);
                return false;
            }

            currentRoom = room;

            set({
                isConnected: true,
                isTryingToJoin: false,
                currentRoomId: room.id,
                mySessionId: room.sessionId,
                remotePlayers: {},
            });

            console.log(`[Multiplayer] Conectado! Sessão: ${room.sessionId}`);

            const isActiveRoom = () => currentRoom === room && get().mySessionId === room.sessionId;

            // Escuta mudanças de estado e sincroniza os remotePlayers
            room.onStateChange((state) => {
                if (!isActiveRoom()) return;
                if (!state.players) return;

                const myId = room.sessionId;
                const myUid = get().localPlayerInfo?.uid || uid || '';
                const myName = get().localPlayerInfo?.name || '';
                const myModel = get().localPlayerInfo?.model || '';
                const newRemotePlayers = {};

                state.players.forEach((player, sessionId) => {
                    if (sessionId === myId) return;

                    const pUid = player.uid || '';
                    // Fantasma da própria conta (mesmo uid) — não renderiza
                    if (myUid && pUid && pUid === myUid) return;
                    // Fallback enquanto o servidor antigo ainda não envia uid
                    if (!pUid && myName && player.name === myName && (player.model || 'carol.vrm') === myModel) {
                        return;
                    }

                    newRemotePlayers[sessionId] = {
                        id: sessionId,
                        uid: pUid,
                        name: player.name,
                        model: player.model || 'carol.vrm',
                        position: [player.x || 0, player.y || 0, player.z || 0],
                        rotation: player.rotation || 0,
                        animation: player.animation || 'idle',
                        leftFarm: player.leftFarm || false,
                        rightFarm: player.rightFarm || false,
                        aura: player.aura || 0,
                    };
                });

                set({ remotePlayers: newRemotePlayers });
            });

            // Chat
            room.onMessage("chat", (message) => {
                if (!isActiveRoom()) return;
                set((state) => ({
                    chatMessages: [...state.chatMessages.slice(-49), message]
                }));
            });

            room.onLeave((code) => {
                console.log("[Multiplayer] Saiu da sala. Código:", code);
                if (currentRoom === room) {
                    currentRoom = null;
                }
                // Não zerar se o jogador já entrou em outra sala
                if (get().mySessionId !== room.sessionId) return;
                set({
                    isConnected: false,
                    currentRoomId: null,
                    mySessionId: null,
                    remotePlayers: {},
                });
            });

            room.onError((code, message) => {
                console.error("[Multiplayer] Erro:", code, message);
            });

        } catch (e) {
            console.error("[Multiplayer] Erro ao conectar:", e);
            if (epoch === roomEpoch) {
                set({ isTryingToJoin: false, isConnected: false });
            }
            return false;
        }

        return true;
    },

    // Envia posição e rotação do jogador local (throttle: 30fps max)
    sendPosition: (() => {
        let lastSent = 0;
        return (position, rotation) => {
            if (!currentRoom) return;
            const now = Date.now();
            if (now - lastSent < 33) return; // throttle: 30fps
            lastSent = now;
            currentRoom.send("position", {
                x: position[0] ?? position.x ?? 0,
                y: position[1] ?? position.y ?? 0,
                z: position[2] ?? position.z ?? 0,
                rotation: rotation,
            });
        };
    })(),

    // Envia o estado da animação e dos braços de farm
    sendAnimation: (animationName, leftFarm = false, rightFarm = false) => {
        if (!currentRoom) return;
        currentRoom.send("animation", {
            animation: animationName,
            leftFarm,
            rightFarm,
        });
    },

    // Envia o valor de aura atualizado
    updateAuraValue: (score) => {
        if (!currentRoom) return;
        currentRoom.send("updateScore", { score });
    },

    // Envia mensagem de chat
    sendChatMessage: (text) => {
        if (!currentRoom) return;
        const { localPlayerInfo } = get();
        currentRoom.send("chat", {
            sender: localPlayerInfo?.name || "Jogador",
            text: text,
        });
    },
}));
