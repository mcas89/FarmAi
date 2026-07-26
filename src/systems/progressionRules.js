// Tabela de Títulos
// Estrutura: nome, minLevel (nível mínimo requerido)
export const TITLES_DATA = [
    { name: 'Betinha', minLevel: 1 },
    { name: 'Beta', minLevel: 11 },
    { name: 'Sigma', minLevel: 30 },
    { name: 'Super Sigma', minLevel: 50 },
    { name: 'Rei Sigma', minLevel: 100 },
    { name: 'Omega', minLevel: 200 },
    { name: 'Rei Omega', minLevel: 500 },
    { name: 'Farmador', minLevel: 1000 },
    { name: 'Farmador Profissional', minLevel: 2500 },
    { name: 'Rei Farmador', minLevel: 5000 },
    { name: 'Master Farmador', minLevel: 10000 },
    { name: 'Mega Aura', minLevel: 50000 },
    { name: 'Rei da Aura', minLevel: 200000 },
    { name: 'Deus da Aura', minLevel: 2000001 }
];

// Asseguramos que os títulos estão ordenados do maior nível para o menor
// para facilitar a busca do título atual do jogador.
const SORTED_TITLES = [...TITLES_DATA].sort((a, b) => b.minLevel - a.minLevel);

/**
 * Retorna o nível do jogador baseado na quantidade de Aura.
 * 0 Aura = LV 1, 500 Aura = LV 2...
 */
export const getPlayerLevel = (aura) => {
    return 1 + Math.floor(aura / 500);
};

/**
 * Retorna o título atual do jogador baseado no nível atual.
 */
export const getPlayerTitle = (level) => {
    // Procura o primeiro título em ordem decrescente em que o nível do jogador seja maior ou igual ao minLevel
    const currentTitle = SORTED_TITLES.find(t => level >= t.minLevel);
    return currentTitle ? currentTitle.name : 'Betinha';
};

/**
 * Retorna o próximo título do jogador e o nível necessário para alcançá-lo.
 * Se já estiver no último título, retorna null.
 */
export const getNextTitle = (level) => {
    // Procura em ordem crescente (do menor pro maior) o primeiro título que tenha minLevel maior que o nível atual
    const nextTitle = [...TITLES_DATA]
        .sort((a, b) => a.minLevel - b.minLevel)
        .find(t => t.minLevel > level);
    
    return nextTitle || null;
};

/**
 * Retorna a quantidade EXATA de Aura que falta para subir 1 nível.
 */
export const getAuraToNextLevel = (aura) => {
    return 500 - (Math.floor(aura) % 500);
};

/**
 * Retorna a quantidade de Aura que falta para alcançar o PRÓXIMO título.
 * Retorna 0 se o jogador já estiver no título máximo.
 */
export const getAuraToNextTitle = (level, aura) => {
    const nextTitle = getNextTitle(level);
    if (!nextTitle) return 0; // Já é Deus da Aura

    // Converte o minLevel do próximo título de volta para Aura exigida.
    // Lógica Inversa: Level = 1 + (Aura / 500) -> Aura = (Level - 1) * 500
    const auraRequired = (nextTitle.minLevel - 1) * 500;
    
    // Calcula a diferença
    return Math.max(0, auraRequired - Math.floor(aura));
};
