import React, { useEffect, useState } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { useAchievementSystem } from '../../../systems/useAchievementSystem';
import { AuracashIcon } from '../AuracashIcon';
import { CheckCircle, Lock } from 'lucide-react';

export function AchievementsScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const screenParams = useUISystem(state => state.screenParams);
    const [achievements, setAchievements] = useState([]);
    const [activeTab, setActiveTab] = useState(screenParams?.tab || 'PENDING'); // 'PENDING' ou 'CLAIMED'
    const updateStats = useUISystem(state => state.updateStats);
    const stats = useUISystem(state => state.playerStats);

    useEffect(() => {
        const unsub = useAchievementSystem.subscribe((state) => {
            setAchievements(state.achievements);
        });
        setAchievements(useAchievementSystem.getState().achievements);
        return unsub;
    }, []);

    const handleClaim = (id) => {
        const reward = useAchievementSystem.getState().claimReward(id);
        if (reward > 0) {
            const currentDiamonds = useUISystem.getState().playerStats.diamonds || 0;
            const newDiamonds = currentDiamonds + reward;
            updateStats({ diamonds: newDiamonds });
            // Força o auto-save pra guardar a conquista imediatamente
            if (window.executeGameSave) {
                setTimeout(() => window.executeGameSave(), 100);
            }
        }
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(10, 10, 15, 0.95)', pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.3s ease',
            fontFamily: 'sans-serif'
        }}>
            <style>{`
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 15px rgba(168,85,247,0.4); }
                    50% { box-shadow: 0 0 30px rgba(168,85,247,0.8); }
                }
                .ach-card {
                    padding: 20px;
                    border-radius: 12px;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                
                /* Estado: BLOQUEADO (Escuro) */
                .ach-locked {
                    background: rgba(168,85,247,0.1);
                    border: 1px solid rgba(168,85,247,0.3);
                    opacity: 0.95;
                }
                
                /* Estado: PRONTO PARA COLETAR (Brilhante) */
                .ach-ready {
                    background: linear-gradient(135deg, rgba(168,85,247,0.25), rgba(107,33,168,0.25));
                    border: 1px solid rgba(168,85,247,0.8);
                    animation: pulseGlow 2s infinite;
                    opacity: 1;
                }

                /* Estado: COLETADO (Verde translúcido) */
                .ach-claimed {
                    background: rgba(52,211,153,0.1);
                    border: 1px solid rgba(52,211,153,0.4);
                    opacity: 1;
                }

                .claim-btn {
                    margin-top: 15px; width: 100%;
                    background: linear-gradient(90deg, #f59e0b, #fbbf24);
                    border: none; padding: 10px; border-radius: 8px;
                    color: #000; font-weight: 900; font-size: 0.8rem;
                    cursor: pointer; letter-spacing: 1px;
                    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
                    transition: transform 0.2s;
                }
                .claim-btn:active { transform: scale(0.95); }

                .prog-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-top: 15px; overflow: hidden; }
                .prog-fill { height: 100%; background: linear-gradient(90deg, #d8b4fe, #f0abfc); transition: width 0.3s; }
                
                /* Scrollbar personalizada para a lista */
                .ach-list::-webkit-scrollbar { width: 8px; }
                .ach-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .ach-list::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.4); border-radius: 4px; }
            `}</style>

            {/* Header com Abas */}
            <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(168, 85, 247, 0.3)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <h2 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.8rem', textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
                            Conquistas
                        </h2>
                        <div style={{ color: '#d8b4fe', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px' }}>
                            DESBLOQUEIE MARCOS E GANHE AURACASH
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setActiveTab('PENDING')}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                background: activeTab === 'PENDING' ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: activeTab === 'PENDING' ? '1px solid #d8b4fe' : '1px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            PENDENTES
                        </button>
                        <button 
                            onClick={() => setActiveTab('CLAIMED')}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                background: activeTab === 'CLAIMED' ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: activeTab === 'CLAIMED' ? '1px solid #6ee7b7' : '1px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            COLETADAS
                        </button>
                    </div>
                </div>
                
                <button 
                    onClick={() => setScreen('MENU')}
                    style={{
                        padding: '10px 25px', background: 'rgba(255,255,255,0.1)', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', cursor: 'pointer',
                        fontWeight: 'bold', transition: 'all 0.2s', alignSelf: 'flex-start'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    VOLTAR
                </button>
            </div>

            {/* List */}
            <div className="ach-list" style={{ flex: 1, overflowY: 'auto', padding: '30px', boxSizing: 'border-box' }}>
                <div style={{ 
                    maxWidth: '1200px', margin: '0 auto', display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' 
                }}>
                    {achievements.filter(ach => activeTab === 'PENDING' ? !ach.claimed : ach.claimed).map((ach) => {
                        const isLocked = !ach.completed;
                        const isReady = ach.completed && !ach.claimed;
                        const isClaimed = ach.claimed;

                        let cardClass = 'ach-locked';
                        if (isReady) cardClass = 'ach-ready';
                        if (isClaimed) cardClass = 'ach-claimed';

                        return (
                            <div key={ach.id} className={`ach-card ${cardClass}`}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div style={{ color: '#fff', textShadow: '0 0 5px rgba(255,255,255,0.3)', fontWeight: '900', fontSize: '1.1rem', paddingRight: '10px' }}>
                                            {ach.title}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                            <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '0.9rem' }}>{ach.reward}</span>
                                            <AuracashIcon size={12} color="#fbbf24" />
                                        </div>
                                    </div>
                                    <div style={{ color: '#f3f4f6', fontSize: '0.9rem', lineHeight: '1.4', minHeight: '40px', fontWeight: '500' }}>
                                        {ach.desc}
                                    </div>
                                </div>

                                <div>
                                    {!isClaimed && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="prog-bar">
                                                <div className="prog-fill" style={{ width: `${(ach.progress / ach.target) * 100}%` }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold', whiteSpace: 'nowrap', marginTop: '15px' }}>
                                                {ach.type === 'aura' ? Math.floor(ach.progress).toLocaleString() : ach.progress} / {ach.type === 'aura' ? ach.target.toLocaleString() : ach.target}
                                            </span>
                                        </div>
                                    )}

                                    {isLocked && !isClaimed && (
                                        <div style={{ marginTop: '15px', color: '#666', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                            <Lock size={14} /> BLOQUEADA
                                        </div>
                                    )}

                                    {isReady && (
                                        <button className="claim-btn" onClick={() => handleClaim(ach.id)}>
                                            COLETAR RECOMPENSA
                                        </button>
                                    )}

                                    {isClaimed && (
                                        <div style={{ marginTop: '15px', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900' }}>
                                            <CheckCircle size={16} /> COLETADO
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
