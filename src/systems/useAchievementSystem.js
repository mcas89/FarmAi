import { create } from 'zustand';

// Lista Mestre de Conquistas (id numérico, tipo, alvo, recompensa, título e descrição)
const MASTER_ACHIEVEMENTS = [
    // Lógicas de Acesso
    { id: 1, type: 'login', target: 1, reward: 50, title: 'Bem-vindo à Farmação', desc: 'Entrar no jogo pela primeira vez.' },
    
    // Lógicas de Combo
    { id: 2, type: 'combo', target: 50, reward: 50, title: 'Aprendiz de Combo', desc: 'Alcançou um Max Combo de 50.' },
    { id: 3, type: 'combo', target: 100, reward: 100, title: 'Combo Amador', desc: 'Alcançou um Max Combo de 100.' },
    { id: 4, type: 'combo', target: 500, reward: 200, title: 'Combo Intermediário', desc: 'Alcançou um Max Combo de 500.' },
    { id: 5, type: 'combo', target: 1000, reward: 300, title: 'Mestre dos Combos', desc: 'Alcançou um Max Combo de 1000.' },
    { id: 6, type: 'combo', target: 1500, reward: 500, title: 'Lenda dos Combos', desc: 'Alcançou um Max Combo de 1500.' },
    { id: 7, type: 'combo', target: 2000, reward: 1000, title: 'Deus dos Combos', desc: 'Alcançou um Max Combo de 2000.' },
    
    // Lógicas de Nível (500 Aura = 1 Level)
    { id: 8, type: 'level', target: 10, reward: 100, title: 'Início da Jornada', desc: 'Alcançou o Level 10.' },
    { id: 9, type: 'level', target: 50, reward: 500, title: 'Caminho sem Volta', desc: 'Alcançou o Level 50.' },
    { id: 10, type: 'level', target: 100, reward: 1000, title: 'Aura Centenária', desc: 'Alcançou o Level 100.' },

    // Lógicas de Aura (Títulos e Marcos Globais)
    { id: 11, type: 'aura', target: 5500, reward: 500, title: 'Evolução Inicial', desc: 'Alcançou o título de Beta.' },
    { id: 12, type: 'aura', target: 10000, reward: 500, title: 'A Mentalidade', desc: 'Alcançou o título de Sigma.' },
    { id: 13, type: 'aura', target: 15000, reward: 500, title: 'O Próximo Passo', desc: 'Alcançou o título de Super Sigma.' },
    { id: 14, type: 'aura', target: 50000, reward: 500, title: 'Ascensão', desc: 'Alcançou o título de Omega.' },
    { id: 15, type: 'aura', target: 100000, reward: 500, title: 'Reinado', desc: 'Alcançou o título de Rei Omega.' },
    { id: 16, type: 'aura', target: 250000, reward: 500, title: 'Profissão', desc: 'Alcançou o título de Farmador.' },
    { id: 17, type: 'aura', target: 500000, reward: 500, title: 'Elite', desc: 'Alcançou o título de Farmador Profissional.' },
    { id: 18, type: 'aura', target: 1000000, reward: 500, title: 'A Coroa', desc: 'Alcançou o título de Farmador Rei.' },
    { id: 19, type: 'aura', target: 5000000, reward: 500, title: 'Mestrado', desc: 'Alcançou o título de Master Farmador.' },
    { id: 20, type: 'aura', target: 10000000, reward: 500, title: 'O Poder Oculto', desc: 'Alcançou o título de Mega Aura.' },
    { id: 21, type: 'aura', target: 100000000, reward: 500, title: 'Soberano', desc: 'Alcançou o título de Rei da Aura.' },
    { id: 22, type: 'aura', target: 1000000000, reward: 500, title: 'Divindade', desc: 'Alcançou o título de Deus da Aura.' },
    { id: 23, type: 'aura', target: 2000000000, reward: 2000, title: 'Bilionário', desc: 'Acumulou 2 Bilhões de Aura.' },
    { id: 24, type: 'aura', target: 10000000000, reward: 5000, title: 'O Universo na Mão', desc: 'Acumulou 10 Bilhões de Aura.' },
];

export const useAchievementSystem = create((set, get) => ({
    achievements: [], // Lista combinada (master + user data)

    // Inicializa a lista de conquistas mesclando com o progresso salvo do banco
    initializeAchievements: (savedData = []) => {
        const mergedList = MASTER_ACHIEVEMENTS.map(master => {
            // Verifica se o usuário já tem essa conquista salva no banco (procurando pelo ID)
            const savedItem = savedData.find(d => d.id === master.id);
            return {
                ...master,
                progress: savedItem ? savedItem.progress : 0,
                completed: savedItem ? savedItem.completed : false,
                claimed: savedItem ? savedItem.claimed : false
            };
        });

        set({ achievements: mergedList });
        
        // Verifica se a conquista de login já foi concluída
        get().updateProgress('login', 1);
    },

    // Atualiza o progresso baseado no tipo (ex: 'combo', 'aura', 'level')
    updateProgress: (type, newValue) => {
        set((state) => {
            const updated = state.achievements.map(ach => {
                if (ach.type === type && !ach.completed) {
                    // Atualiza apenas se o novo valor for maior que o progresso atual
                    if (newValue > ach.progress) {
                        const newProgress = Math.min(newValue, ach.target);
                        const isCompleted = newProgress >= ach.target;
                        return { ...ach, progress: newProgress, completed: isCompleted };
                    }
                }
                return ach;
            });

            return { achievements: updated };
        });
    },

    // Coleta a recompensa de uma conquista específica
    claimReward: (id) => {
        let reward = 0;
        set((state) => {
            const updated = state.achievements.map(ach => {
                if (ach.id === id && ach.completed && !ach.claimed) {
                    reward = ach.reward;
                    return { ...ach, claimed: true };
                }
                return ach;
            });
            return { achievements: updated };
        });
        return reward;
    },
    
    // Retorna um array compactado apenas com os dados essenciais para salvar no banco
    getSavableData: () => {
        return get().achievements.map(ach => ({
            id: ach.id,
            progress: ach.progress,
            completed: ach.completed,
            claimed: ach.claimed
        }));
    }
}));
