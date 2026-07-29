import React, { useState } from 'react';
import { useUISystem } from '../../systems/useUISystem';
import { useAuraSystem } from '../../systems/useAuraSystem';
import { AuracashIcon } from './AuracashIcon';
import { X, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';

// ── Modal de feedback interno (sem alert nativo) ──────────────────────────────
function FeedbackModal({ modal, onClose }) {
    if (!modal) return null;
    const isSuccess = modal.type === 'success';
    const isConfirm = modal.type === 'confirm';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            animation: 'shopFadeIn 0.2s ease'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a0e30, #0d0715)',
                border: `1px solid ${isSuccess ? 'rgba(52,211,153,0.5)' : isConfirm ? 'rgba(168,85,247,0.5)' : 'rgba(239,68,68,0.5)'}`,
                borderRadius: '20px', padding: '28px 32px',
                maxWidth: '340px', width: '90%',
                boxShadow: `0 0 40px ${isSuccess ? 'rgba(52,211,153,0.25)' : isConfirm ? 'rgba(168,85,247,0.25)' : 'rgba(239,68,68,0.25)'}`,
                animation: 'shopSlideUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    {isSuccess
                        ? <CheckCircle size={22} color="#34d399" />
                        : <AlertCircle size={22} color={isConfirm ? '#a855f7' : '#ef4444'} />
                    }
                    <span style={{ color: '#fff', fontWeight: '900', fontSize: '1rem', letterSpacing: '0.5px' }}>
                        {modal.title}
                    </span>
                </div>
                <p style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 22px', whiteSpace: 'pre-line' }}>
                    {modal.message}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    {isConfirm && (
                        <button onClick={onClose} style={{
                            padding: '9px 20px', borderRadius: '10px', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.05)', color: '#aaa',
                            border: '1px solid rgba(255,255,255,0.12)', fontWeight: 'bold', fontSize: '0.8rem'
                        }}>
                            CANCELAR
                        </button>
                    )}
                    <button onClick={() => { modal.onConfirm?.(); onClose(); }} style={{
                        padding: '9px 22px', borderRadius: '10px', cursor: 'pointer',
                        background: isSuccess
                            ? 'linear-gradient(90deg, #34d399, #10b981)'
                            : isConfirm
                            ? 'linear-gradient(90deg, #a855f7, #6b21a8)'
                            : 'linear-gradient(90deg, #ef4444, #b91c1c)',
                        color: '#fff', border: 'none', fontWeight: '900', fontSize: '0.85rem',
                        boxShadow: `0 4px 14px ${isSuccess ? 'rgba(52,211,153,0.35)' : 'rgba(168,85,247,0.35)'}`
                    }}>
                        {isConfirm ? 'CONFIRMAR' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export function ShopModal() {
    const isShopModalOpen = useUISystem(state => state.isShopModalOpen);
    const setShopModalOpen = useUISystem(state => state.setShopModalOpen);
    const playerStats = useUISystem(state => state.playerStats);
    const spendAuracash = useUISystem(state => state.spendAuracash);
    const addPotionToInventory = useUISystem(state => state.addPotionToInventory);
    const auracash = playerStats?.diamonds !== undefined ? playerStats.diamonds : (playerStats?.auracash || 0);

    const currentMultiplier = useAuraSystem(state => state.auraMultiplier);

    const [modal, setModal] = useState(null);
    const closeModal = () => setModal(null);
    const showAlert = (title, message, type = 'error') => setModal({ type, title, message });
    const showConfirm = (title, message, onConfirm) => setModal({ type: 'confirm', title, message, onConfirm });
    const showSuccess = (title, message) => setModal({ type: 'success', title, message });

    if (!isShopModalOpen) return null;

    const potions = [
        { id: 1, name: 'Poção Energética', desc: '2x Aura por 5 min', multiplier: 2, price: 100, color: '#38bdf8', icon: '💧' },
        { id: 2, name: 'Poção Mística',    desc: '3x Aura por 5 min', multiplier: 3, price: 500, color: '#a855f7', icon: '🔮' },
        { id: 3, name: 'Poção Épica',      desc: '5x Aura por 5 min', multiplier: 5, price: 1000, color: '#ec4899', icon: '🔥' },
        { id: 4, name: 'Elixir Supremo',   desc: '10x Aura por 5 min', multiplier: 10, price: 1500, color: '#fbbf24', icon: '⭐' },
    ];

    const executeBuy = (potion) => {
        spendAuracash(potion.price);
        addPotionToInventory({ name: potion.name, multiplier: potion.multiplier, price: potion.price });

        import('../../systems/useDatabaseSystem').then(dbSys => {
            Promise.all([
                import('../../systems/usePlayerSystem'),
                import('../../systems/useAuraSystem')
            ]).then(([pModule, aModule]) => {
                const pos = pModule.usePlayerSystem.getState().position;
                const model = pModule.usePlayerSystem.getState().activeModel;
                const { comboCount, maxCombo, aura, weeklyAura } = aModule.useAuraSystem.getState();
                const newDiamonds = auracash - potion.price;
                const newInventory = useUISystem.getState().inventory;
                dbSys.useDatabaseSystem.getState().saveGameState(
                    pos, comboCount, model, aura, newDiamonds, maxCombo,
                    undefined, undefined, weeklyAura, undefined, undefined, undefined, newInventory
                );
            });
        });

        showSuccess('Poção Adquirida!', `${potion.icon} ${potion.name} foi adicionada ao seu inventário.\n\nUse-a no jogo para ativar o bônus de ${potion.multiplier}x Aura!`);
    };

    const handleBuy = (potion) => {
        if (auracash < potion.price) {
            showAlert(
                'Saldo Insuficiente',
                `Você precisa de ${potion.price.toLocaleString()} AuraCash para comprar esta poção.\n\nSeu saldo atual: ${auracash.toLocaleString()} AuraCash.`,
                'error'
            );
            return;
        }
        showConfirm(
            'Confirmar Compra',
            `Deseja comprar ${potion.icon} ${potion.name} por ${potion.price.toLocaleString()} AuraCash?\n\nEfeito: ${potion.desc}`,
            () => executeBuy(potion)
        );
    };

    return (
        <>
            <style>{`
                @keyframes shopFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes shopSlideUp { from { transform: scale(0.85) translateY(30px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                .shop-potion-row { transition: transform 0.15s ease, box-shadow 0.15s ease; }
                .shop-potion-row:hover { transform: translateX(4px); }
                .shop-buy-btn { transition: all 0.15s ease; }
                .shop-buy-btn:active { transform: scale(0.93); }
            `}</style>

            <FeedbackModal modal={modal} onClose={closeModal} />

            {/* Overlay */}
            <div
                onClick={() => setShopModalOpen(false)}
                style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9000, fontFamily: 'Inter, sans-serif',
                    padding: '16px', boxSizing: 'border-box'
                }}
            >
                {/* Caixa do modal */}
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'linear-gradient(135deg, #1a1035, #0d0720)',
                        border: '1px solid rgba(168,85,247,0.4)',
                        borderRadius: '20px',
                        width: '100%', maxWidth: '460px',
                        maxHeight: '90vh',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 0 50px rgba(168,85,247,0.3), inset 0 0 30px rgba(168,85,247,0.05)',
                        animation: 'shopSlideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header fixo */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '18px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 14px rgba(168,85,247,0.5)'
                            }}>
                                <ShoppingBag size={18} color="#fff" />
                            </div>
                            <div>
                                <div style={{ color: '#fff', fontWeight: '900', fontSize: '1rem', letterSpacing: '0.5px' }}>Loja de Poções</div>
                                <div style={{ color: '#a855f7', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>ITENS DE BOOST</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShopModalOpen(false)}
                            style={{
                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '8px', color: '#fff', cursor: 'pointer',
                                width: '34px', height: '34px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Saldo */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        margin: '14px 20px 0', padding: '10px 14px',
                        background: 'rgba(52,211,153,0.08)',
                        border: '1px solid rgba(52,211,153,0.2)',
                        borderRadius: '12px', flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AuracashIcon size={18} color="#34d399" />
                            <div>
                                <div style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>SEU SALDO</div>
                                <div style={{ color: '#34d399', fontSize: '1rem', fontWeight: '900', fontVariantNumeric: 'tabular-nums' }}>
                                    {auracash.toLocaleString()} AuraCash
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>MULTIPLICADOR</div>
                            <div style={{ color: '#4ade80', fontSize: '1rem', fontWeight: '900' }}>{currentMultiplier}x</div>
                        </div>
                    </div>

                    {/* Lista de poções (scrollável) */}
                    <div style={{
                        flex: 1, overflowY: 'auto',
                        padding: '14px 20px 20px',
                        display: 'flex', flexDirection: 'column', gap: '10px'
                    }}>
                        {potions.map(potion => {
                            const canAfford = auracash >= potion.price;
                            const isCurrent = currentMultiplier === potion.multiplier;

                            return (
                                <div key={potion.id} className="shop-potion-row" style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: isCurrent ? `rgba(${potion.color === '#38bdf8' ? '56,189,248' : potion.color === '#a855f7' ? '168,85,247' : potion.color === '#ec4899' ? '236,72,153' : '251,191,36'},0.12)` : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${isCurrent ? potion.color : 'rgba(255,255,255,0.08)'}`,
                                    borderRadius: '14px', padding: '12px 14px',
                                    opacity: (!canAfford && !isCurrent) ? 0.5 : 1,
                                    gap: '12px'
                                }}>
                                    {/* Ícone + info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '28px', background: 'rgba(0,0,0,0.3)',
                                            width: '52px', height: '52px', borderRadius: '12px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            boxShadow: isCurrent ? `0 0 12px ${potion.color}60` : 'none'
                                        }}>
                                            {potion.icon}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ color: potion.color, fontWeight: '900', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {potion.name} ({potion.multiplier}x)
                                            </div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '2px' }}>{potion.desc}</div>
                                        </div>
                                    </div>

                                    {/* Preço + botão */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginBottom: '6px' }}>
                                            <AuracashIcon size={14} color="#34d399" />
                                            <span style={{ color: '#fff', fontWeight: '900', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                                                {potion.price.toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            className="shop-buy-btn"
                                            onClick={() => handleBuy(potion)}
                                            disabled={isCurrent}
                                            style={{
                                                background: isCurrent
                                                    ? 'rgba(71,85,105,0.6)'
                                                    : canAfford
                                                    ? `linear-gradient(90deg, ${potion.color}, ${potion.color}cc)`
                                                    : 'rgba(51,65,85,0.8)',
                                                color: '#fff', border: 'none',
                                                padding: '7px 16px', borderRadius: '10px',
                                                fontWeight: '900', fontSize: '0.75rem',
                                                cursor: isCurrent ? 'default' : 'pointer',
                                                whiteSpace: 'nowrap',
                                                boxShadow: (canAfford && !isCurrent) ? `0 0 12px ${potion.color}50` : 'none'
                                            }}
                                        >
                                            {isCurrent ? '✓ Ativo' : canAfford ? 'Comprar' : 'Sem Saldo'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
