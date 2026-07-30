import React, { useEffect } from 'react';
import { useMultiplayerSystem } from '../../../systems/useMultiplayerSystem';
import { useDuelSystem } from '../../../systems/useDuelSystem';
import { Swords, X, Loader2 } from 'lucide-react';
import { auth } from '../../../config/firebase';

export function DuelModal({ onClose }) {
    const remotePlayers = useMultiplayerSystem(state => state.remotePlayers);
    const { sendInvite, isSearching, listenToMyInvite } = useDuelSystem();

    const handleChallenge = (player) => {
        if (isSearching) return;
        sendInvite(player.id, player.name);
        listenToMyInvite(player.id);
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 300,
            pointerEvents: 'auto'
        }}>
            <div style={{
                background: 'rgba(20,20,30,0.95)', border: '1px solid #ef4444',
                borderRadius: '16px', width: '90%', maxWidth: '400px', padding: '20px',
                boxShadow: '0 10px 40px rgba(239, 68, 68, 0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '900' }}>
                        <Swords size={24} /> FARMA VS (1v1)
                    </div>
                    <X size={24} color="#888" cursor="pointer" onClick={onClose} />
                </div>

                {isSearching ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#fff' }}>
                        <Loader2 size={32} className="spin" color="#ef4444" style={{ margin: '0 auto 15px' }} />
                        <div style={{ fontWeight: 'bold' }}>Aguardando resposta do adversário...</div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>A aposta inicial é de 10 AuraCash.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>JOGADORES NA SALA</div>
                        {Object.values(remotePlayers).length === 0 && (
                            <div style={{ textAlign: 'center', color: '#555', padding: '20px 0' }}>Nenhum outro jogador na sala.</div>
                        )}
                        {Object.values(remotePlayers).map(player => (
                            <div key={player.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px'
                            }}>
                                <div style={{ color: '#fff', fontWeight: 'bold' }}>{player.name}</div>
                                <button 
                                    onClick={() => handleChallenge(player)}
                                    style={{
                                        background: '#ef4444', color: '#fff', border: 'none',
                                        padding: '6px 12px', borderRadius: '8px', fontWeight: '900',
                                        fontSize: '0.7rem', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center'
                                    }}
                                >
                                    <Swords size={12} /> DESAFIAR
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
