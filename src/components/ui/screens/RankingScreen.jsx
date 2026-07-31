import React from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { Settings } from 'lucide-react';

export function RankingScreen() {
    const setScreen = useUISystem(state => state.setScreen);

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

            {/* Maintenance Message */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px', textAlign: 'center' }}>
                <Settings size={64} color="#a855f7" style={{ marginBottom: '20px', animation: 'spin 4s linear infinite' }} />
                <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '10px', fontWeight: 'bold' }}>
                    SISTEMA DE RANKING EM MANUTENÇÃO
                </h3>
                <p style={{ color: '#aaa', fontSize: '1rem', maxWidth: '500px', lineHeight: '1.5' }}>
                    Estamos atualizando nossa infraestrutura de banco de dados para suportar a alta quantidade de jogadores. 
                    <br/><br/>
                    O Ranking Global retornará em breve com os dados reais de todos os Caçadores de Aura!
                </p>
            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
