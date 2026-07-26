import { create } from 'zustand';

// Template de possíveis missões diárias
const QUEST_TEMPLATES = [
    { type: 'gain_aura', title: 'Farmar 1000 de Aura', target: 1000, reward: 50 },
    { type: 'gain_aura', title: 'Farmar 5000 de Aura', target: 5000, reward: 250 },
    { type: 'gain_aura', title: 'Farmar 10000 de Aura', target: 10000, reward: 600 },
    { type: 'reach_combo', title: 'Alcançar Combo de 100', target: 100, reward: 100 },
    { type: 'reach_combo', title: 'Alcançar Combo de 300', target: 300, reward: 300 },
    { type: 'reach_combo', title: 'Alcançar Combo de 500', target: 500, reward: 600 },
    { type: 'play_time', title: 'Jogar por 5 Minutos', target: 5, reward: 50 },
];

// Função auxiliar para gerar 2 missões aleatórias diferentes
const generateRandomQuests = () => {
    const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    
    return selected.map((q, index) => ({
        id: `quest_${Date.now()}_${index}`,
        type: q.type,
        title: q.title,
        target: q.target,
        progress: 0,
        reward: q.reward,
        claimed: false
    }));
};

// Formata uma data para 'YYYY-MM-DD' para fácil comparação
const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

export const useQuestSystem = create((set, get) => ({
    dailyQuests: [],
    lastResetDate: '',

    // Chamado no momento que o usuário loga e os dados do firebase chegam
    initializeQuests: (firebaseQuests, firebaseResetDate) => {
        const todayStr = getTodayDateString();
        
        // Se a data de reset for diferente de hoje, gera novas missões
        if (firebaseResetDate !== todayStr) {
            set({
                dailyQuests: generateRandomQuests(),
                lastResetDate: todayStr
            });
        } else {
            // Se ainda é hoje, apenas carrega as missões do banco
            set({
                dailyQuests: firebaseQuests || generateRandomQuests(),
                lastResetDate: firebaseResetDate || todayStr
            });
        }
    },

    // Chamado pelo jogo sempre que algo acontecer (ganhar aura, aumentar combo)
    // Para 'gain_aura', value é somado. Para 'reach_combo', value substitui se for maior.
    updateQuestProgress: (type, value) => {
        set((state) => {
            let updated = false;
            const newQuests = state.dailyQuests.map(quest => {
                if (quest.type === type && !quest.claimed && quest.progress < quest.target) {
                    let newProgress = quest.progress;
                    
                    if (type === 'gain_aura' || type === 'play_time') {
                        newProgress = Math.min(quest.progress + value, quest.target);
                    } else if (type === 'reach_combo') {
                        newProgress = Math.min(Math.max(quest.progress, value), quest.target);
                    }
                    
                    if (newProgress !== quest.progress) {
                        updated = true;
                        return { ...quest, progress: newProgress };
                    }
                }
                return quest;
            });
            
            return updated ? { dailyQuests: newQuests } : state;
        });
    },

    // Chamado na UI quando o jogador clica em Coletar
    claimQuest: (questId) => {
        let rewardAmount = 0;
        set((state) => ({
            dailyQuests: state.dailyQuests.map(quest => {
                if (quest.id === questId && quest.progress >= quest.target && !quest.claimed) {
                    rewardAmount = quest.reward;
                    return { ...quest, claimed: true };
                }
                return quest;
            })
        }));
        return rewardAmount; // Retorna a recompensa para a UI poder somar nos diamantes
    }
}));
