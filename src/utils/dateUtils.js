// Retorna a semana no formato 'YYYY_MM_DD' referente ao Domingo que iniciou a semana
// Garante que o ranking feche no sábado à meia noite (23:59) e uma nova semana comece domingo.
export const getCurrentWeekString = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Se hoje é terça (2), volta 2 dias para chegar no domingo (0).
    d.setDate(d.getDate() - d.getDay());
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}_W${month}_${day}`;
};
