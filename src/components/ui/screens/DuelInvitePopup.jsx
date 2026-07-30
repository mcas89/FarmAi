import React, { useEffect } from 'react';
import { useDuelSystem } from '../../../systems/useDuelSystem';
import { Swords, Check, X } from 'lucide-react';

export function DuelInvitePopup() {
    const { incomingInvites, listenForInvites, respondToInvite } = useDuelSystem();

    useEffect(() => {
        const unsubscribe = listenForInvites();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    if (incomingInvites.length === 0) return null;

    // Mostra apenas o primeiro convite pendente
    const invite = incomingInvites[0];

    return (
        <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, 0)',
            background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(10px)',
            border: '2px solid #fca5a5', borderRadius: '16px', padding: '20px',
            width: '90%', maxWidth: '350px', zIndex: 400,
            boxShadow: '0 10px 50px rgba(239, 68, 68, 0.4)',
            pointerEvents: 'auto', textAlign: 'center'
        }}>
            <Swords size={32} color="#fff" style={{ marginBottom: '10px' }} />
            <div style={{ color: '#fff', fontWeight: '900', fontSize: '1.2rem', marginBottom: '5px' }}>
                DESAFIO DE DUELO!
            </div>
            <div style={{ color: '#fecaca', fontSize: '0.9rem', marginBottom: '20px' }}>
                <strong style={{ color: '#fff' }}>{invite.fromName}</strong> quer tirar um X1 com você!<br/>
                Aposta: {invite.betAmount} AuraCash
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                    onClick={() => respondToInvite(invite.id, false)}
                    style={{
                        background: 'transparent', border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
                        padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
                        display: 'flex', gap: '8px', alignItems: 'center'
                    }}
                >
                    <X size={16} /> RECUSAR
                </button>
                <button 
                    onClick={() => respondToInvite(invite.id, true)}
                    style={{
                        background: '#fff', color: '#ef4444', border: 'none',
                        padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer',
                        display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                >
                    <Check size={16} /> ACEITAR
                </button>
            </div>
        </div>
    );
}
