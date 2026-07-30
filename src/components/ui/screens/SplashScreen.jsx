import React, { useEffect, useState } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { useAudioSystem } from '../../../systems/useAudioSystem';
import splashImg from '../../../assets/splash.png';

export function SplashScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Tocar a música de introdução
        useAudioSystem.getState().playBGM('intro');

        // Barra de progresso artificial e confiável (4 segundos)
        const duration = 4000;
        const intervalTime = 50;
        const step = (100 / (duration / intervalTime));
        
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prev + step;
            });
        }, intervalTime);

        // Transição garantida após a barra encher
        const finishTimer = setTimeout(() => {
            setScreen('MENU');
        }, duration + 300); // Mais 300ms pra dar tempo de ver o 100%

        return () => {
            clearInterval(timer);
            clearTimeout(finishTimer);
        };
    }, [setScreen]);

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', alignItems: 'center', 
            zIndex: 9999, pointerEvents: 'auto',
            paddingBottom: '10%', // Usando porcentagem para ficar mais flexível no mobile
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

            {/* Barra de Progresso Segura */}
            <div style={{ 
                width: '80%', height: '12px', background: 'rgba(0,0,0,0.6)', 
                borderRadius: '6px', overflow: 'hidden', 
                boxShadow: '0 0 15px rgba(168,85,247,0.5)',
                border: '1px solid rgba(168,85,247,0.3)',
                zIndex: 1
            }}>
                <div style={{ 
                    width: `${Math.min(progress, 100)}%`, height: '100%', 
                    background: 'linear-gradient(90deg, #a855f7, #ec4899)', 
                    transition: 'width 0.1s linear',
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
