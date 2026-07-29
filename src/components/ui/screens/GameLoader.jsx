import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

export function GameLoader() {
    const { active, progress } = useProgress();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!active || progress >= 100) {
            const t = setTimeout(() => setIsVisible(false), 500);
            return () => clearTimeout(t);
        } else {
            setIsVisible(true);
        }
    }, [active, progress]);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            background: 'rgba(10, 10, 15, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999,
            pointerEvents: 'auto',
            color: '#fff',
            transition: 'opacity 0.4s ease-out',
            opacity: isVisible ? 1 : 0
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '40px 60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)'
            }}>
                <Loader2 size={48} color="#a855f7" style={{ animation: 'spin 2s linear infinite', marginBottom: '20px' }} />
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', background: 'linear-gradient(90deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    CARREGANDO JOGO...
                </h2>
                <div style={{ width: '200px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '20px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${progress}%`, height: '100%', 
                        background: 'linear-gradient(90deg, #a855f7, #ec4899)', 
                        transition: 'width 0.2s ease-out' 
                    }} />
                </div>
                <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {Math.round(progress)}%
                </p>
            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
