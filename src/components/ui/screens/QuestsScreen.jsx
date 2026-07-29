import React, { useEffect, useState } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { useQuestSystem } from '../../../systems/useQuestSystem';
import { AuracashIcon } from '../AuracashIcon';
import { CheckCircle, Target } from 'lucide-react';

export function QuestsScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const updateStats = useUISystem(state => state.updateStats);
    const stats = useUISystem(state => state.playerStats);
    
    const [dailyQuests, setDailyQuests] = useState([]);

    useEffect(() => {
        const unsub = useQuestSystem.subscribe((state) => {
            setDailyQuests(state.dailyQuests);
        });
        setDailyQuests(useQuestSystem.getState().dailyQuests);
        return unsub;
    }, []);

    const handleClaimReward = async (questId) => {
        const reward = useQuestSystem.getState().claimQuest(questId);
        if (reward > 0) {
            const currentDiamonds = useUISystem.getState().playerStats.diamonds || 0;
            const newDiamonds = currentDiamonds + reward;
            updateStats({ diamonds: newDiamonds });
            
            // Força o auto-save pra guardar a missão imediatamente
            Promise.all([
                import('../../../systems/usePlayerSystem'),
                import('../../../systems/useAuraSystem'),
                import('../../../systems/useDatabaseSystem')
            ]).then(([pSys, aSys, dbSys]) => {
                const pos = pSys.usePlayerSystem.getState().position;
                const model = pSys.usePlayerSystem.getState().activeModel;
                const combo = aSys.useAuraSystem.getState().comboCount;
                const maxC = aSys.useAuraSystem.getState().maxCombo;
                const currAura = aSys.useAuraSystem.getState().aura;
                const { dailyQuests, lastResetDate } = useQuestSystem.getState();
                
                dbSys.useDatabaseSystem.getState().saveGameState(
                    pos, combo, model, currAura, newDiamonds, maxC, dailyQuests, lastResetDate
                );
            });
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
                    0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
                    50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.8); }
                }
                .quest-card {
                    padding: 20px;
                    border-radius: 12px;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                
                /* Estado: EM ANDAMENTO (Escuro) */
                .quest-progress {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                }
                
                /* Estado: PRONTO PARA COLETAR (Brilhante) */
                .quest-ready {
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.15));
                    border: 1px solid rgba(245, 158, 11, 0.6);
                    animation: pulseGlow 2s infinite;
                    opacity: 1;
                }

                /* Estado: COLETADO (Verde translúcido) */
                .quest-claimed {
                    background: rgba(52,211,153,0.05);
                    border: 1px solid rgba(52,211,153,0.2);
                    opacity: 0.7;
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

                .prog-bar { width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; margin-top: 15px; overflow: hidden; }
                .prog-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); transition: width 0.3s; }
                
                .quest-list::-webkit-scrollbar { width: 8px; }
                .quest-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .quest-list::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.4); border-radius: 4px; }
            `}</style>

            {/* Header */}
            <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(245, 158, 11, 0.3)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <h2 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.8rem', textShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}>
                        Missões Diárias
                    </h2>
                    <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        COMPLETE OS DESAFIOS PARA GANHAR AURACASH
                    </div>
                </div>
                
                <button 
                    onClick={() => setScreen('MENU')}
                    style={{
                        padding: '10px 25px', background: 'rgba(255,255,255,0.05)', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', cursor: 'pointer',
                        fontWeight: 'bold', transition: 'all 0.2s', alignSelf: 'flex-start'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    VOLTAR
                </button>
            </div>

            {/* List */}
            <div className="quest-list" style={{ flex: 1, overflowY: 'auto', padding: '30px', boxSizing: 'border-box' }}>
                <div style={{ 
                    maxWidth: '1200px', margin: '0 auto', display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' 
                }}>
                    {dailyQuests.map((quest) => {
                        const isReady = quest.progress >= quest.target && !quest.claimed;
                        const isClaimed = quest.claimed;

                        let cardClass = 'quest-progress';
                        if (isReady) cardClass = 'quest-ready';
                        if (isClaimed) cardClass = 'quest-claimed';

                        return (
                            <div key={quest.id} className={`quest-card ${cardClass}`}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div style={{ color: isReady ? '#fbbf24' : isClaimed ? '#34d399' : '#fff', fontWeight: '900', fontSize: '1.1rem', paddingRight: '10px' }}>
                                            {quest.title}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '0.9rem' }}>{quest.reward}</span>
                                            <AuracashIcon size={12} color="#fbbf24" />
                                        </div>
                                    </div>
                                    <div style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                        Recompensa de {quest.reward} AuraCash.
                                    </div>
                                </div>

                                <div>
                                    {!isClaimed && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="prog-bar">
                                                <div className="prog-fill" style={{ width: `${(quest.progress / quest.target) * 100}%` }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold', whiteSpace: 'nowrap', marginTop: '15px' }}>
                                                {Math.floor(quest.progress).toLocaleString()} / {quest.target.toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    {isReady && (
                                        <button className="claim-btn" onClick={() => handleClaimReward(quest.id)}>
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
