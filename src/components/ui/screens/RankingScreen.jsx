import React, { useEffect } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { useRankingSystem } from '../../../systems/useRankingSystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { WEEKLY_TOP_REWARDS } from '../../../systems/useDatabaseSystem';
import { AuracashIcon } from '../AuracashIcon';
import { Trophy } from 'lucide-react';

export function RankingScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const { weeklyRanking, globalRanking, isLoading, fetchRankings } = useRankingSystem();
    const weeklyAura = useAuraSystem(s => s.weeklyAura);
    const aura = useAuraSystem(s => s.aura);

    useEffect(() => {
        fetchRankings();
    }, [fetchRankings]);

    const myWeekly = useRankingSystem.getState().getMyPosition(weeklyRanking);
    const myGlobal = useRankingSystem.getState().getMyPosition(globalRanking);

    const renderList = (list, color, showPrizes = false) => (
        list.map(player => (
            <div key={`${color}-${player.rank}`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px',
                background: player.rank % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{
                        color: player.rank === 1 ? '#ffd700' : player.rank === 2 ? '#c0c0c0' : player.rank === 3 ? '#cd7f32' : '#888',
                        fontWeight: 900, width: 36, textAlign: 'center'
                    }}>#{player.rank}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: '#eee', fontWeight: 'bold' }}>{player.name}</span>
                        {showPrizes && WEEKLY_TOP_REWARDS[player.rank] > 0 && (
                            <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                +{WEEKLY_TOP_REWARDS[player.rank]} <AuracashIcon size={9} color="#34d399" />
                            </span>
                        )}
                    </div>
                </div>
                <span style={{ color, fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {player.score.toLocaleString()}
                </span>
            </div>
        ))
    );

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(10, 10, 15, 0.95)', pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.3s ease'
        }}>
            <div style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <h2 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Trophy color="#fcd34d" /> Rankings
                </h2>
                <button
                    onClick={() => setScreen('MENU')}
                    style={{
                        padding: '10px 30px', background: 'transparent', color: '#fff',
                        border: '1px solid #666', borderRadius: '10px', cursor: 'pointer'
                    }}
                >
                    VOLTAR
                </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px 30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                <section>
                    <h3 style={{ color: '#d8b4fe', marginTop: 0 }}>Semanal — você #{myWeekly} · {Math.floor(weeklyAura).toLocaleString()} aura</h3>
                    {isLoading && <p style={{ color: '#888' }}>Carregando...</p>}
                    {!isLoading && weeklyRanking.length === 0 && <p style={{ color: '#888' }}>Ninguém pontuou ainda.</p>}
                    {!isLoading && renderList(weeklyRanking, '#d8b4fe', true)}
                </section>
                <section>
                    <h3 style={{ color: '#fcd34d', marginTop: 0 }}>Global — você #{myGlobal} · {Math.floor(aura).toLocaleString()} aura</h3>
                    {isLoading && <p style={{ color: '#888' }}>Carregando...</p>}
                    {!isLoading && renderList(globalRanking, '#a855f7')}
                </section>
            </div>
        </div>
    );
}
