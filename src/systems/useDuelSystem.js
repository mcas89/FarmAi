import { create } from 'zustand';
import { db, auth } from '../config/firebase';
import { collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { useMultiplayerSystem } from './useMultiplayerSystem';
import { useUISystem } from './useUISystem';
import * as Colyseus from '@colyseus/sdk';

const COLYSEUS_SERVER = "wss://farmai-server.onrender.com";

let colyseusClient = null;
let DUELRoom = null;

export const useDUELSystem = create((set, get) => ({
    incomingInvites: [], // Lista de convites recebidos
    activeDUELRoom: null, // Instância da DUELRoom no Colyseus
    DUELState: null, // Estado da partida atual (players, timer, scores)
    isSearching: false, // Se está aguardando resposta do adversário

    // 1. Enviar um convite (Matchmaking via Firestore)
    sendInvite: async (targetUid, targetName) => {
        if (!auth.currentUser) return;
        const myUid = auth.currentUser.uid;
        const myName = useUISystem.getState().playerStats.nickname || 'Jogador';
        
        set({ isSearching: true });
        
        try {
            const inviteRef = doc(db, 'DUEL_invites', `${myUid}_${targetUid}`);
            await setDoc(inviteRef, {
                fromUid: myUid,
                fromName: myName,
                toUid: targetUid,
                toName: targetName,
                status: 'pending',
                createdAt: new Date().getTime(),
                betAmount: 10 // Aposta Padrão Inicial
            });
            console.log("Convite de DUELo enviado para", targetName);
        } catch (e) {
            console.error("Erro ao enviar convite", e);
            set({ isSearching: false });
        }
    },

    // 2. Escutar convites recebidos
    listenForInvites: () => {
        if (!auth.currentUser) return;
        
        const q = query(collection(db, 'DUEL_invites'), where('toUid', '==', auth.currentUser.uid), where('status', '==', 'pending'));
        
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
        const inviteRef = doc(db, 'DUEL_invites', inviteId);
        if (accept) {
            await updateDoc(inviteRef, { status: 'accepted' });
            // Entrar na sala de DUELo
            const inviteData = get().incomingInvites.find(i => i.id === inviteId);
            if (inviteData) {
                get().joinDUELRoom(inviteId, inviteData.betAmount);
            }
        } else {
            await updateDoc(inviteRef, { status: 'declined' });
        }
    },

    // Escutar se o nosso convite enviado foi aceito
    listenToMyInvite: (targetUid) => {
        if (!auth.currentUser) return;
        const myUid = auth.currentUser.uid;
        const inviteId = `${myUid}_${targetUid}`;
        
        const inviteRef = doc(db, 'DUEL_invites', inviteId);
        return onSnapshot(inviteRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.status === 'accepted') {
                    set({ isSearching: false });
                    get().joinDUELRoom(inviteId, data.betAmount);
                    // Opcional: apagar o convite do firestore depois de entrar
                    deleteDoc(inviteRef).catch(e => console.log(e));
                } else if (data.status === 'declined') {
                    set({ isSearching: false });
                    alert(`${data.toName} recusou o DUELo.`);
                    deleteDoc(inviteRef).catch(e => console.log(e));
                }
            }
        });
    },

    // 4. Conectar na DUELRoom do Colyseus
    joinDUELRoom: async (DUELId, betAmount) => {
        if (!colyseusClient) {
            colyseusClient = new Colyseus.Client(COLYSEUS_SERVER);
        }

        try {
            const myName = useUISystem.getState().playerStats.nickname || 'Jogador';
            const room = await colyseusClient.joinOrCreate("DUEL_room", {
                DUELId: DUELId,
                name: myName,
                betAmount: betAmount
            });

            DUELRoom = room;
            set({ activeDUELRoom: room });
            
            // Muda a tela principal para o modo DUELo!
            useUISystem.getState().setScreen('DUEL');

            // Escutar estado
            room.onStateChange((state) => {
                set({ DUELState: { ...state } });
            });

            // Escutar fim de jogo
            room.onMessage("game_over", (data) => {
                console.log("FIM DO DUELO!", data);
                // processar recompensas (Fase 4)
                alert(`FIM DO DUELO! Vencedor: ${data.winnerSessionId}`);
            });

        } catch (e) {
            console.error("Erro ao entrar na sala de DUELo", e);
            alert("Falha ao iniciar DUELo. Servidor pode estar offline.");
        }
    },
    
    // 5. Enviar hits durante a partida
    sendDUELHit: (totalScore) => {
        if (DUELRoom) {
            DUELRoom.send("hit_batch", { score: totalScore });
        }
    },

    leaveDUEL: () => {
        if (DUELRoom) {
            DUELRoom.leave();
            DUELRoom = null;
        }
        set({ activeDUELRoom: null, DUELState: null });
        useUISystem.getState().setScreen('game');
    }
}));
