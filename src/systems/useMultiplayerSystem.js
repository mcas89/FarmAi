import { create } from 'zustand';
import * as Colyseus from '@colyseus/sdk';

// URL do servidor local para desenvolvimento
// Quando for para o Fly.io, trocaremos para wss://farmaai-server.fly.dev
const COLYSEUS_SERVER = "wss://farmai-server.onrender.com";
const ROOM_NAME = "farma_room";

let colyseusClient = null;
let currentRoom = null;

export const useMultiplayerSystem = create((set, get) => ({
    isConnected: false,
    isTryingToJoin: false,
    currentRoomId: null,
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

    joinRoom: async (roomId, playerInfo = {}) => {
        const { initColyseusClient } = get();
        const client = initColyseusClient();
        
        set({ localPlayerInfo: playerInfo, isTryingToJoin: true });

        try {
            // joinOrCreate vai conectar à sala ou criá-la se não existir
            const room = await client.joinOrCreate(ROOM_NAME, {
                name: playerInfo?.name || 'Jogador'
            });

            currentRoom = room;

            set({
                isConnected: true,
                isTryingToJoin: false,
                currentRoomId: room.id,
            });

            console.log("Conectado ao Colyseus! ID da Sessão:", room.sessionId);

            // Esperar o estado inicial chegar do servidor
            room.onStateChange.once((state) => {
                if (!state.players) return;

                // Escutar adições de jogadores
                state.players.onAdd((player, sessionId) => {
                    if (sessionId !== room.sessionId) {
                        console.log("Novo jogador:", player?.name, sessionId);
                        set((stateObj) => ({
                            remotePlayers: {
                                ...stateObj.remotePlayers,
                                [sessionId]: {
                                    id: sessionId,
                                    position: player.position ? [player.position.x, player.position.y, player.position.z] : [player.x || 0, player.y || 0, player.z || 0],
                                    rotation: player.rotation ? [player.rotation.x, player.rotation.y, player.rotation.z] : [0, player.rotation || 0, 0],
                                    animation: player.animation || 'Idle',
                                    name: player?.name,
                                    model: player.model
                                }
                            }
                        }));
                    }

                    // Escutar mudanças no jogador
                    player.onChange(() => {
                        if (sessionId !== room.sessionId) {
                            set((stateObj) => ({
                                remotePlayers: {
                                    ...stateObj.remotePlayers,
                                    [sessionId]: {
                                        ...stateObj.remotePlayers[sessionId],
                                        position: player.position ? [player.position.x, player.position.y, player.position.z] : [player.x || 0, player.y || 0, player.z || 0],
                                        rotation: player.rotation ? [player.rotation.x, player.rotation.y, player.rotation.z] : [0, player.rotation || 0, 0],
                                        animation: player.animation,
                                        name: player?.name,
                                        model: player.model
                                    }
                                }
                            }));
                        }
                    });
                });

                // Escutar saídas de jogadores
                state.players.onRemove((player, sessionId) => {
                    console.log("Jogador saiu:", player?.name, sessionId);
                    set((stateObj) => {
                        const newRemotePlayers = { ...stateObj.remotePlayers };
                        delete newRemotePlayers[sessionId];
                        return { remotePlayers: newRemotePlayers };
                    });
                });
            });

            // Lidar com mensagens de chat (se formos usar room.onMessage)
            room.onMessage("chat", (message) => {
                set((state) => ({
                    chatMessages: [...state.chatMessages, message]
                }));
            });

            room.onLeave((code) => {
                console.log("Você saiu da sala Colyseus.", code);
                set({ isConnected: false, currentRoomId: null, remotePlayers: {} });
            });

            room.onError((code, message) => {
                console.error("Colyseus Error:", code, message);
            });

        } catch (e) {
            console.error("Erro ao conectar no Colyseus:", e);
            set({ isTryingToJoin: false, isConnected: false });
        }

        return true;
    },

    sendPosition: (position, rotation) => {
        if (!currentRoom) return;
        currentRoom.send("position", {
            x: position.x,
            y: position.y,
            z: position.z,
            rotation: rotation
        });
    },

    updateAuraValue: (score) => {
        if (!currentRoom) return;
        currentRoom.send("updateScore", { score });
    },

    sendAnimation: (animationName) => {
        if (!currentRoom) return;
        currentRoom.send("animation", { animation: animationName });
    },

    sendMessage: (text) => {
        if (!currentRoom) return;
        const { localPlayerInfo } = get();
        currentRoom.send("chat", {
            sender: localPlayerInfo?.name || "Jogador",
            text: text
        });
    },

    leaveRoom: () => {
        if (currentRoom) {
            currentRoom.leave();
            currentRoom = null;
        }
        set({ isConnected: false, currentRoomId: null, remotePlayers: {} });
    }
}));
