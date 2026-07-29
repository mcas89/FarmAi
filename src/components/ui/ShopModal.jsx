import React from 'react';
import { useUISystem } from '../../systems/useUISystem';
import { useAuraSystem } from '../../systems/useAuraSystem';
import { AuracashIcon } from './AuracashIcon';

export function ShopModal() {
    const isShopModalOpen = useUISystem(state => state.isShopModalOpen);
    const setShopModalOpen = useUISystem(state => state.setShopModalOpen);
    // Extraindo auracash do state persistente (diamonds)
    const playerStats = useUISystem(state => state.playerStats);
    const spendAuracash = useUISystem(state => state.spendAuracash);
    const auracash = playerStats?.diamonds !== undefined ? playerStats.diamonds : (playerStats?.auracash || 0);
    
    const setMultiplier = useAuraSystem(state => state.setMultiplier);
    const currentMultiplier = useAuraSystem(state => state.auraMultiplier);

    if (!isShopModalOpen) return null;

    const potions = [
        { id: 1, name: 'Poção Energética (2x)', multiplier: 2, price: 100, color: '#38bdf8', icon: '💧' },
        { id: 2, name: 'Poção Mística (3x)', multiplier: 3, price: 500, color: '#a855f7', icon: '🔮' },
        { id: 3, name: 'Poção Épica (5x)', multiplier: 5, price: 1000, color: '#ec4899', icon: '🔥' },
        { id: 4, name: 'Elixir Supremo (10x)', multiplier: 10, price: 1500, color: '#fbbf24', icon: '⭐' },
    ];

    const handleBuy = (potion) => {
        if (auracash >= potion.price) {
            spendAuracash(potion.price);
            
            // Adiciona a poção no inventário em vez de ativar imediatamente
            const addPotion = useUISystem.getState().addPotionToInventory;
            addPotion({ name: potion.name, multiplier: potion.multiplier, price: potion.price });

            // Tentar salvar no banco de dados
            import('../../systems/useDatabaseSystem').then(dbSys => {
                const pSys = import('../../systems/usePlayerSystem');
                const aSys = import('../../systems/useAuraSystem');
                Promise.all([pSys, aSys]).then(([pModule, aModule]) => {
                    const pos = pModule.usePlayerSystem.getState().position;
                    const model = pModule.usePlayerSystem.getState().activeModel;
                    const { comboCount, maxCombo, aura, weeklyAura } = aModule.useAuraSystem.getState();
                    const newDiamonds = auracash - potion.price;
                    const newInventory = useUISystem.getState().inventory;
                    dbSys.useDatabaseSystem.getState().saveGameState(pos, comboCount, model, aura, newDiamonds, maxCombo, undefined, undefined, weeklyAura, undefined, undefined, undefined, newInventory);
                });
            });
            
            alert(`Você comprou a ${potion.name}! Ela foi adicionada ao seu inventário.`);
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '2px solid #a855f7',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '600px',
                padding: '24px',
                color: 'white',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✨ Loja de Poções
                    </h2>
                    <button 
                        onClick={() => setShopModalOpen(false)}
                        style={{
                            background: 'transparent', border: 'none', color: '#94a3b8', 
                            fontSize: '24px', cursor: 'pointer', outline: 'none'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Saldo */}
                <div style={{ 
                    background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '12px 16px', 
                    marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                    <div>
                        <span style={{ fontSize: '14px', color: '#94a3b8', display: 'block' }}>Seu Saldo:</span>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AuracashIcon size={24} /> {auracash} Auracash
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Multiplicador Atual</span>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ade80' }}>{currentMultiplier}x</span>
                    </div>
                </div>

                {/* Lista de Itens */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {potions.map(potion => {
                        const canAfford = auracash >= potion.price;
                        const isCurrent = currentMultiplier === potion.multiplier;
                        
                        return (
                            <div key={potion.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${potion.color}`,
                                borderRadius: '12px',
                                padding: '16px',
                                opacity: (canAfford || isCurrent) ? 1 : 0.5
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ 
                                        fontSize: '32px', background: 'rgba(0,0,0,0.3)', 
                                        width: '60px', height: '60px', borderRadius: '12px', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                                    }}>
                                        {potion.icon}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', color: potion.color }}>{potion.name}</h3>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
                                            Aumenta sua aura ganha em {potion.multiplier} vezes.
                                        </p>
                                    </div>
                                </div>
                                
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                        <AuracashIcon size={20} /> {potion.price}
                                    </div>
                                    <button 
                                        onClick={() => handleBuy(potion)}
                                        disabled={!canAfford || isCurrent}
                                        style={{
                                            background: isCurrent ? '#475569' : canAfford ? potion.color : '#334155',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 24px',
                                            borderRadius: '20px',
                                            fontWeight: 'bold',
                                            cursor: (canAfford && !isCurrent) ? 'pointer' : 'not-allowed',
                                            boxShadow: (canAfford && !isCurrent) ? `0 0 10px ${potion.color}80` : 'none',
                                        }}
                                    >
                                        {isCurrent ? 'Ativo' : canAfford ? 'Comprar' : 'Sem Saldo'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
