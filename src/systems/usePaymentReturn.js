import { useEffect } from 'react';
import { useUISystem } from './useUISystem';
import { verifyInfinitePayment, AURACASH_PACKS } from '../services/infinitePayService';

/**
 * Hook que roda no carregamento do App e verifica se o usuário voltou
 * de um pagamento da InfinitePay. Se o pagamento for válido, credita
 * os AuraCash no saldo e salva no Firebase.
 */
export function usePaymentReturn() {
    const updateStats = useUISystem(state => state.updateStats);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get('payment_success') !== 'true') return;

        const orderNsu = urlParams.get('order_nsu');
        const packId   = urlParams.get('pack_id');
        const userId   = urlParams.get('user_id');

        if (!orderNsu || !packId) return;

        // Limpa os parâmetros da URL imediatamente para não processar duas vezes
        window.history.replaceState({}, document.title, window.location.pathname);

        // Verifica se já foi processado (evita creditar duas vezes se o usuário recarregar)
        const processedKey = `payment_processed_${orderNsu}`;
        if (localStorage.getItem(processedKey)) return;

        const pack = AURACASH_PACKS[packId];
        if (!pack) {
            console.error("Pacote desconhecido:", packId);
            return;
        }

        // Aguarda 2s para garantir que a transação foi processada do lado deles
        const process = async () => {
            await new Promise(r => setTimeout(r, 2000));

            const isPaid = await verifyInfinitePayment(orderNsu);

            if (isPaid) {
                // Marca como processado ANTES de creditar (evita duplo crédito)
                localStorage.setItem(processedKey, '1');

                // Credita os AuraCash no estado local
                const currentDiamonds = useUISystem.getState().playerStats?.diamonds || 0;
                const newDiamonds = currentDiamonds + pack.auracash;
                updateStats({ diamonds: newDiamonds });

                // Salva no Firebase
                Promise.all([
                    import('./usePlayerSystem'),
                    import('./useAuraSystem'),
                    import('./useDatabaseSystem'),
                    import('./useQuestSystem'),
                    import('./useAchievementSystem')
                ]).then(([pSys, aSys, dbSys, qSys, achSys]) => {
                    const pos      = pSys.usePlayerSystem.getState().position;
                    const model    = pSys.usePlayerSystem.getState().activeModel;
                    const { comboCount, maxCombo, aura, weeklyAura } = aSys.useAuraSystem.getState();
                    const { dailyQuests, lastResetDate } = qSys.useQuestSystem.getState();
                    const achievements = achSys.useAchievementSystem.getState().getSavableData();
                    const inventory = useUISystem.getState().inventory || [];

                    dbSys.useDatabaseSystem.getState().saveGameState(
                        pos, comboCount, model, aura,
                        newDiamonds, maxCombo,
                        dailyQuests, lastResetDate,
                        weeklyAura, undefined, achievements, undefined, inventory
                    );
                });

                // Alerta de sucesso visível para o usuário
                alert(`✅ Pagamento confirmado!\n\n+${pack.auracash.toLocaleString()} AuraCash adicionados ao seu saldo!`);
            } else {
                console.warn("Pagamento não confirmado para NSU:", orderNsu);
                alert("⚠️ Não conseguimos confirmar seu pagamento ainda.\nSe você pagou, aguarde alguns minutos e recarregue o jogo.\nContate o suporte se o problema persistir.");
            }
        };

        process();
    }, []); // Roda apenas uma vez na montagem
}
