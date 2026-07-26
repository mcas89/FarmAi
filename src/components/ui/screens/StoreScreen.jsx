import React, { useState } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { ShoppingCart, Diamond, UserPlus, Gift, Star, Zap, Crown } from 'lucide-react';

export function StoreScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const updateStats = useUISystem(state => state.updateStats);
    const stats = useUISystem(state => state.playerStats);

    const [activeTab, setActiveTab] = useState('PACKS'); // PACKS, CHARACTERS

    const handlePurchaseAuraCash = (amount) => {
        // Mocking a purchase logic for MVP visual feedback
        const currentDiamonds = stats.diamonds || 0;
        updateStats({ diamonds: currentDiamonds + amount });
        
        // Exibir um efeitozinho visual na tela poderia ser adicionado aqui
        alert(`Sucesso! Você adquiriu ${amount.toLocaleString()} AuraCash!`);
    };

    const handlePurchaseCharacter = (charName) => {
        alert(`O personagem ${charName} será adicionado à sua conta em breve!`);
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: '#050508', pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.4s ease',
            fontFamily: 'sans-serif',
            overflow: 'hidden'
        }}>
            <style>{`
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 20px rgba(236, 72, 153, 0.4); }
                    50% { box-shadow: 0 0 40px rgba(236, 72, 153, 0.8); }
                }
                @keyframes floatAnim {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes shine {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(200%) skewX(-15deg); }
                }

                .store-bg {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(circle at 50% -20%, rgba(236, 72, 153, 0.2), transparent 70%),
                                radial-gradient(circle at -20% 80%, rgba(168, 85, 247, 0.2), transparent 60%);
                    z-index: 0;
                    pointer-events: none;
                }

                .store-card {
                    position: relative;
                    padding: 25px 20px;
                    border-radius: 20px;
                    background: rgba(20, 15, 30, 0.7);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    overflow: hidden;
                    cursor: pointer;
                }
                
                .store-card:hover {
                    transform: translateY(-10px) scale(1.02);
                    border-color: rgba(236, 72, 153, 0.5);
                    box-shadow: 0 15px 35px rgba(236, 72, 153, 0.2), inset 0 0 20px rgba(236, 72, 153, 0.1);
                }

                .store-card::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 50%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: 0.5s;
                }
                .store-card:hover::after {
                    animation: shine 1.5s infinite;
                }

                .premium-card {
                    background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15));
                    border: 1px solid rgba(236, 72, 153, 0.4);
                    animation: pulseGlow 3s infinite;
                }
                
                .premium-card:hover {
                    background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3));
                }

                .buy-btn {
                    margin-top: 20px;
                    width: 100%;
                    background: linear-gradient(90deg, #ec4899, #a855f7);
                    border: none;
                    padding: 12px;
                    border-radius: 12px;
                    color: #fff;
                    font-weight: 900;
                    font-size: 0.9rem;
                    cursor: pointer;
                    letter-spacing: 1px;
                    box-shadow: 0 5px 15px rgba(236, 72, 153, 0.4);
                    transition: all 0.2s;
                    text-transform: uppercase;
                }
                .buy-btn:active { transform: scale(0.95); }
                .buy-btn:hover { box-shadow: 0 8px 25px rgba(236, 72, 153, 0.6); }

                .buy-btn-diamonds {
                    background: linear-gradient(90deg, #34d399, #10b981);
                    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
                }
                .buy-btn-diamonds:hover { box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6); }

                .store-list::-webkit-scrollbar { width: 8px; }
                .store-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .store-list::-webkit-scrollbar-thumb { background: rgba(236, 72, 153, 0.4); border-radius: 4px; }
                
                .char-img-container {
                    width: 120px; height: 120px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1), transparent);
                    border: 2px solid rgba(255,255,255,0.1);
                    margin-bottom: 15px;
                    display: flex; justify-content: center; align-items: center;
                    overflow: hidden;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                }
                .char-img-container img {
                    width: 100%; height: 100%; object-fit: cover;
                }

                .badge {
                    position: absolute; top: -10px; right: -10px;
                    background: #f59e0b; color: #000;
                    font-weight: 900; font-size: 0.7rem;
                    padding: 5px 10px; border-radius: 20px;
                    box-shadow: 0 5px 10px rgba(0,0,0,0.3);
                    transform: rotate(15deg);
                    z-index: 2;
                }
            `}</style>
            
            <div className="store-bg"></div>

            {/* Header com Abas */}
            <div style={{ position: 'relative', zIndex: 1, padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(236, 72, 153, 0.3)', backdropFilter: 'blur(15px)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShoppingCart size={32} color="#ec4899" />
                        <div>
                            <h2 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '3px', fontSize: '1.8rem', textShadow: '0 0 15px rgba(236, 72, 153, 0.6)' }}>
                                Loja Farm Ai
                            </h2>
                            <div style={{ color: '#f472b6', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '2px' }}>
                                PRODUTOS EXCLUSIVOS E PERSONAGENS
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setActiveTab('PACKS')}
                            style={{
                                padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s',
                                background: activeTab === 'PACKS' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.05)',
                                color: activeTab === 'PACKS' ? '#fff' : '#888',
                                border: activeTab === 'PACKS' ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <Diamond size={16} /> AURACASH
                        </button>
                        <button 
                            onClick={() => setActiveTab('CHARACTERS')}
                            style={{
                                padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s',
                                background: activeTab === 'CHARACTERS' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.05)',
                                color: activeTab === 'CHARACTERS' ? '#fff' : '#888',
                                border: activeTab === 'CHARACTERS' ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <UserPlus size={16} /> PERSONAGENS
                        </button>
                    </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(52,211,153,0.15)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.4)', boxShadow: '0 0 15px rgba(52,211,153,0.2)' }}>
                        <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>SALDO:</span>
                        <Diamond size={16} color="#34d399" />
                        <span style={{ color: '#34d399', fontSize: '1.2rem', fontWeight: '900' }}>{stats.diamonds ? stats.diamonds.toLocaleString() : 0}</span>
                    </div>

                    <button 
                        onClick={() => setScreen('MENU')}
                        style={{
                            padding: '10px 25px', background: 'rgba(255,255,255,0.05)', color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', cursor: 'pointer',
                            fontWeight: 'bold', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                        VOLTAR AO JOGO
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="store-list" style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '40px 30px', boxSizing: 'border-box' }}>
                <div style={{ 
                    maxWidth: '1200px', margin: '0 auto', display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' 
                }}>
                    
                    {/* TAB: AURACASH */}
                    {activeTab === 'PACKS' && (
                        <>
                            <div className="store-card">
                                <div style={{ animation: 'floatAnim 3s infinite ease-in-out' }}>
                                    <Diamond size={60} color="#34d399" style={{ filter: 'drop-shadow(0 10px 15px rgba(52,211,153,0.5))' }} />
                                </div>
                                <h3 style={{ color: '#fff', fontSize: '1.4rem', margin: '20px 0 5px 0', fontWeight: '900' }}>BOLSA PEQUENA</h3>
                                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Um pequeno incentivo para sua jornada.</p>
                                <div style={{ color: '#34d399', fontSize: '1.8rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    10.000 <Diamond size={18} />
                                </div>
                                <button className="buy-btn" onClick={() => handlePurchaseAuraCash(10000)}>
                                    R$ 4,90
                                </button>
                            </div>

                            <div className="store-card premium-card">
                                <div className="badge">MAIS POPULAR</div>
                                <div style={{ animation: 'floatAnim 3s infinite ease-in-out', animationDelay: '0.5s' }}>
                                    <Gift size={70} color="#ec4899" style={{ filter: 'drop-shadow(0 10px 20px rgba(236,72,153,0.6))' }} />
                                </div>
                                <h3 style={{ color: '#fff', fontSize: '1.6rem', margin: '20px 0 5px 0', fontWeight: '900', textShadow: '0 0 10px rgba(236,72,153,0.5)' }}>BAÚ MÁGICO</h3>
                                <p style={{ color: '#f472b6', fontSize: '0.9rem', marginBottom: '20px' }}>O pacote favorito dos jogadores.</p>
                                <div style={{ color: '#ec4899', fontSize: '2.2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px', textShadow: '0 0 20px rgba(236,72,153,0.5)' }}>
                                    50.000 <Diamond size={22} />
                                </div>
                                <button className="buy-btn" style={{ fontSize: '1.1rem', padding: '15px' }} onClick={() => handlePurchaseAuraCash(50000)}>
                                    R$ 19,90
                                </button>
                            </div>

                            <div className="store-card">
                                <div className="badge" style={{ background: '#a855f7', color: '#fff' }}>MELHOR VALOR</div>
                                <div style={{ animation: 'floatAnim 3s infinite ease-in-out', animationDelay: '1s' }}>
                                    <Crown size={60} color="#a855f7" style={{ filter: 'drop-shadow(0 10px 15px rgba(168,85,247,0.5))' }} />
                                </div>
                                <h3 style={{ color: '#fff', fontSize: '1.4rem', margin: '20px 0 5px 0', fontWeight: '900' }}>TESOURO SUPREMO</h3>
                                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Para quem busca o topo do ranking.</p>
                                <div style={{ color: '#a855f7', fontSize: '1.8rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    150.000 <Diamond size={18} />
                                </div>
                                <button className="buy-btn" onClick={() => handlePurchaseAuraCash(150000)}>
                                    R$ 49,90
                                </button>
                            </div>
                        </>
                    )}

                    {/* TAB: PERSONAGENS */}
                    {activeTab === 'CHARACTERS' && (
                        <>
                            <div className="store-card">
                                <div className="char-img-container">
                                    <Zap size={50} color="#60a5fa" />
                                </div>
                                <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: '10px 0 5px 0', fontWeight: '900' }}>RAFA</h3>
                                <p style={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px' }}>BÔNUS DE COMBO +20%</p>
                                <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '20px', padding: '0 10px' }}>O mestre da precisão. Perfeito para manter combos altos sem falhar.</p>
                                <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchaseCharacter('Rafa')}>
                                    <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                        DESBLOQUEAR POR 25.000 <Diamond size={14} />
                                    </span>
                                </button>
                            </div>

                            <div className="store-card">
                                <div className="badge" style={{ background: '#ef4444' }}>NOVO</div>
                                <div className="char-img-container" style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
                                    <Flame size={50} color="#f87171" />
                                </div>
                                <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: '10px 0 5px 0', fontWeight: '900' }}>DERIC</h3>
                                <p style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px' }}>BÔNUS DE AURA +15%</p>
                                <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '20px', padding: '0 10px' }}>Força bruta. Cada batida gera muito mais aura base.</p>
                                <button className="buy-btn buy-btn-diamonds" onClick={() => handlePurchaseCharacter('Deric')}>
                                    <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                        DESBLOQUEAR POR 35.000 <Diamond size={14} />
                                    </span>
                                </button>
                            </div>

                            <div className="store-card premium-card">
                                <div className="badge" style={{ background: '#ec4899' }}>LENDÁRIO</div>
                                <div className="char-img-container" style={{ borderColor: 'rgba(236,72,153,0.5)', background: 'radial-gradient(circle, rgba(236,72,153,0.2), transparent)' }}>
                                    <Star size={50} color="#ec4899" />
                                </div>
                                <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: '10px 0 5px 0', fontWeight: '900', textShadow: '0 0 10px rgba(236,72,153,0.5)' }}>CAROL</h3>
                                <p style={{ color: '#f472b6', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px' }}>MAGNETISMO DE CRISTAIS</p>
                                <p style={{ color: '#ccc', fontSize: '0.8rem', marginBottom: '20px', padding: '0 10px' }}>Atrai AuraCash espalhados pelo mapa automaticamente para você.</p>
                                <button className="buy-btn" style={{ fontSize: '1rem', padding: '14px' }} onClick={() => handlePurchaseCharacter('Carol')}>
                                    R$ 29,90
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
