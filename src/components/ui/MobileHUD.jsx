import React, { useEffect, useState } from 'react';
import { useAuraSystem } from '../../systems/useAuraSystem';
import { useFarmSystem } from '../../systems/useFarmSystem';
import { usePlayerSystem } from '../../systems/usePlayerSystem';
import { AuraSystem } from '../../systems/rhythm/AuraSystem';
import { Joystick } from './Joystick';

export function MobileHUD() {
    const { aura, message, lastPoints } = useAuraSystem();
    const { activeModel, setActiveModel } = usePlayerSystem();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const characters = ['san.vrm', 'deric.vrm', 'carol.vrm', 'rafa.vrm'];

    const [progression, setProgression] = useState(null);
    useEffect(() => {
        import('../../systems/progressionRules').then(rules => {
            setProgression(rules);
        });
    }, []);

    const level = progression ? progression.getPlayerLevel(aura) : 1;
    const title = progression ? progression.getPlayerTitle(level) : 'Carregando...';

    // Integração de Inputs: Envia apenas o estado puro para o AuraSystem
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '1' && !e.repeat) AuraSystem.setRawInput('left', true);
            if (e.key === '2' && !e.repeat) AuraSystem.setRawInput('right', true);
        };

        const handleKeyUp = (e) => {
            if (e.key === '1') AuraSystem.setRawInput('left', false);
            if (e.key === '2') AuraSystem.setRawInput('right', false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Triggers da Tela 
    const handleLeftDown = (e) => { e.target.setPointerCapture(e.pointerId); AuraSystem.setRawInput('left', true); };
    const handleLeftUp = (e) => { e.target.releasePointerCapture(e.pointerId); AuraSystem.setRawInput('left', false); };
    
    const handleRightDown = (e) => { e.target.setPointerCapture(e.pointerId); AuraSystem.setRawInput('right', true); };
    const handleRightUp = (e) => { e.target.releasePointerCapture(e.pointerId); AuraSystem.setRawInput('right', false); };

    const getRatingColor = () => {
        if (lastPoints >= 50) return '#a855f7'; // Roxo (Mestre)
        if (lastPoints >= 25) return '#60a5fa'; // Azul (Muito Rápido)
        if (lastPoints > 0) return '#4ade80'; // Verde (Normal)
        if (lastPoints < 0) return '#f87171'; // Vermelho (Erro)
        return '#fff';
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 10, display: 'flex', flexDirection: 'column'
        }}>
            {/* HUD Central: Placar Gamificado */}
            <div style={{
                padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                color: '#fff', pointerEvents: 'auto', fontFamily: 'sans-serif'
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '2px' }}>{title}</h2>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Aura: {Math.floor(aura).toLocaleString()}</p>
                    
                    {/* Exibição da Eficiência */}
                    <div style={{ marginTop: '10px', height: '40px' }}>
                        {message && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                                <span style={{ color: getRatingColor(), fontWeight: 'bold', fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    {message}
                                </span>
                                {lastPoints !== 0 && (
                                    <span style={{ color: lastPoints > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold', fontSize: '1rem', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {lastPoints > 0 ? `+${lastPoints}` : lastPoints}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(168, 85, 247, 0.8)',
                            color: 'white',
                            border: '1px solid #d8b4fe',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            pointerEvents: 'auto'
                        }}
                    >
                        Trocar Personagem
                    </button>
                </div>
            </div>

            {/* Farm Zones Livres na Tela */}
            <div style={{ flex: 1, display: 'flex', pointerEvents: 'none' }}>
                <div 
                    style={{ flex: 1, touchAction: 'none', pointerEvents: 'auto' }}
                    onPointerDown={handleLeftDown}
                    onPointerUp={handleLeftUp}
                    onPointerCancel={handleLeftUp}
                />
                <div style={{ width: '40%', pointerEvents: 'none' }}></div>
                <div 
                    style={{ flex: 1, touchAction: 'none', pointerEvents: 'auto' }}
                    onPointerDown={handleRightDown}
                    onPointerUp={handleRightUp}
                    onPointerCancel={handleRightUp}
                />
            </div>

            <Joystick />

            {/* Modal de Seleção de Personagens */}
            {isModalOpen && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', zIndex: 100, pointerEvents: 'auto',
                    backdropFilter: 'blur(5px)'
                }}>
                    <h2 style={{ color: '#fff', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 2px 10px rgba(168, 85, 247, 0.8)' }}>
                        Escolha seu Personagem
                    </h2>
                    
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '400px' }}>
                        {characters.map((char) => {
                            const CHAR_NAMES = {
                                'san.vrm': 'Samy',
                                'deric.vrm': 'Marc',
                                'carol.vrm': 'Carol',
                                'rafa.vrm': 'Rafa'
                            };
                            return (
                            <button
                                key={char}
                                onClick={() => {
                                    setActiveModel(char);
                                    setIsModalOpen(false);
                                }}
                                style={{
                                    padding: '15px 30px',
                                    background: activeModel === char ? 'rgba(168, 85, 247, 0.9)' : 'rgba(0, 0, 0, 0.6)',
                                    color: 'white',
                                    border: `2px solid ${activeModel === char ? '#d8b4fe' : 'rgba(168, 85, 247, 0.4)'}`,
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    minWidth: '150px',
                                    textTransform: 'uppercase',
                                    boxShadow: activeModel === char ? '0 0 15px rgba(168, 85, 247, 0.6)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {CHAR_NAMES[char]}
                            </button>
                        )})}
                    </div>

                    <button
                        onClick={() => setIsModalOpen(false)}
                        style={{
                            marginTop: '40px',
                            padding: '10px 40px',
                            background: 'transparent',
                            color: '#ccc',
                            border: '1px solid #666',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
}
