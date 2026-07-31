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
        const stats = useUISystem.getState().playerStats;
        const myName = stats.nickname || 'Jogador';
        
        const betAmount = 10;
        const currentAuracash = stats.diamonds || stats.auracash || 0;

        if (currentAuracash < betAmount) {
            alert("Você não tem AuraCash suficiente para duelar (Mínimo: 10)!");
            return;
        }
        
        set({ isSearching: true });
        
        try {
            // Debita os 10 assim que solicita o combate
            useUISystem.getState().updateStats({ 
                diamonds: currentAuracash - betAmount,
                auracash: currentAuracash - betAmount
            });
            console.log(`[Duelo] Taxa de convite de ${betAmount} AuraCash debitada.`);

            const inviteRef = doc(db, 'duel_invites', `${myUid}_${targetUid}`);
            await setDoc(inviteRef, {
                fromUid: myUid,
                fromName: myName,
                toUid: targetUid,
                toName: targetName,
                status: 'pending',
                createdAt: new Date().getTime(),
                betAmount: betAmount
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
            const inviteData = get().incomingInvites.find(i => i.id === inviteId);
            if (!inviteData) return;

            const stats = useUISystem.getState().playerStats;
            const currentAuracash = stats.diamonds || stats.auracash || 0;
            const betAmount = inviteData.betAmount || 10;

            if (currentAuracash < betAmount) {
                alert("Você não tem AuraCash suficiente para aceitar este duelo!");
                return;
            }

            // Debita se o adversário aceitar
            useUISystem.getState().updateStats({ 
                diamonds: currentAuracash - betAmount,
                auracash: currentAuracash - betAmount
            });
            console.log(`[Duelo] Taxa de aceite de ${betAmount} AuraCash debitada.`);

            await updateDoc(inviteRef, { status: 'accepted' });
            get().joinDuelRoom(inviteId, betAmount);
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
                    deleteDoc(inviteRef).catch(e => console.log(e));
                } else if (data.status === 'declined') {
                    set({ isSearching: false });
                    console.log(`${data.toName} recusou o duelo. Reembolsando aposta.`);
                    
                    // Reembolso pois foi recusado
                    const stats = useUISystem.getState().playerStats;
                    const finalAuracash = stats.diamonds || stats.auracash || 0;
                    useUISystem.getState().updateStats({ 
                        diamonds: finalAuracash + (data.betAmount || 10),
                        auracash: finalAuracash + (data.betAmount || 10)
                    });
                    
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
            const actualBetAmount = betAmount || 10;
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

            // Escutar estado
            room.onStateChange((state) => {
                set({ duelState: { ...state } });
            });

            // Escutar fim de jogo
            room.onMessage("game_over", (data) => {
                console.log("FIM DO DUELO!", data);
                
                const myId = room.sessionId;
                const stats = useUISystem.getState().playerStats;
                const finalAuracash = stats.diamonds || stats.auracash || 0;
                
                if (data.isDraw) {
                    // Empate: Reembolsa a aposta
                    useUISystem.getState().updateStats({ 
                        diamonds: finalAuracash + data.betAmount,
                        auracash: finalAuracash + data.betAmount
                    });
                    console.log(`[Duelo] Empate! Aposta de ${data.betAmount} devolvida.`);
                } else if (data.winnerSessionId === myId) {
                    // Vitória: Recebe o prêmio total (Sua aposta + Aposta do adversário)
                    const prize = data.betAmount * 2;
                    useUISystem.getState().updateStats({ 
                        diamonds: finalAuracash + prize,
                        auracash: finalAuracash + prize 
                    });
                    console.log(`[Duelo] Vitória! Prêmio de ${prize} AuraCash recebido!`);
                } else {
                    // Derrota: Já foi debitado ao enviar/aceitar convite, não faz nada
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
