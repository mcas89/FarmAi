import { create } from 'zustand';
import * as Colyseus from '@colyseus/sdk';

// URL do servidor de produção (Render)
// Troque para ws://localhost:2567 para testar localmente
const COLYSEUS_SERVER = "wss://farmai-server.onrender.com";
const ROOM_NAME = "farma_room";

let colyseusClient = null;
let currentRoom = null;

export const useMultiplayerSystem = create((set, get) => ({
    isConnected: false,
    isTryingToJoin: false,
    currentRoomId: null,
    mySessionId: null,
    remotePlayers: {},
    localPlayerInfo: null,
    latency: 0,
    chatMessages: [], playerMessages: {},

    // Instancia o cliente Colyseus apenas uma vez
    initColyseusClient: () => {
        if (!colyseusClient) {
            colyseusClient = new Colyseus.Client(COLYSEUS_SERVER);
        }
        return colyseusClient;
    },

    getGlobalOnlineCount: async () => {
        const { initColyseusClient } = get();
        const client = initColyseusClient();
        try {
            const availableRooms = await client.getAvailableRooms(ROOM_NAME);
            if (availableRooms && availableRooms.length > 0) {
                return availableRooms.reduce((acc, room) => acc + room.clients, 0);
            }
            return 0;
        } catch (e) {
            console.error("Erro ao buscar contagem global online:", e);
            return 0;
        }
    },

    joinRoom: async (roomId, playerInfo = {}) => {
        const { initColyseusClient } = get();
        const client = initColyseusClient();
        
        set({ localPlayerInfo: playerInfo, isTryingToJoin: true });

        try {
            const room = await client.joinOrCreate(ROOM_NAME, {
                name: playerInfo?.name || 'Jogador',
                model: playerInfo?.model || 'san.vrm',
                aura: playerInfo?.aura || 0,
            });

            currentRoom = room;

            set({
                isConnected: true,
                isTryingToJoin: false,
                currentRoomId: room.id,
                mySessionId: room.sessionId,
            });

            console.log(`[Multiplayer] Conectado! Sessão: ${room.sessionId}`);

            // Escuta mudanças de estado e sincroniza os remotePlayers
            room.onStateChange((state) => {
                if (!state.players) return;

                set((storeState) => {
                    const newRemotePlayers = {};
                    
                    state.players.forEach((player, sessionId) => {
                        // Ignora o próprio jogador
                        if (sessionId === room.sessionId) return;
                        
                        newRemotePlayers[sessionId] = {
                            id: sessionId,
                            name: player.name,
                            model: player.model || 'san.vrm',
                            position: [player.x || 0, player.y || 0, player.z || 0],
                            rotation: player.rotation || 0,
                            animation: player.animation || 'idle',
                            leftFarm: player.leftFarm || false,
                            rightFarm: player.rightFarm || false,
                            aura: player.aura || 0,
                        };
                    });

                    return { remotePlayers: newRemotePlayers };
                });
            });

            // Chat
            room.onMessage("chat", (message) => {
                set((state) => {
                    const newMessages = { ...state.playerMessages };
                    if (message.sessionId) {
                        newMessages[message.sessionId] = message.text;
                        
                        // Limpa o balão após 5 segundos
                        setTimeout(() => {
                            set((s) => {
                                const msgs = { ...s.playerMessages };
                                if (msgs[message.sessionId] === message.text) {
                                    delete msgs[message.sessionId];
                                }
                                return { playerMessages: msgs };
                            });
                        }, 5000);
                    }
                    
                    return {
                        chatMessages: [...state.chatMessages.slice(-49), message],
                        playerMessages: newMessages
                    };
                });
            });

            room.onLeave((code) => {
                console.log("[Multiplayer] Saiu da sala. Código:", code);
                currentRoom = null;
                set({ isConnected: false, currentRoomId: null, mySessionId: null, remotePlayers: {} });
            });

            room.onError((code, message) => {
                console.error("[Multiplayer] Erro:", code, message);
            });

        } catch (e) {
            console.error("[Multiplayer] Erro ao conectar:", e);
            set({ isTryingToJoin: false, isConnected: false });
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

    leaveRoom: () => {
        if (currentRoom) {
            currentRoom.leave();
            currentRoom = null;
        }
        set({ isConnected: false, currentRoomId: null, mySessionId: null, remotePlayers: {} });
    }
}));
