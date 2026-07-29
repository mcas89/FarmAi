import { useEffect } from 'react';
import { useUISystem } from './useUISystem';
import { verifyInfinitePayment, AURACASH_PACKS } from '../services/infinitePayService';

// Intervalo entre cada tentativa de verificação (ms)
const POLL_INTERVAL_MS = 10_000; // 10 segundos
// Tempo máximo aguardando confirmação (ms)
const POLL_TIMEOUT_MS  = 300_000; // 5 minutos

/**
 * Aguarda a inicialização do Firebase Auth antes de continuar.
 * Como o hook roda imediatamente no carregamento da página, auth.currentUser
 * costuma ser null nos primeiros milissegundos.
 */
const waitForAuth = () => new Promise((resolve) => {
    import('../config/firebase').then(({ auth }) => {
        if (auth.currentUser) return resolve(auth.currentUser);
        import('firebase/auth').then(({ onAuthStateChanged }) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    });
});

/**
 * Credita AuraCash atomicamente no Firebase via increment().
 * Isso evita a race condition onde o app carrega os dados do Firebase
 * DEPOIS do crédito, sobrescrevendo o saldo novo com o valor antigo.
 *
 * Após salvar no Firebase, faz getDoc para ler o valor real atualizado
 * e sincroniza com o estado local (Zustand).
 */
async function creditAuraCash(pack, updateStats) {
    try {
        const user = await waitForAuth();
        if (!user) {
            console.error('[InfinitePay] ❌ Usuário não autenticado, não foi possível creditar.');
            return false;
        }

        const dbSys = await import('./useDatabaseSystem');

        // 1. Incremento atômico no Firebase — não depende do estado local
        const success = await dbSys.useDatabaseSystem.getState().incrementAuracash(pack.auracash);

        if (!success) {
            console.error('[InfinitePay] ❌ Falha no incremento atômico. Salvando como pendente.');
            return false;
        }

        // 2. Lê o valor real do Firebase para sincronizar o estado local
        const { db, auth } = await import('../config/firebase');
        const { doc, getDoc } = await import('firebase/firestore');

        if (auth.currentUser && db) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                const realDiamonds = snap.data().auracash || 0;
                // Sincroniza o estado Zustand com o valor correto do banco
                updateStats({ diamonds: realDiamonds });
                console.log(`[InfinitePay] ✅ Saldo local sincronizado: ${realDiamonds.toLocaleString()} AuraCash.`);
            }
        }

        return true;
    } catch (err) {
        console.error('[InfinitePay] ❌ Erro ao creditar AuraCash:', err);
        return false;
    }
}

/**
 * Polling silencioso: tenta confirmar o pagamento a cada POLL_INTERVAL_MS
 * por no máximo POLL_TIMEOUT_MS. Nenhuma mensagem é exibida ao usuário.
 */
async function pollPaymentConfirmation(orderNsu, packId, updateStats) {
    const pack = AURACASH_PACKS[packId];
    if (!pack) {
        console.error('[InfinitePay] Pacote desconhecido:', packId);
        return;
    }

    const processedKey = `payment_processed_${orderNsu}`;
    if (localStorage.getItem(processedKey)) {
        console.log('[InfinitePay] Pagamento já processado anteriormente:', orderNsu);
        return;
    }

    const startTime = Date.now();
    let attempt = 0;

    console.log(`[InfinitePay] 🔄 Iniciando polling do NSU: ${orderNsu}`);

    while (Date.now() - startTime < POLL_TIMEOUT_MS) {
        attempt++;
        console.log(`[InfinitePay] Tentativa ${attempt} — verificando NSU: ${orderNsu}`);

        const isPaid = await verifyInfinitePayment(orderNsu);

        if (isPaid) {
            // Marca como processado ANTES de creditar (evita duplo crédito)
            localStorage.setItem(processedKey, '1');

            const credited = await creditAuraCash(pack, updateStats);
            if (credited) {
                console.log(`[InfinitePay] ✅ Pagamento confirmado e AuraCash creditados. NSU: ${orderNsu}`);
            } else {
                // Se o crédito falhou, remove o flag para tentar novamente
                localStorage.removeItem(processedKey);
                // Salva como pendente
                const pending = JSON.parse(localStorage.getItem('pending_payments') || '[]');
                if (!pending.find(p => p.orderNsu === orderNsu)) {
                    pending.push({ orderNsu, packId, ts: Date.now() });
                    localStorage.setItem('pending_payments', JSON.stringify(pending));
                }
            }
            return; // Encerra o loop independente do resultado do crédito
        }

        console.log(`[InfinitePay] ⏳ Ainda não confirmado. Próxima tentativa em ${POLL_INTERVAL_MS / 1000}s...`);
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }

    // Timeout — salva como pendente e não mostra nada ao usuário
    console.warn(`[InfinitePay] ⚠️ Timeout após ${POLL_TIMEOUT_MS / 60000} min. NSU: ${orderNsu} salvo como pendente.`);
    const pending = JSON.parse(localStorage.getItem('pending_payments') || '[]');
    if (!pending.find(p => p.orderNsu === orderNsu)) {
        pending.push({ orderNsu, packId, ts: Date.now() });
        localStorage.setItem('pending_payments', JSON.stringify(pending));
    }
}

/**
 * Reprocessa pagamentos pendentes de sessões anteriores.
 * Silencioso — apenas credita automaticamente se confirmado.
 */
async function reprocessPendingPayments(updateStats) {
    const pending = JSON.parse(localStorage.getItem('pending_payments') || '[]');
    if (pending.length === 0) return;

    console.log(`[InfinitePay] 🔁 Reprocessando ${pending.length} pagamento(s) pendente(s)...`);

    const remaining = [];
    for (const item of pending) {
        const processedKey = `payment_processed_${item.orderNsu}`;
        if (localStorage.getItem(processedKey)) continue;

        const isPaid = await verifyInfinitePayment(item.orderNsu);
        if (isPaid) {
            const pack = AURACASH_PACKS[item.packId];
            if (pack) {
                localStorage.setItem(processedKey, '1');
                const credited = await creditAuraCash(pack, updateStats);
                if (!credited) {
                    localStorage.removeItem(processedKey);
                    remaining.push(item); // Tenta de novo na próxima sessão
                }
            }
        } else {
            // Mantém como pendente por até 24h
            if (Date.now() - item.ts < 86_400_000) {
                remaining.push(item);
            } else {
                console.warn('[InfinitePay] ⚠️ Pagamento pendente expirado (24h):', item.orderNsu);
            }
        }
    }

    localStorage.setItem('pending_payments', JSON.stringify(remaining));
}

/**
 * Hook principal — chame uma vez no App.
 * - Reprocessa pagamentos pendentes em background.
 * - Detecta retorno de checkout via URL e inicia polling silencioso.
 */
export function usePaymentReturn() {
    const updateStats = useUISystem(state => state.updateStats);

    useEffect(() => {
        console.log("[InfinitePay] 🛠️ Inicializando usePaymentReturn. URL atual:", window.location.search);

        // Reprocessa pendentes de sessões anteriores
        reprocessPendingPayments(updateStats);

        // Detecta retorno do checkout InfinitePay
        const urlParams = new URLSearchParams(window.location.search);
        const isSuccess = urlParams.get('payment_success');
        
        if (isSuccess !== 'true') {
            console.log("[InfinitePay] 🛠️ Nenhum pagamento novo detectado na URL.");
            return;
        }

        const orderNsu = urlParams.get('order_nsu');
        const packId   = urlParams.get('pack_id');

        console.log(`[InfinitePay] 🛠️ Retorno detectado! NSU: ${orderNsu}, Pack: ${packId}`);

        if (!orderNsu || !packId) return;

        // Limpa a URL imediatamente (sem parâmetros visíveis ao usuário)
        window.history.replaceState({}, document.title, window.location.pathname);

        // Inicia polling em background — não bloqueia nem alerta o usuário
        pollPaymentConfirmation(orderNsu, packId, updateStats);

    }, []);
}
