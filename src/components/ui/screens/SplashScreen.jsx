import React, { useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { useUISystem } from '../../../systems/useUISystem';

// Importando a imagem diretamente para forçar o Vite a gerar um hash único e contornar o cache do PWA
import splashImg from '../../../assets/splash.png';

export function SplashScreen() {
    const { progress } = useProgress();
    const setScreen = useUISystem(state => state.setScreen);

    useEffect(() => {
        // Quando os modelos 3D terminarem de baixar
        if (progress >= 100) {
            const timer = setTimeout(() => {
                setScreen('MENU');
            }, 500); // 0.5s de delay
            return () => clearTimeout(timer);
        }
    }, [progress, setScreen]);

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', alignItems: 'center', 
            zIndex: 9999, pointerEvents: 'auto',
            paddingBottom: '50px',
            backgroundColor: '#050505'
        }}>
            {/* Imagem de Fundo Forçada via Tag Img */}
            <img 
                src={splashImg} 
                alt="Splash" 
                style={{
                    position: 'absolute', top: 0, left: 0, 
                    width: '100%', height: '100%', 
                    objectFit: 'cover', zIndex: -2
                }}
            />

            {/* Barra de Progresso Real */}
            <div style={{ 
                width: '80%', height: '12px', background: 'rgba(0,0,0,0.6)', 
                borderRadius: '6px', overflow: 'hidden', 
                boxShadow: '0 0 15px rgba(168,85,247,0.5)',
                border: '1px solid rgba(168,85,247,0.3)',
                zIndex: 1
            }}>
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

            <style>{`
                @keyframes shimmer { 
                    0% { transform: translateX(-100%); } 
                    100% { transform: translateX(100%); } 
                }
            `}</style>
        </div>
    );
}
