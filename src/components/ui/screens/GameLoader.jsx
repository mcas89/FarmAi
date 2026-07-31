import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

export function GameLoader() {
    const { active, progress, item, total, loaded } = useProgress();
    const [isVisible, setIsVisible] = useState(true);
    const [minTimePassed, setMinTimePassed] = useState(false);
    
    // Garante que a tela de loading fique visível por pelo menos 2 segundos
    // para dar tempo do navegador decodificar os modelos e compilar os shaders.
    useEffect(() => {
        const t = setTimeout(() => setMinTimePassed(true), 2000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        // Só esconde se o tempo mínimo passou E o loader do ThreeJS finalizou.
        // Consideramos finalizado se progress for 100% ou se não estiver mais ativo.
        if (minTimePassed && (!active || progress >= 100)) {
            const t = setTimeout(() => setIsVisible(false), 500); // leve delay final
            return () => clearTimeout(t);
        } else {
            setIsVisible(true);
        }
    }, [minTimePassed, active, progress]);

    if (!isVisible) return null;

    // Gera um texto descritivo baseado no progresso
    let statusText = "INICIALIZANDO MOTOR 3D...";
    if (progress > 10) statusText = "CARREGANDO MAPA...";
    if (progress > 50) statusText = "PREPARANDO PERSONAGENS...";
    if (progress > 80) statusText = "COMPILANDO SHADERS...";
    if (progress >= 100) statusText = "PRONTO PARA ENTRAR!";

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            background: 'rgba(5, 5, 8, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 99999,
            pointerEvents: 'auto',
            color: '#fff',
            transition: 'opacity 0.6s ease-out',
            opacity: isVisible ? 1 : 0
        }}>
            <div style={{
                background: 'rgba(20, 20, 30, 0.6)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '24px',
                padding: '40px 60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 10px 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(168,85,247,0.1)'
            }}>
                <Loader2 size={56} color="#a855f7" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '25px' }} />
                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', letterSpacing: '3px', background: 'linear-gradient(90deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
                    CARREGANDO MUNDO
                </h2>
                
                <div style={{ color: '#d8b4fe', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '10px', letterSpacing: '1px', fontStyle: 'italic' }}>
                    {statusText}
                </div>

                <div style={{ width: '250px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginTop: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ 
                        width: `${Math.max(5, progress)}%`, height: '100%', 
                        background: 'linear-gradient(90deg, #a855f7, #ec4899)', 
                        transition: 'width 0.3s ease-out',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                            animation: 'shimmer 1.5s infinite'
                        }}></div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', marginTop: '8px' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>
                        {loaded} / {total} ASSETS
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#a855f7', fontWeight: '900' }}>
                        {Math.round(progress)}%
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}</style>
        </div>
    );
}
