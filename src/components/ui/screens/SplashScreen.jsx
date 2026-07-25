import React, { useEffect } from 'react';
import { useUISystem } from '../../../systems/useUISystem';

export function SplashScreen() {
    const setScreen = useUISystem(state => state.setScreen);

    useEffect(() => {
        // Transição automática para o Menu Principal após 3 segundos
        const timer = setTimeout(() => {
            setScreen('MENU');
        }, 3000);
        return () => clearTimeout(timer);
    }, [setScreen]);

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: '#050505', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', zIndex: 100, pointerEvents: 'auto',
            animation: 'fadeOut 0.5s ease 2.5s forwards'
        }}>
            <h1 style={{
                color: '#fff', fontSize: '3rem', margin: 0, textTransform: 'uppercase',
                letterSpacing: '5px', textShadow: '0 0 20px #a855f7',
                animation: 'pulse 1.5s infinite'
            }}>
                Farma<span style={{ color: '#a855f7' }}>AI</span>
            </h1>
            <p style={{ color: '#888', marginTop: '10px', letterSpacing: '2px', fontSize: '0.9rem' }}>
                INFINITE AURA PROGRESSION
            </p>
            
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeOut {
                    to { opacity: 0; visibility: hidden; }
                }
            `}</style>
        </div>
    );
}
