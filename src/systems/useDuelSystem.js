import { create } from 'zustand';
import { db, auth } from '../config/firebase';
import { collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { useMultiplayerSystem } from './useMultiplayerSystem';
import { useUISystem } from './useUISystem';
import { usePlayerSystem } from './usePlayerSystem';
import * as Colyseus from '@colyseus/sdk';

const COLYSEUS_SERVER = "wss://farmai-server.onrender.com";

let colyseusClient = null;
let duelRoom = null;

export const useDuelSystem = create((set, get) => ({
    incomingInvites: [], // Lista de convites recebidos
    activeDuelRoom: null, // Instância da DuelRoom no Colyseus
    duelState: null, // Estado da partida atual (players, timer, scores)
    isSearching: false, // Se está aguardando resposta do adversário

    // 1. Enviar um convite (Matchmaking via Firestore)
    sendInvite: async (targetUid, targetName) => {
        const myUid = useMultiplayerSystem.getState().mySessionId;
        if (!myUid) return;
        const myName = useUISystem.getState().playerStats.nickname || 'Jogador';
        
        set({ isSearching: true });
        
        try {
            const inviteRef = doc(db, 'duel_invites', `${myUid}_${targetUid}`);
            await setDoc(inviteRef, {
                fromUid: myUid,
                fromName: myName,
                toUid: targetUid,
                toName: targetName,
                status: 'pending',
                createdAt: new Date().getTime(),
                betAmount: 10 // Aposta Padrão Inicial
            });
            console.log("Convite de duelo enviado para", targetName);
        } catch (e) {
            console.error("Erro ao enviar convite", e);
            set({ isSearching: false });
        }
    },

    // 2. Escutar convites recebidos
    listenForInvites: () => {
        const myUid = useMultiplayerSystem.getState().mySessionId;
        if (!myUid) return;
        
        const q = query(collection(db, 'duel_invites'), where('toUid', '==', myUid), where('status', '==', 'pending'));
        
        return onSnapshot(q, (snapshot) => {
            const invites = [];
            snapshot.forEach(doc => {
                invites.push({ id: doc.id, ...doc.data() });
            });
            set({ incomingInvites: invites });
        });
    },

    // 3. Responder convite
    respondToInvite: async (inviteId, accept) => {
        const inviteRef = doc(db, 'duel_invites', inviteId);
        if (accept) {
            // Pega os dados ANTES de atualizar, senão o listener de pending remove ele!
            const inviteData = get().incomingInvites.find(i => i.id === inviteId);
            await updateDoc(inviteRef, { status: 'accepted' });
            
            // Entrar na sala de duelo
            if (inviteData) {
                get().joinDuelRoom(inviteId, inviteData.betAmount);
            }
        } else {
            await updateDoc(inviteRef, { status: 'declined' });
        }
    },

    // Escutar se o nosso convite enviado foi aceito
    listenToMyInvite: (targetUid) => {
        const myUid = useMultiplayerSystem.getState().mySessionId;
        if (!myUid) return;
        const inviteId = `${myUid}_${targetUid}`;
        
        const inviteRef = doc(db, 'duel_invites', inviteId);
        return onSnapshot(inviteRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === 'accepted') {
                    set({ isSearching: false });
                    get().joinDuelRoom(inviteId, data.betAmount);
                    // Opcional: apagar o convite do firestore depois de entrar
                    deleteDoc(inviteRef).catch(e => console.log(e));
                } else if (data.status === 'declined') {
                    set({ isSearching: false });
                    console.log(`${data.toName} recusou o duelo.`);
                    deleteDoc(inviteRef).catch(e => console.log(e));
                }
            }
        });
    },

    // 4. Conectar na DuelRoom do Colyseus
    joinDuelRoom: async (duelId, betAmount) => {
        if (!colyseusClient) {
            colyseusClient = new Colyseus.Client(COLYSEUS_SERVER);
        }

        try {
            const currentAuracash = useUISystem.getState().playerStats.auracash || 0;
            const actualBetAmount = betAmount || 10;
            
            // Validar se tem saldo antes de conectar
            if (currentAuracash < actualBetAmount) {
                alert("Você não tem AuraCash suficiente para este duelo!");
                return;
            }

            const myName = useUISystem.getState().playerStats.nickname || 'Jogador';
            const myModel = usePlayerSystem.getState().activeModel || 'san.vrm';
            
            const room = await colyseusClient.joinOrCreate("duel_room", {
                duelId: duelId,
                name: myName,
                model: myModel,
                betAmount: actualBetAmount
            });

            duelRoom = room;
            set({ activeDuelRoom: room });
            
            // Muda a tela principal para o modo Duelo!
            useUISystem.getState().setScreen('DUEL');

            // Debitar a aposta imediatamente ao entrar na sala (Taxa de entrada)
            useUISystem.getState().updateStats({ auracash: currentAuracash - actualBetAmount });
            console.log(`[Duelo] Aposta de ${actualBetAmount} AuraCash debitada.`);

            // Escutar estado
            room.onStateChange((state) => {
                set({ duelState: { ...state } });
            });

            // Escutar fim de jogo
            room.onMessage("game_over", (data) => {
                console.log("FIM DO DUELO!", data);
                
                const myId = room.sessionId;
                const finalAuracash = useUISystem.getState().playerStats.auracash || 0;
                
                if (data.isDraw) {
                    // Empate: Reembolsa a aposta
                    useUISystem.getState().updateStats({ auracash: finalAuracash + data.betAmount });
                    console.log(`[Duelo] Empate! Aposta de ${data.betAmount} devolvida.`);
                } else if (data.winnerSessionId === myId) {
                    // Vitória: Recebe o prêmio total (Sua aposta + Aposta do adversário)
                    const prize = data.betAmount * 2;
                    useUISystem.getState().updateStats({ auracash: finalAuracash + prize });
                    console.log(`[Duelo] Vitória! Prêmio de ${prize} AuraCash recebido!`);
                } else {
                    // Derrota: Já foi debitado ao entrar, não faz nada
                    console.log(`[Duelo] Derrota. Você perdeu ${data.betAmount} AuraCash.`);
                }
            });

        } catch (e) {
            console.error("Erro ao entrar na sala de duelo", e);
            alert("Falha ao iniciar duelo. Servidor pode estar offline.");
        }
    },
    
    // 5. Enviar hits durante a partida
    sendDuelHit: (totalScore) => {
        if (duelRoom) {
            duelRoom.send("hit_batch", { score: totalScore });
        }
    },

    leaveDuel: () => {
        if (duelRoom) {
            duelRoom.leave();
            duelRoom = null;
        }
        set({ activeDuelRoom: null, duelState: null });
        useUISystem.getState().setScreen('GAME');
    }
}));
