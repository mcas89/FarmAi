import { create } from 'zustand';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Lista Mestre de Conquistas (id numérico, tipo, alvo, recompensa, título e descrição)
const MASTER_ACHIEVEMENTS = [
    // ==========================================
    // INÍCIO
    // ==========================================
    { id: 1, type: 'login', target: 1, reward: 5, title: 'Primeiro Login', desc: 'Entrar no jogo pela primeira vez.' },
    { id: 2, type: 'aura', target: 1, reward: 5, title: 'Primeiro Farm', desc: 'Conseguiu sua primeira Aura.' },
    { id: 3, type: 'combo', target: 10, reward: 5, title: 'Primeiro Combo 10', desc: 'Alcançou um Max Combo de 10.' },
    { id: 4, type: 'combo', target: 50, reward: 10, title: 'Combo 50', desc: 'Alcançou um Max Combo de 50.' },

    // ==========================================
    // COMBOS
    // ==========================================
    { id: 5, type: 'combo', target: 100, reward: 10, title: 'Combo 100', desc: 'Alcançou um Max Combo de 100.' },
    { id: 6, type: 'combo', target: 200, reward: 15, title: 'Combo 200', desc: 'Alcançou um Max Combo de 200.' },
    { id: 7, type: 'combo', target: 500, reward: 25, title: 'Combo 500', desc: 'Alcançou um Max Combo de 500.' },
    { id: 8, type: 'combo', target: 1000, reward: 50, title: 'Combo 1.000', desc: 'Alcançou um Max Combo de 1.000.' },
    { id: 9, type: 'combo', target: 1500, reward: 75, title: 'Combo 1.500', desc: 'Alcançou um Max Combo de 1.500.' },
    { id: 10, type: 'combo', target: 2000, reward: 100, title: 'Combo 2.000', desc: 'Alcançou um Max Combo de 2.000.' },
    { id: 11, type: 'combo', target: 3000, reward: 150, title: 'Combo 3.000', desc: 'Alcançou um Max Combo de 3.000.' },
    { id: 12, type: 'combo', target: 5000, reward: 250, title: 'Combo 5.000', desc: 'Alcançou um Max Combo de 5.000.' },
    { id: 13, type: 'combo', target: 10000, reward: 500, title: 'Combo 10.000', desc: 'Alcançou um Max Combo de 10.000.' },
    { id: 14, type: 'combo', target: 25000, reward: 1000, title: 'Combo 25.000', desc: 'Alcançou um Max Combo de 25.000.' },
    { id: 15, type: 'combo', target: 50000, reward: 2500, title: 'Combo 50.000', desc: 'Alcançou um Max Combo de 50.000.' },

    // ==========================================
    // AURA (Marcos de Acúmulo)
    // ==========================================
    { id: 16, type: 'aura', target: 100, reward: 5, title: 'Aura 100', desc: 'Acumulou 100 de Aura.' },
    { id: 17, type: 'aura', target: 500, reward: 10, title: 'Aura 500', desc: 'Acumulou 500 de Aura.' },
    { id: 18, type: 'aura', target: 1000, reward: 15, title: 'Aura 1.000', desc: 'Acumulou 1.000 de Aura.' },
    { id: 19, type: 'aura', target: 5000, reward: 25, title: 'Aura 5.000', desc: 'Acumulou 5.000 de Aura.' },
    { id: 20, type: 'aura', target: 10000, reward: 50, title: 'Aura 10.000', desc: 'Acumulou 10.000 de Aura.' },
    { id: 21, type: 'aura', target: 50000, reward: 75, title: 'Aura 50k', desc: 'Acumulou 50.000 de Aura.' },
    { id: 22, type: 'aura', target: 100000, reward: 100, title: 'Aura 100k', desc: 'Acumulou 100.000 de Aura.' },
    { id: 23, type: 'aura', target: 500000, reward: 150, title: 'Aura 500k', desc: 'Acumulou 500.000 de Aura.' },
    { id: 24, type: 'aura', target: 1000000, reward: 250, title: 'Aura 1 Milhão', desc: 'Acumulou 1 Milhão de Aura.' },
    { id: 25, type: 'aura', target: 10000000, reward: 500, title: 'Aura 10 Milhões', desc: 'Acumulou 10 Milhões de Aura.' },
    { id: 26, type: 'aura', target: 100000000, reward: 1000, title: 'Aura 100 Milhões', desc: 'Acumulou 100 Milhões de Aura.' },
    { id: 27, type: 'aura', target: 1000000000, reward: 5000, title: 'Aura 1 Bilhão', desc: 'Acumulou 1 Bilhão de Aura.' },

    // ==========================================
    // TÍTULOS (Baseados no Nível exigido -> Aura equivalente)
    // ==========================================
    { id: 28, type: 'aura', target: 5000, reward: 25, title: 'Novo Título: Beta', desc: 'Alcançou o Nível 11.' },
    { id: 29, type: 'aura', target: 14500, reward: 50, title: 'Novo Título: Sigma', desc: 'Alcançou o Nível 30.' },
    { id: 30, type: 'aura', target: 24500, reward: 75, title: 'Novo Título: Super Sigma', desc: 'Alcançou o Nível 50.' },
    { id: 31, type: 'aura', target: 49500, reward: 100, title: 'Novo Título: Rei Sigma', desc: 'Alcançou o Nível 100.' },
    { id: 32, type: 'aura', target: 99500, reward: 150, title: 'Novo Título: Omega', desc: 'Alcançou o Nível 200.' },
    { id: 33, type: 'aura', target: 249500, reward: 250, title: 'Novo Título: Rei Omega', desc: 'Alcançou o Nível 500.' },
    { id: 34, type: 'aura', target: 499500, reward: 400, title: 'Novo Título: Farmador', desc: 'Alcançou o Nível 1.000.' },
    { id: 35, type: 'aura', target: 1249500, reward: 600, title: 'Novo Título: Farmador Profissional', desc: 'Alcançou o Nível 2.500.' },
    { id: 36, type: 'aura', target: 2499500, reward: 1000, title: 'Novo Título: Rei Farmador', desc: 'Alcançou o Nível 5.000.' },
    { id: 37, type: 'aura', target: 4999500, reward: 1500, title: 'Novo Título: Master Farmador', desc: 'Alcançou o Nível 10.000.' },
    { id: 38, type: 'aura', target: 24999500, reward: 2500, title: 'Novo Título: Mega Aura', desc: 'Alcançou o Nível 50.000.' },
    { id: 39, type: 'aura', target: 99999500, reward: 5000, title: 'Novo Título: Rei da Aura', desc: 'Alcançou o Nível 200.000.' },
    { id: 40, type: 'aura', target: 1000000000, reward: 10000, title: 'Novo Título: Deus da Aura', desc: 'Alcançou o Nível 2.000.001.' },
];

export const useAchievementSystem = create((set, get) => ({
    achievements: [], // Lista combinada (master + user data)

    // Inicializa a lista de conquistas mesclando com o progresso salvo do banco
    initializeAchievements: (savedData = []) => {
        const mergedList = MASTER_ACHIEVEMENTS.map(master => {
            // Verifica se o usuário já tem essa conquista salva no banco (procurando pelo ID)
            const savedItem = savedData.find(d => d.id === master.id);
            const progress = savedItem ? (savedItem.progress || 0) : 0;
            const claimed  = savedItem ? (savedItem.claimed  || false) : false;
            // BUG #2 FIX: marca como completed retroativamente se o progresso já atingiu o alvo
            const completed = (savedItem ? savedItem.completed : false) || (progress >= master.target);
            return {
                ...master,
                progress: Math.min(progress, master.target),
                completed,
                claimed
            };
        });

        set({ achievements: mergedList });
        
        // Verifica se a conquista de login já foi concluída
        get().updateProgress('login', 1);
        
        // Busca prêmios semanais disponíveis
        get().fetchWeeklyPrizes();
    },

    fetchWeeklyPrizes: async () => {
        if (!db || !auth.currentUser) return;
        try {
            const q = query(
                collection(db, 'claimable_prizes'),
                where('uid', '==', auth.currentUser.uid),
                where('claimed', '==', false)
            );
            const snapshot = await getDocs(q);
            const prizes = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                prizes.push({
                    id: docSnap.id, 
                    type: 'weekly_prize',
                    target: 1,
                    progress: 1,
                    completed: true,
                    claimed: false,
                    reward: data.reward,
                    title: data.title,
                    desc: data.desc
                });
            });

            if (prizes.length > 0) {
                set(state => ({
                    achievements: [...prizes, ...state.achievements]
                }));
            }
        } catch (e) {
            console.error("Erro ao buscar prêmios da semana", e);
        }
    },

    // Atualiza o progresso baseado no tipo (ex: 'combo', 'aura', 'level')
            updateProgress: (type, newValue) => {
        set((state) => {
            let changed = false;
            const updated = state.achievements.map(ach => {
                if (ach.type === type && !ach.completed) {
                    if (newValue > ach.progress) {
                        const newProgress = Math.min(newValue, ach.target);
                        const isCompleted = newProgress >= ach.target;
                        changed = true;
                        return { ...ach, progress: newProgress, completed: isCompleted };
                    }
                }
                return ach;
            });

            return changed ? { achievements: updated } : state;
        });
    },

    // Coleta a recompensa de uma conquista específica
    claimReward: (id) => {
        let reward = 0;
        set((state) => {
            const updated = state.achievements.map(ach => {
                if (ach.id === id && ach.completed && !ach.claimed) {
                    reward = ach.reward;

                    if (typeof id === 'string') {
                        // Se for prêmio semanal, atualiza no Firestore para não coletar infinito
                        const prizeRef = doc(db, 'claimable_prizes', id);
                        updateDoc(prizeRef, { claimed: true }).catch(e => console.error(e));
                    }

                    return { ...ach, claimed: true };
                }
                return ach;
            });
            return { achievements: updated };
        });
        return reward;
    },
    
    // Retorna um array compactado apenas com os dados essenciais para salvar no banco
    // BUG #3 FIX: filtra weekly_prize pois eles ficam na coleção 'claimable_prizes' separada
    getSavableData: () => {
        return get().achievements
            .filter(ach => ach.type !== 'weekly_prize')
            .map(ach => ({
                id: ach.id,
                progress: ach.progress,
                completed: ach.completed,
                claimed: ach.claimed
            }));
    }
}));
