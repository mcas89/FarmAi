// ============================================================
// InfinitePay Checkout — FarmaAI
// ============================================================
// Gera o link de pagamento e valida o retorno após o checkout.
// O "handle" é a InfiniteTag sem o "$".
// Preços são SEMPRE em centavos (R$4,90 = 490).
// ============================================================

const INFINITE_TAG = "mcas-89"; // ← Sua InfiniteTag sem o "$"

// Resolve a URL base correta conforme o ambiente
function getApiBase() {
    if (window.location.hostname === "localhost") {
        // Em localhost, o proxy da Vercel não funciona. Irá falhar por CORS no browser.
        // Use somente para teste visual. Para teste real, faça deploy na Vercel.
        return "https://api.checkout.infinitepay.io";
    }
    return "/api/infinitepay";
}

/**
 * Gera o link de pagamento InfinitePay e redireciona o usuário.
 * @param {string} packId   - ID único do pacote (ex: 'pack_1000')
 * @param {number} priceCents - Preço em centavos (ex: 490 para R$4,90)
 * @param {string} description - Descrição do item
 * @param {string} userId   - UID do Firebase para crédito após pagamento
 */
export async function initInfinitePayCheckout(packId, priceCents, description, userId) {
    try {
        // Gera um identificador único CURTO para o pedido (NSU)
        // Muitos gateways limitam o tamanho do NSU (ex: 32 chars).
        // Usar "FA-" + timestamp garante unicidade e é bem curto (16 caracteres).
        const orderNsu = `FA-${Date.now()}`;

        // URL de retorno pós-pagamento com todos os parâmetros necessários
        const redirectUrl = `${window.location.origin}${window.location.pathname}`
            + `?payment_success=true&order_nsu=${orderNsu}&pack_id=${packId}&user_id=${userId}`;

        const payload = {
            handle: INFINITE_TAG,
            order_nsu: orderNsu,
            redirect_url: redirectUrl,
            items: [
                {
                    quantity: 1,
                    price: priceCents,
                    description: description,
                }
            ]
        };

        const res = await fetch(`${getApiBase()}/links`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("InfinitePay error:", res.status, errText);
            throw new Error(`Erro ${res.status} ao criar link de pagamento.`);
        }

        const data = await res.json();

        // A InfinitePay pode retornar o link em diferentes campos
        let paymentUrl = data.url || data.payment_url || (data.metadata && data.metadata.url) || data.link;

        if (paymentUrl) {
            // SALVA A TRANSAÇÃO COMO PENDENTE ANTES DE SAIR!
            // Isso garante que se o usuário clicar em "Voltar" no navegador
            // em vez do botão da InfinitePay (perdendo os parâmetros da URL),
            // o jogo ainda validará a compra no reprocessPendingPayments!
            try {
                const pending = JSON.parse(localStorage.getItem('pending_payments') || '[]');
                if (!pending.find(p => p.orderNsu === orderNsu)) {
                    pending.push({ orderNsu, packId, ts: Date.now() });
                    localStorage.setItem('pending_payments', JSON.stringify(pending));
                }
            } catch (e) {
                console.error("[InfinitePay] Erro ao salvar pendente local:", e);
            }

            window.location.href = paymentUrl;
        } else {
            console.error("InfinitePay resposta sem URL:", data);
            throw new Error("Link de pagamento não gerado. Tente novamente.");
        }
    } catch (err) {
        console.error("Erro ao gerar checkout InfinitePay:", err);
        throw err; // Deixa o componente tratar e mostrar alerta para o usuário
    }
}

/**
 * Verifica se o pagamento com o order_nsu fornecido foi aprovado.
 * Chame após o usuário ser redirecionado de volta com ?payment_success=true
 * @param {string} orderNsu - O nsu de pedido que foi gerado em initInfinitePayCheckout
 * @returns {Promise<boolean>}
 */
export async function verifyInfinitePayment(orderNsu) {
    try {
        const payload = {
            handle: INFINITE_TAG,
            order_nsu: orderNsu
        };

        const endpoint = `${getApiBase()}/payment_check`;
        console.log(`[InfinitePay] 📡 Chamando API de validação: POST ${endpoint}`);

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error(`[InfinitePay] ❌ Falha na API de validação. Status: ${res.status} ${res.statusText}`);
            try {
                const errorData = await res.json();
                console.error("[InfinitePay] Detalhes do erro da API:", errorData);
            } catch (e) {
                console.error("[InfinitePay] A resposta de erro não é um JSON válido.");
            }
            return false;
        }

        const data = await res.json();
        console.log("[InfinitePay] 📥 Resposta de validação da InfinitePay:", data);

        // Cobre as variações de resposta conhecidas da API da InfinitePay
        return (
            (data.success && data.paid) ||
            data.paid === true ||
            data.status === "approved" ||
            data.status === "paid"
        );
    } catch (err) {
        console.error("[InfinitePay] ❌ Erro de rede/CORS ao verificar pagamento InfinitePay:", err);
        return false;
    }
}

// ============================================================
// Tabela de Pacotes de AuraCash
// ============================================================
// Mapeia packId → { auracash, priceCents, label }
// Usada tanto na loja (UI) quanto na validação pós-pagamento.
// ============================================================
export const AURACASH_PACKS = {
    pack_1000: {
        auracash: 1000,
        priceCents: 490,         // R$ 4,90
        label: "1.000 AuraCash",
        description: "Pacote Inicial - 1.000 AuraCash no FarmaAI"
    },
    pack_2500: {
        auracash: 2500,
        priceCents: 990,         // R$ 9,90
        label: "2.500 AuraCash",
        description: "Pacote Pequeno - 2.500 AuraCash no FarmaAI"
    },
    pack_7000: {
        auracash: 7000,
        priceCents: 1990,        // R$ 19,90
        label: "7.000 AuraCash",
        description: "Pacote Médio - 7.000 AuraCash no FarmaAI"
    },
    pack_18000: {
        auracash: 18000,
        priceCents: 3990,        // R$ 39,90
        label: "18.000 AuraCash",
        description: "Pacote Grande - 18.000 AuraCash no FarmaAI"
    },
    pack_50000: {
        auracash: 50000,
        priceCents: 8990,        // R$ 89,90
        label: "50.000 AuraCash",
        description: "Pacote Supremo - 50.000 AuraCash no FarmaAI"
    }
};
