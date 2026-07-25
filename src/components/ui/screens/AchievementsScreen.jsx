import React from 'react';
import { useUISystem } from '../../../systems/useUISystem';

export function AchievementsScreen() {
    const setScreen = useUISystem(state => state.setScreen);

    const achievements = [
        { id: 1, title: 'Primeiro Combo +50', desc: 'Realizou uma sequência de 50 acertos perfeitos.', done: true },
        { id: 2, title: 'Primeiro Combo +100', desc: 'Realizou uma sequência de 100 acertos perfeitos.', done: true },
        { id: 3, title: 'Primeiro Sigma', desc: 'Alcançou o cobiçado título de Sigma.', done: true },
        { id: 4, title: 'Primeiro Omega', desc: 'Transcendeu para o título Omega.', done: true },
        { id: 5, title: '1.000 Movimentos', desc: 'Executou 1.000 movimentos Six Seven.', done: true },
        { id: 6, title: '10.000 Movimentos', desc: 'Executou 10.000 movimentos Six Seven.', done: true },
        { id: 7, title: '100 Horas', desc: 'Passou 100 horas farmando.', done: false },
        { id: 8, title: 'Combo +500', desc: 'Mantendo o foco absoluto por 500 acertos.', done: true },
        { id: 9, title: 'Combo +1000', desc: 'Ascensão divina de 1000 acertos consecutivos.', done: false },
        { id: 10, title: 'Aura 1 Milhão', desc: 'Acumulou 1.000.000 de Aura.', done: false },
        { id: 11, title: 'Aura 100 Milhões', desc: 'Acumulou 100.000.000 de Aura.', done: false },
        { id: 12, title: 'Aura 1 Bilhão', desc: 'Alcançou o topo da existência.', done: false },
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
                    Conquistas
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
                <div style={{ 
                    maxWidth: '1000px', margin: '0 auto', display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' 
                }}>
                    {achievements.map((ach) => (
                        <div key={ach.id} style={{
                            padding: '20px',
                            background: ach.done ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.02)',
                            border: ach.done ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            opacity: ach.done ? 1 : 0.5,
                            transition: 'all 0.3s',
                            boxShadow: ach.done ? '0 4px 15px rgba(168,85,247,0.1)' : 'none'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ color: ach.done ? '#d8b4fe' : '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    {ach.title}
                                </div>
                                <div style={{ color: ach.done ? '#a855f7' : '#666', fontSize: '1.2rem' }}>
                                    {ach.done ? '★' : '🔒'}
                                </div>
                            </div>
                            <div style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                {ach.desc}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
