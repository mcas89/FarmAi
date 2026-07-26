// Retorna a semana no formato 'YYYY_Www' (ex: 2026_W30)
export const getCurrentWeekString = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Ajusta para quinta-feira para calcular a ISO week corretamente
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}_W${weekNum.toString().padStart(2, '0')}`;
};
