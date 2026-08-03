import { create } from 'zustand';

// Template de possíveis missões diárias
const QUEST_TEMPLATES = [
    // ✨ Foco em Aura (gain_aura)
    { type: 'gain_aura', title: 'Primeira Farmada', target: 500, reward: 5 },
    { type: 'gain_aura', title: 'Farmando Aura', target: 1000, reward: 10 },
    { type: 'gain_aura', title: 'Aura em Alta', target: 2500, reward: 15 },
    { type: 'gain_aura', title: 'Aura Explosiva', target: 5000, reward: 20 },
    { type: 'gain_aura', title: 'Dia de Farm', target: 10000, reward: 30 },
    { type: 'gain_aura', title: 'Aura Insana', target: 25000, reward: 40 },
    { type: 'gain_aura', title: 'Aura Dominante', target: 50000, reward: 60 },
    { type: 'gain_aura', title: 'Rei da Farmada', target: 100000, reward: 100 },
    
    // 🔥 Foco em Combo (reach_combo)
    { type: 'reach_combo', title: 'Começando o Combo', target: 25, reward: 5 },
    { type: 'reach_combo', title: 'Combo Ativo', target: 50, reward: 5 },
    { type: 'reach_combo', title: 'Combo Quente', target: 100, reward: 10 },
    { type: 'reach_combo', title: 'Não Quebre!', target: 150, reward: 20 }, // Simula o manter combo > 100
    { type: 'reach_combo', title: 'Combo Insano', target: 250, reward: 15 },
    { type: 'reach_combo', title: 'Combo Monstro', target: 500, reward: 25 },
    { type: 'reach_combo', title: 'Combo Perfeito', target: 500, reward: 40 }, // Duplicado intencionalmente para simular 'sem perder' (que é mecânica padrão do combo)
    { type: 'reach_combo', title: 'Combo Lendário', target: 1000, reward: 50 },

    // 👆 Foco em toques (make_touches)
    { type: 'make_touches', title: 'Aquecimento', target: 100, reward: 5 },
    { type: 'make_touches', title: 'Mão na Massa', target: 250, reward: 5 },
    { type: 'make_touches', title: 'Farmador', target: 500, reward: 10 },
    { type: 'make_touches', title: 'Dedo de Aço', target: 1000, reward: 20 },
    { type: 'make_touches', title: 'Máquina de Farmar', target: 2500, reward: 30 },
    { type: 'make_touches', title: 'Incansável', target: 5000, reward: 50 },
    { type: 'make_touches', title: 'Sem Parar', target: 10000, reward: 75 },

    // 🕐 Foco em tempo de jogo (play_time) (minutos)
    { type: 'play_time', title: 'Só Começando', target: 2, reward: 5 },
    { type: 'play_time', title: 'Aquecendo', target: 5, reward: 10 },
    { type: 'play_time', title: 'Farmador Dedicado', target: 10, reward: 15 },
    { type: 'play_time', title: 'Hora da Farmada', target: 20, reward: 25 },
    { type: 'play_time', title: 'Não Para', target: 30, reward: 40 },

    // 🧪 Foco em poções (use_potion)
    { type: 'use_potion', title: 'Potencializado', target: 1, reward: 10 },
    { type: 'use_potion', title: 'Aura Turbinada', target: 2, reward: 15 }, // Simula 'Use uma poção e ganhe aura' para manter a simplicidade do tracker
    { type: 'use_potion', title: 'Farm Potencializado', target: 3, reward: 20 },
    { type: 'use_potion', title: 'Poder da Poção', target: 4, reward: 30 },
    { type: 'use_potion', title: 'Alquimista da Aura', target: 5, reward: 40 },
];

// Função auxiliar para gerar missões aleatórias
const generateRandomQuests = () => {
    const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    
    // Missão fixa que sempre aparece completada ao entrar no jogo
    const loginQuest = {
        id: `quest_${Date.now()}_login`,
        type: 'login',
        title: 'Bônus de Login Diário',
        target: 1,
        progress: 1, // Já nasce concluída
        reward: 30,
        claimed: false
    };

    const randomQuests = selected.map((q, index) => ({
        id: `quest_${Date.now()}_${index}`,
        type: q.type,
        title: q.title,
        target: q.target,
        progress: 0,
        reward: q.reward,
        claimed: false
    }));

    return [loginQuest, ...randomQuests];
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
        const safeQuests = Array.isArray(firebaseQuests) ? firebaseQuests : null;
        
        // Se a data de reset for diferente de hoje, gera novas missões
        if (firebaseResetDate !== todayStr) {
            set({
                dailyQuests: generateRandomQuests(),
                lastResetDate: todayStr
            });
        } else {
            // Se ainda é hoje, apenas carrega as missões do banco
            set({
                dailyQuests: safeQuests || generateRandomQuests(),
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
                    
                    if (type === 'gain_aura' || type === 'play_time' || type === 'make_touches' || type === 'use_potion') {
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
