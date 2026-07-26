import React, { useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { useUISystem } from '../../../systems/useUISystem';

export function SplashScreen() {
    const { progress } = useProgress();
    const setScreen = useUISystem(state => state.setScreen);

    useEffect(() => {
        // Quando os modelos 3D terminarem de baixar
        if (progress === 100) {
            const timer = setTimeout(() => {
                setScreen('MENU');
            }, 500); // 0.5s de delay para o usuário ver o 100%
            return () => clearTimeout(timer);
        }
    }, [progress, setScreen]);

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundImage: 'url(/splash.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', alignItems: 'center', 
            zIndex: 9999, pointerEvents: 'auto',
            paddingBottom: '50px'
        }}>
            {/* Overlay para dar um leve escurecimento no fundo se necessário */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8) 100%)',
                zIndex: -1
            }}></div>

            <h1 style={{
                color: '#fff', fontSize: '2.5rem', margin: 0, textTransform: 'uppercase',
                letterSpacing: '5px', textShadow: '0 0 20px #a855f7',
                animation: 'pulse 1.5s infinite'
            }}>
                Farma<span style={{ color: '#a855f7' }}>AI</span>
            </h1>
            <p style={{ color: '#ccc', marginTop: '10px', letterSpacing: '2px', fontSize: '0.9rem', marginBottom: '20px' }}>
                CARREGANDO O METAVERSO...
            </p>
            
            {/* Barra de Progresso Real */}
            <div style={{ width: '70%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
                <div style={{ 
                    width: `${progress}%`, height: '100%', 
                    background: 'linear-gradient(90deg, #a855f7, #ec4899)', 
                    transition: 'width 0.3s ease-out',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                        animation: 'shimmer 1.5s infinite'
                    }}></div>
                </div>
            </div>
            <div style={{ color: '#fff', marginTop: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {Math.floor(progress)}%
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes shimmer { 
                    0% { transform: translateX(-100%); } 
                    100% { transform: translateX(100%); } 
                }
            `}</style>
        </div>
    );
}
