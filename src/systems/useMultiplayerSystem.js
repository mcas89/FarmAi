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

            // Sincronizar estado completo usando onStateChange para compatibilidade máxima com Colyseus 0.17
            room.onStateChange((state) => {
                if (!state.players) return;

                set((stateObj) => {
                    const newRemotePlayers = { ...stateObj.remotePlayers };
                    const activeSessions = new Set();
                    let hasChanges = false;

                    // Iterar sobre o Map/MapSchema
                    state.players.forEach((player, sessionId) => {
                        activeSessions.add(sessionId);
                        
                        if (sessionId !== room.sessionId) {
                            const newPos = player.position ? [player.position.x, player.position.y, player.position.z] : [player.x || 0, player.y || 0, player.z || 0];
                            const newRot = player.rotation ? [player.rotation.x, player.rotation.y, player.rotation.z] : [0, player.rotation || 0, 0];
                            const newAnim = player.animation || 'Idle';
                            const newModel = player.model;
                            const newName = player?.name;

                            const existing = newRemotePlayers[sessionId];
                            
                            // Só atualiza se algo de fato mudou
                            if (!existing || 
                                existing.position[0] !== newPos[0] || existing.position[1] !== newPos[1] || existing.position[2] !== newPos[2] ||
                                existing.rotation[0] !== newRot[0] || existing.rotation[1] !== newRot[1] || existing.rotation[2] !== newRot[2] ||
                                existing.animation !== newAnim ||
                                existing.model !== newModel ||
                                existing.name !== newName) 
                            {
                                newRemotePlayers[sessionId] = {
                                    id: sessionId,
                                    position: newPos,
                                    rotation: newRot,
                                    animation: newAnim,
                                    name: newName,
                                    model: newModel
                                };
                                hasChanges = true;
                            }
                        }
                    });

                    // Remover jogadores que saíram
                    Object.keys(newRemotePlayers).forEach(sessionId => {
                        if (!activeSessions.has(sessionId)) {
                            console.log("Jogador desconectado:", newRemotePlayers[sessionId].name, sessionId);
                            delete newRemotePlayers[sessionId];
                            hasChanges = true;
                        }
                    });

                    if (hasChanges) {
                        return { remotePlayers: newRemotePlayers };
                    }
                    
                    return stateObj;
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
