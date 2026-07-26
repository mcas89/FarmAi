import React, { useState } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { ShoppingCart, Diamond, UserPlus, Gift, Star, Zap, Package, Flame } from 'lucide-react';
import splashImg from '../../../assets/splash.png';

export function StoreScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const updateStats = useUISystem(state => state.updateStats);
    const stats = useUISystem(state => state.playerStats);

    const [activeTab, setActiveTab] = useState('PACKS'); // PACKS, CHARACTERS, ITEMS

    const handlePurchaseAuraCash = (amount) => {
        const currentDiamonds = stats.diamonds || 0;
        updateStats({ diamonds: currentDiamonds + amount });
        alert(`Sucesso! Você adquiriu ${amount.toLocaleString()} AuraCash!`);
    };

    const handlePurchase = (itemName) => {
        alert(`${itemName} adquirido com sucesso!`);
    };

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
            `}</style>
            
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
                            <Diamond size={12} color="#34d399" />
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
                        <Diamond size={12} /> AURACASH
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
            <div className="store-list" style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '20px', boxSizing: 'border-box' }}>
                <div style={{ 
                    maxWidth: '1000px', margin: '0 auto', display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' 
                }}>
                    
                    {/* PACKS */}
                    {activeTab === 'PACKS' && (
                        <>
                            <div className="store-card">
                                <Diamond size={32} color="#34d399" style={{ marginBottom: '8px' }} />
                                <div style={{ color: '#fff', fontSize: '1rem', fontWeight: '900', marginBottom: '4px' }}>1.000</div>
                                <div style={{ color: '#aaa', fontSize: '0.6rem', marginBottom: '8px' }}>AuraCash</div>
                                <button className="buy-btn" onClick={() => handlePurchaseAuraCash(1000)}>R$ 4,90</button>
                            </div>
                            <div className="store-card premium-card">
                                <div className="badge">POPULAR</div>
                                <Gift size={36} color="#ec4899" style={{ marginBottom: '8px' }} />
                                <div style={{ color: '#ec4899', fontSize: '1.2rem', fontWeight: '900', marginBottom: '4px' }}>5.000</div>
                                <div style={{ color: '#f472b6', fontSize: '0.6rem', marginBottom: '8px' }}>AuraCash</div>
                                <button className="buy-btn" onClick={() => handlePurchaseAuraCash(5000)}>R$ 9,90</button>
                            </div>
                            <div className="store-card">
                                <div className="badge" style={{ background: '#a855f7', color: '#fff' }}>MELHOR</div>
                                <Diamond size={32} color="#a855f7" style={{ marginBottom: '8px' }} />
                                <div style={{ color: '#a855f7', fontSize: '1.2rem', fontWeight: '900', marginBottom: '4px' }}>15.000</div>
                                <div style={{ color: '#d8b4fe', fontSize: '0.6rem', marginBottom: '8px' }}>AuraCash</div>
                                <button className="buy-btn" onClick={() => handlePurchaseAuraCash(15000)}>R$ 24,90</button>
                            </div>
                        </>
                    )}

                    {/* PERSONAGENS */}
                    {activeTab === 'CHARACTERS' && (
                        <>
                            <div className="store-card">
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                                    <Zap size={28} color="#60a5fa" />
                                </div>
                                <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '900' }}>RAFA</div>
                                <div style={{ color: '#60a5fa', fontSize: '0.55rem', fontWeight: 'bold', marginBottom: '8px', marginTop: '2px' }}>+20% COMBO</div>
                                <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchase('Rafa')}>
                                    <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>25k <Diamond size={10} /></span>
                                </button>
                            </div>
                            <div className="store-card">
                                <div className="badge" style={{ background: '#ef4444' }}>NOVO</div>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(248,113,113,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                                    <Flame size={28} color="#f87171" />
                                </div>
                                <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '900' }}>DERIC</div>
                                <div style={{ color: '#f87171', fontSize: '0.55rem', fontWeight: 'bold', marginBottom: '8px', marginTop: '2px' }}>+15% AURA</div>
                                <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchase('Deric')}>
                                    <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>35k <Diamond size={10} /></span>
                                </button>
                            </div>
                            <div className="store-card premium-card">
                                <div className="badge" style={{ background: '#ec4899' }}>LENDÁRIA</div>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(236,72,153,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                                    <Star size={28} color="#ec4899" />
                                </div>
                                <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '900' }}>CAROL</div>
                                <div style={{ color: '#f472b6', fontSize: '0.55rem', fontWeight: 'bold', marginBottom: '8px', marginTop: '2px' }}>IMÃ DE ITENS</div>
                                <button className="buy-btn" onClick={() => handlePurchase('Carol')}>R$ 29,90</button>
                            </div>
                        </>
                    )}

                    {/* ITEMS */}
                    {activeTab === 'ITEMS' && (
                        <>
                            <div className="store-card">
                                <Package size={32} color="#3b82f6" style={{ marginBottom: '8px' }} />
                                <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '900', marginBottom: '4px' }}>POÇÃO AURA</div>
                                <div style={{ color: '#aaa', fontSize: '0.55rem', marginBottom: '8px' }}>2x Aura por 5 min</div>
                                <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchase('Poção Aura')}>
                                    <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>500 <Diamond size={10} /></span>
                                </button>
                            </div>
                            <div className="store-card">
                                <Zap size={32} color="#eab308" style={{ marginBottom: '8px' }} />
                                <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '900', marginBottom: '4px' }}>VELOCIDADE</div>
                                <div style={{ color: '#aaa', fontSize: '0.55rem', marginBottom: '8px' }}>Corra 50% + rápido</div>
                                <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchase('Bota Velocidade')}>
                                    <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>800 <Diamond size={10} /></span>
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
