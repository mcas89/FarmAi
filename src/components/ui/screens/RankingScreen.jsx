import React from 'react';
import { useUISystem } from '../../../systems/useUISystem';

export function RankingScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const stats = useUISystem(state => state.playerStats);

    const mockRanking = [
        { rank: 1, name: 'AuraGod', level: 999, aura: '12.5M', title: 'Deus da Aura' },
        { rank: 2, name: 'SigmaGrind', level: 850, aura: '8.2M', title: 'Rei da Aura' },
        { rank: 3, name: 'SixSevenPro', level: 720, aura: '5.1M', title: 'Mega Aura' },
        { rank: 4, name: 'DericFan', level: 600, aura: '3.4M', title: 'Master Farmador' },
        { rank: 5, name: 'CarolQueen', level: 550, aura: '2.9M', title: 'Master Farmador' },
    ];

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(10, 10, 15, 0.95)', pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.3s ease'
        }}>
            {/* Header */}
            <div style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <h2 style={{ color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '2rem' }}>
                    Top 100 Farmadores
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

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', boxSizing: 'border-box' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {mockRanking.map((player) => (
                        <div key={player.rank} style={{
                            display: 'flex', alignItems: 'center', padding: '20px',
                            background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                            borderLeft: player.rank <= 3 ? '4px solid #a855f7' : '4px solid transparent'
                        }}>
                            <div style={{ width: '50px', color: player.rank <= 3 ? '#a855f7' : '#888', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                #{player.rank}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{player.name}</div>
                                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Nível {player.level} • {player.title}</div>
                            </div>
                            <div style={{ color: '#d8b4fe', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {player.aura} Aura
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fixed Footer (My Rank) */}
            <div style={{
                background: 'rgba(168, 85, 247, 0.1)', borderTop: '1px solid rgba(168, 85, 247, 0.3)',
                padding: '20px 30px', backdropFilter: 'blur(10px)'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100px', color: '#a855f7', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        MEU RANK
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.globalRanking}</div>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 'bold' }}>{stats.nickname}</div>
                            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Nível 354 • OMEGA</div>
                        </div>
                    </div>
                    <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        145.541 Aura
                    </div>
                </div>
            </div>
        </div>
    );
}
