import React, { useState } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { getPlayerLevel } from '../../../systems/progressionRules';
import { CHARACTERS } from './CharacterScreen';
import { AuracashIcon } from '../AuracashIcon';
import { ShoppingCart, UserPlus, Gift, Star, Zap, Package, Lock, AlertCircle, CreditCard } from 'lucide-react';
import splashImg from '../../../assets/splash.png';
import { initInfinitePayCheckout, AURACASH_PACKS } from '../../../services/infinitePayService';
import { auth } from '../../../config/firebase';

function CustomModal({ modal, onClose }) {
    if (!modal) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.2s ease', pointerEvents: 'auto'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a0e30, #0d0715)',
                border: '1px solid rgba(168,85,247,0.4)',
                borderRadius: '16px', padding: '28px 32px',
                maxWidth: '360px', width: '90%',
                boxShadow: '0 0 40px rgba(168,85,247,0.3)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <AlertCircle size={20} color="#a855f7" />
                    <span style={{ color: '#fff', fontWeight: '900', fontSize: '1rem', letterSpacing: '1px' }}>
                        {modal.title}
                    </span>
                </div>
                <p style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 24px' }}>
                    {modal.message}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    {modal.type === 'confirm' && (
                        <button
                            onClick={onClose}
                            style={{
                                padding: '9px 20px', borderRadius: '8px', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.05)', color: '#aaa',
                                border: '1px solid rgba(255,255,255,0.15)', fontWeight: 'bold', fontSize: '0.8rem'
                            }}
                        >
                            CANCELAR
                        </button>
                    )}
                    <button
                        onClick={() => { modal.onConfirm?.(); onClose(); }}
                        style={{
                            padding: '9px 20px', borderRadius: '8px', cursor: 'pointer',
                            background: 'linear-gradient(90deg, #a855f7, #6b21a8)',
                            color: '#fff', border: 'none', fontWeight: '900', fontSize: '0.8rem',
                            boxShadow: '0 4px 15px rgba(168,85,247,0.4)'
                        }}
                    >
                        {modal.type === 'confirm' ? 'CONFIRMAR' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function StoreScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const updateStats = useUISystem(state => state.updateStats);
    const stats = useUISystem(state => state.playerStats);
    const { unlockedCharacters } = usePlayerSystem();

    const [activeTab, setActiveTab] = useState('PACKS'); // PACKS, CHARACTERS, ITEMS
    const [modal, setModal] = useState(null);

    const closeModal = () => setModal(null);
    const showAlert = (title, message) => setModal({ type: 'alert', title, message, onConfirm: null });
    const showConfirm = (title, message, onConfirm) => setModal({ type: 'confirm', title, message, onConfirm });

    const [buyingPack, setBuyingPack] = useState(null); // ID do pack sendo processado

    const handlePurchaseAuraCash = async (packId) => {
        const pack = AURACASH_PACKS[packId];
        if (!pack) return;

        const userId = auth.currentUser?.uid || 'anonimo';
        setBuyingPack(packId);
        try {
            await initInfinitePayCheckout(packId, pack.priceCents, pack.description, userId);
            // Se chegou aqui sem redirecionar, algo deu errado
        } catch (err) {
            showAlert("Erro no Pagamento", err.message || "Não foi possível iniciar o checkout. Tente novamente.");
        } finally {
            setBuyingPack(null);
        }
    };

    const handlePurchaseItem = (itemName, price, multiplier) => {
        if (!price || !multiplier) {
            showAlert("Item Adquirido", `${itemName} adquirido com sucesso!`);
            return;
        }
        const { playerStats, spendAuracash, addPotionToInventory, inventory } = useUISystem.getState();
        const currentAuracash = playerStats?.diamonds || 0;
        
        if (currentAuracash >= price) {
            spendAuracash(price);
            
            // Adiciona a poção no inventário em vez de ativar imediatamente
            addPotionToInventory({ name: itemName, multiplier, price });

            // Salvar novo saldo e inventário no banco de dados
            import('../../../systems/useDatabaseSystem').then(dbSys => {
                const pSys = import('../../../systems/usePlayerSystem');
                const aSys = import('../../../systems/useAuraSystem');
                Promise.all([pSys, aSys]).then(([pModule, aModule]) => {
                    const pos = pModule.usePlayerSystem.getState().position;
                    const model = pModule.usePlayerSystem.getState().activeModel;
                    const { comboCount, maxCombo, aura, weeklyAura } = aModule.useAuraSystem.getState();
                    const newDiamonds = currentAuracash - price;
                    const newInventory = useUISystem.getState().inventory;
                    dbSys.useDatabaseSystem.getState().saveGameState(pos, comboCount, model, aura, newDiamonds, maxCombo, undefined, undefined, weeklyAura, undefined, undefined, undefined, newInventory);
                });
            });
            
            showAlert("Poção Comprada", `Você comprou a ${itemName}! Ela foi adicionada ao seu inventário.`);
        } else {
            showAlert("Saldo Insuficiente", "Você não tem Auracash suficiente.");
        }
    };

    const handleCharacterPurchase = (charConfig) => {
        const currentAura = useAuraSystem.getState().aura;
        const currentLevel = getPlayerLevel(currentAura);

        if (currentLevel < charConfig.level) {
            showAlert(
                'Personagem Bloqueado',
                `Você precisa alcançar o Nível ${charConfig.level} para comprar ${charConfig.name}.\n\nSeu nível atual: ${currentLevel}.`
            );
            return;
        }

        const diamonds = useUISystem.getState().playerStats.diamonds || 0;
        if (diamonds < charConfig.price) {
            showAlert(
                'AuraCash Insuficiente',
                `Você precisa de ${charConfig.price} AuraCash para comprar ${charConfig.name}.\n\nSeu saldo: ${diamonds} AuraCash.`
            );
            return;
        }

        showConfirm(
            'Confirmar Compra',
            `Deseja comprar ${charConfig.name} por ${charConfig.price} AuraCash?`,
            () => _executePurchase(charConfig)
        );
    };

    const _executePurchase = async (charConfig) => {
        try {
            const char = charConfig.file;
            const diamonds = useUISystem.getState().playerStats.diamonds || 0;
            const newDiamonds = diamonds - charConfig.price;
            updateStats({ diamonds: newDiamonds });
            
            const currentUnlockedArray = usePlayerSystem.getState().unlockedCharacters;
            let newUnlocked = [...currentUnlockedArray];
            if (!currentUnlockedArray.includes(char)) {
                newUnlocked = [...currentUnlockedArray, char];
                usePlayerSystem.setState({ unlockedCharacters: newUnlocked });
            }

            const [pSys, aSys, dbSys, qSys, achSys] = await Promise.all([
                import('../../../systems/usePlayerSystem'),
                import('../../../systems/useAuraSystem'),
                import('../../../systems/useDatabaseSystem'),
                import('../../../systems/useQuestSystem'),
                import('../../../systems/useAchievementSystem')
            ]);
            
            const pos = pSys.usePlayerSystem.getState().position;
            const activeModel = pSys.usePlayerSystem.getState().activeModel;
            const { comboCount, maxCombo, aura, weeklyAura } = aSys.useAuraSystem.getState();
            const { dailyQuests, lastResetDate } = qSys.useQuestSystem.getState();
            const achievements = achSys.useAchievementSystem.getState().getSavableData();

            await dbSys.useDatabaseSystem.getState().saveGameState(
                pos, comboCount, activeModel, aura, newDiamonds,
                maxCombo, dailyQuests, lastResetDate,
                weeklyAura, undefined, achievements, newUnlocked
            );
            
            showAlert("Sucesso!", `Você comprou ${charConfig.name}! Acesse a tela "Personagens" para equipá-lo.`);
        } catch (err) {
            console.error("❌ Erro ao comprar personagem:", err);
            showAlert("Erro", "Ocorreu um erro ao processar a compra. Tente novamente.");
        }
    };

    const lockedCharacters = CHARACTERS.filter(char => !unlockedCharacters.includes(char.file));

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: '#050505', pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.3s ease',
            fontFamily: 'sans-serif',
            overflow: 'hidden'
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity:0; } to { transform: translateY(0); opacity:1; } }

                .store-card {
                    position: relative;
                    padding: 12px;
                    border-radius: 12px;
                    background: rgba(10, 10, 15, 0.75);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    cursor: pointer;
                    overflow: hidden;
                }
                .store-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(236, 72, 153, 0.5);
                    box-shadow: 0 8px 20px rgba(236, 72, 153, 0.2);
                }
                
                .premium-card {
                    background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2));
                    border: 1px solid rgba(236, 72, 153, 0.5);
                }
                .premium-card:hover {
                    background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3));
                }

                .buy-btn {
                    margin-top: 10px;
                    width: 100%;
                    background: linear-gradient(90deg, #ec4899, #a855f7);
                    border: none;
                    padding: 6px 0;
                    border-radius: 8px;
                    color: #fff;
                    font-weight: 900;
                    font-size: 0.75rem;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(236, 72, 153, 0.4);
                }
                .buy-btn:active { transform: scale(0.95); }

                .buy-btn-diamonds {
                    background: linear-gradient(90deg, #34d399, #10b981);
                    box-shadow: 0 2px 10px rgba(16, 185, 129, 0.4);
                }

                .badge {
                    position: absolute; top: -6px; right: -6px;
                    background: #f59e0b; color: #000;
                    font-weight: 900; font-size: 0.55rem;
                    padding: 3px 6px; border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                    z-index: 2;
                }

                .store-list::-webkit-scrollbar { width: 4px; }
                .store-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .store-list::-webkit-scrollbar-thumb { background: rgba(236, 72, 153, 0.4); border-radius: 2px; }

                .tab-btn {
                    padding: 6px 10px; border-radius: 8px; font-weight: 900; cursor: pointer; transition: all 0.2s;
                    display: flex; alignItems: center; gap: 4px; font-size: 0.7rem; border: none;
                }

                .store-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    padding: 16px;
                    overflow-y: auto;
                    flex: 1 1 0;
                    height: 100%;
                    min-height: 0;
                    -webkit-overflow-scrolling: touch;
                    touch-action: pan-y !important;
                    padding-bottom: 40px;
                }
                .store-grid::-webkit-scrollbar { width: 8px; }
                .store-grid::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .store-grid::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.4); border-radius: 4px; }

                .char-card-2d {
                    background: rgba(15, 10, 25, 0.75);
                    border: 1px solid rgba(168, 85, 247, 0.15);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.4);
                }
                
                .char-card-2d:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(168, 85, 247, 0.25);
                    border-color: rgba(168, 85, 247, 0.4);
                }
                
                .char-img-container {
                    width: 100%;
                    height: 160px;
                    background: radial-gradient(circle at bottom, rgba(76, 29, 149, 0.4) 0%, rgba(0,0,0,0) 80%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    border-top-left-radius: 16px;
                    border-top-right-radius: 16px;
                    overflow: hidden;
                }
                
                .char-img {
                    width: 90%;
                    height: 90%;
                    object-fit: contain;
                    transition: transform 0.3s ease;
                }
                
                .char-card-2d:hover .char-img {
                    transform: scale(1.05);
                }
                
                .char-info {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    flex: none;
                }
            `}</style>
            
            <CustomModal modal={modal} onClose={closeModal} />

            {/* Splash Image Background */}
            <img 
                src={splashImg} 
                alt="Fundo Loja" 
                style={{
                    position: 'absolute', top: 0, left: 0, 
                    width: '100%', height: '100%', 
                    objectFit: 'cover', zIndex: 0, opacity: 0.4,
                    filter: 'blur(3px)'
                }}
            />

            {/* HEADER */}
            <div style={{ position: 'relative', zIndex: 1, padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(0,0,0,0.7)', borderBottom: '1px solid rgba(236, 72, 153, 0.3)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingCart size={24} color="#ec4899" />
                        <div>
                            <h2 style={{ color: '#fff', margin: 0, fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Loja</h2>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(52,211,153,0.2)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.4)' }}>
                            <AuracashIcon size={12} color="#34d399" />
                            <span style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: '900' }}>{stats.diamonds ? stats.diamonds.toLocaleString() : 0}</span>
                        </div>
                        <button 
                            onClick={() => setScreen('MENU')}
                            style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            FECHAR
                        </button>
                    </div>
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button className="tab-btn" onClick={() => setActiveTab('PACKS')} style={{ background: activeTab === 'PACKS' ? '#ec4899' : 'rgba(255,255,255,0.1)', color: activeTab === 'PACKS' ? '#fff' : '#aaa' }}>
                        <AuracashIcon size={12} /> AURACASH
                    </button>
                    <button className="tab-btn" onClick={() => setActiveTab('CHARACTERS')} style={{ background: activeTab === 'CHARACTERS' ? '#a855f7' : 'rgba(255,255,255,0.1)', color: activeTab === 'CHARACTERS' ? '#fff' : '#aaa' }}>
                        <UserPlus size={12} /> PERSONAGENS
                    </button>
                    <button className="tab-btn" onClick={() => setActiveTab('ITEMS')} style={{ background: activeTab === 'ITEMS' ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: activeTab === 'ITEMS' ? '#fff' : '#aaa' }}>
                        <Package size={12} /> ITENS
                    </button>
                </div>
            </div>

            {/* LIST */}
            <div className="store-list" style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: activeTab === 'CHARACTERS' ? '0' : '20px', boxSizing: 'border-box' }}>
                {activeTab !== 'CHARACTERS' ? (
                    <div style={{ 
                        maxWidth: '1000px', margin: '0 auto', display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' 
                    }}>
                        {/* PACKS */}
                        {activeTab === 'PACKS' && (
                            <>
                                {/* Banner de informação */}
                                <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.1))', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CreditCard size={16} color="#34d399" />
                                    <span style={{ color: '#34d399', fontSize: '0.7rem', fontWeight: 'bold' }}>Pagamento seguro via InfinitePay · PIX, Cartão ou Boleto</span>
                                </div>

                                <div className="store-card">
                                    <AuracashIcon size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#fff', fontSize: '1rem', fontWeight: '900', marginBottom: '4px' }}>1.000</div>
                                    <div style={{ color: '#aaa', fontSize: '0.6rem', marginBottom: '8px' }}>Inicial</div>
                                    <button
                                        className="buy-btn"
                                        disabled={!!buyingPack}
                                        onClick={() => handlePurchaseAuraCash('pack_1000')}
                                        style={{ opacity: buyingPack === 'pack_1000' ? 0.6 : 1 }}
                                    >
                                        {buyingPack === 'pack_1000' ? '⏳ Aguarde...' : 'R$ 4,90'}
                                    </button>
                                </div>
                                <div className="store-card">
                                    <AuracashIcon size={32} color="#34d399" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#34d399', fontSize: '1rem', fontWeight: '900', marginBottom: '4px' }}>2.500</div>
                                    <div style={{ color: '#6ee7b7', fontSize: '0.6rem', marginBottom: '8px' }}>Pequeno</div>
                                    <button
                                        className="buy-btn"
                                        disabled={!!buyingPack}
                                        onClick={() => handlePurchaseAuraCash('pack_2500')}
                                        style={{ opacity: buyingPack === 'pack_2500' ? 0.6 : 1 }}
                                    >
                                        {buyingPack === 'pack_2500' ? '⏳ Aguarde...' : 'R$ 9,90'}
                                    </button>
                                </div>
                                <div className="store-card premium-card">
                                    <div className="badge" style={{ background: '#3b82f6', color: '#fff' }}>POPULAR</div>
                                    <Gift size={36} color="#60a5fa" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#60a5fa', fontSize: '1.2rem', fontWeight: '900', marginBottom: '4px' }}>7.000</div>
                                    <div style={{ color: '#93c5fd', fontSize: '0.6rem', marginBottom: '8px' }}>Médio</div>
                                    <button
                                        className="buy-btn"
                                        disabled={!!buyingPack}
                                        onClick={() => handlePurchaseAuraCash('pack_7000')}
                                        style={{ opacity: buyingPack === 'pack_7000' ? 0.6 : 1 }}
                                    >
                                        {buyingPack === 'pack_7000' ? '⏳ Aguarde...' : 'R$ 19,90'}
                                    </button>
                                </div>
                                <div className="store-card premium-card" style={{ border: '1px solid #ec4899', background: 'rgba(236, 72, 153, 0.05)' }}>
                                    <div className="badge" style={{ background: '#ec4899', color: '#fff' }}>MELHOR</div>
                                    <Gift size={36} color="#ec4899" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#ec4899', fontSize: '1.2rem', fontWeight: '900', marginBottom: '4px' }}>18.000</div>
                                    <div style={{ color: '#f472b6', fontSize: '0.6rem', marginBottom: '8px' }}>Grande</div>
                                    <button
                                        className="buy-btn"
                                        disabled={!!buyingPack}
                                        onClick={() => handlePurchaseAuraCash('pack_18000')}
                                        style={{ opacity: buyingPack === 'pack_18000' ? 0.6 : 1 }}
                                    >
                                        {buyingPack === 'pack_18000' ? '⏳ Aguarde...' : 'R$ 39,90'}
                                    </button>
                                </div>
                                <div className="store-card" style={{ border: '2px solid #fbbf24', background: 'rgba(251, 191, 36, 0.1)' }}>
                                    <div className="badge" style={{ background: '#fbbf24', color: '#000' }}>ÉPICO</div>
                                    <AuracashIcon size={32} color="#fbbf24" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: '900', marginBottom: '4px' }}>50.000</div>
                                    <div style={{ color: '#fde68a', fontSize: '0.6rem', marginBottom: '8px' }}>Supremo</div>
                                    <button
                                        className="buy-btn"
                                        disabled={!!buyingPack}
                                        onClick={() => handlePurchaseAuraCash('pack_50000')}
                                        style={{ background: 'linear-gradient(90deg, #d97706, #fbbf24)', opacity: buyingPack === 'pack_50000' ? 0.6 : 1 }}
                                    >
                                        {buyingPack === 'pack_50000' ? '⏳ Aguarde...' : 'R$ 89,90'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ITEMS */}
                        {activeTab === 'ITEMS' && (
                            <>
                                <div className="store-card">
                                    <Package size={32} color="#38bdf8" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#fff', fontSize: '0.7rem', fontWeight: '900', marginBottom: '4px' }}>Energética (2x)</div>
                                    <div style={{ color: '#aaa', fontSize: '0.55rem', marginBottom: '8px' }}>2x Aura por 5 min</div>
                                    <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchaseItem('Poção Energética', 100, 2)}>
                                        <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>100 <AuracashIcon size={10} /></span>
                                    </button>
                                </div>
                                <div className="store-card">
                                    <Package size={32} color="#a855f7" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#fff', fontSize: '0.7rem', fontWeight: '900', marginBottom: '4px' }}>Mística (3x)</div>
                                    <div style={{ color: '#aaa', fontSize: '0.55rem', marginBottom: '8px' }}>3x Aura por 5 min</div>
                                    <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchaseItem('Poção Mística', 500, 3)}>
                                        <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>500 <AuracashIcon size={10} /></span>
                                    </button>
                                </div>
                                <div className="store-card">
                                    <Package size={32} color="#ec4899" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#fff', fontSize: '0.7rem', fontWeight: '900', marginBottom: '4px' }}>Épica (5x)</div>
                                    <div style={{ color: '#aaa', fontSize: '0.55rem', marginBottom: '8px' }}>5x Aura por 5 min</div>
                                    <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchaseItem('Poção Épica', 1000, 5)}>
                                        <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>1000 <AuracashIcon size={10} /></span>
                                    </button>
                                </div>
                                <div className="store-card">
                                    <Package size={32} color="#fbbf24" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#fff', fontSize: '0.7rem', fontWeight: '900', marginBottom: '4px' }}>Suprema (10x)</div>
                                    <div style={{ color: '#aaa', fontSize: '0.55rem', marginBottom: '8px' }}>10x Aura por 5 min</div>
                                    <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchaseItem('Poção Suprema', 1500, 10)}>
                                        <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>1500 <AuracashIcon size={10} /></span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    /* PERSONAGENS (GRID 2 COLUNAS) */
                    <div className="store-grid">
                        {lockedCharacters.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', marginTop: '40px', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                Você já comprou todos os personagens!
                            </div>
                        ) : (
                            lockedCharacters.map((char, index) => {
                                let btnLabel = char.price > 0 ? `COMPRAR (${char.price})` : `LIBERA NO LV ${char.level}`;
                                let btnIcon = char.price > 0 ? <AuracashIcon size={18} /> : <Lock size={18} />;
                                let btnStyle = { 
                                    background: 'linear-gradient(90deg, #c026d3, #9333ea)', 
                                    color: '#fff', border: 'none', 
                                    boxShadow: '0 8px 20px rgba(168,85,247,0.5)' 
                                };

                                return (
                                    <div key={char.file} className="char-card-2d" style={{ animation: 'slideUp 0.4s ease-out backwards', animationDelay: `${index * 0.1}s` }}>
                                        <div className="char-img-container">
                                            <img src={char.image} alt={char.name} className="char-img" />
                                        </div>
                                        
                                        <div className="char-info">
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                                                    {char.name}
                                                </h3>
                                                <span style={{ 
                                                    background: 'rgba(239,68,68,0.15)', color: '#fca5a5', 
                                                    padding: '2px 8px', borderRadius: '6px', 
                                                    fontSize: '0.65rem', fontWeight: '900', border: '1px solid rgba(239,68,68,0.3)',
                                                    letterSpacing: '1px'
                                                }}>
                                                    REQ: LV {char.level}
                                                </span>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleCharacterPurchase(char)}
                                                style={{
                                                    width: '100%', padding: '10px', borderRadius: '10px',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                                                    fontWeight: '900', fontSize: '0.85rem', letterSpacing: '1px',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.1s, filter 0.2s',
                                                    marginTop: 'auto',
                                                    ...btnStyle
                                                }}
                                                onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                                                onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                                                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                                            >
                                                {btnIcon} {btnLabel}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
