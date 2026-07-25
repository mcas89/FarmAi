import React from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';

export function CharacterScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const { activeModel, setActiveModel } = usePlayerSystem();
    const characters = ['san.vrm', 'deric.vrm', 'carol.vrm', 'rafa.vrm'];

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '40px', boxSizing: 'border-box', pointerEvents: 'none'
        }}>
            {/* Header */}
            <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{
                    color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px',
                    textShadow: '0 2px 10px rgba(168, 85, 247, 0.8)', fontSize: '2rem'
                }}>
                    Personagens
                </h2>
                <button 
                    onClick={() => setScreen('MENU')}
                    style={{
                        padding: '10px 30px', background: 'rgba(0,0,0,0.5)', color: '#fff',
                        border: '1px solid #666', borderRadius: '10px', cursor: 'pointer'
                    }}
                >
                    VOLTAR
                </button>
            </div>

            {/* Bottom Carousel / Selection */}
            <div style={{ 
                pointerEvents: 'auto', display: 'flex', gap: '20px', overflowX: 'auto', 
                padding: '20px 0', width: '100%' 
            }}>
                {characters.map((char) => {
                    const isActive = activeModel === char;
                    return (
                        <div
                            key={char}
                            onClick={() => setActiveModel(char)}
                            style={{
                                position: 'relative',
                                padding: '20px',
                                minWidth: '200px',
                                height: '320px',
                                background: `linear-gradient(to top, rgba(10,5,20,1) 0%, rgba(10,5,20,0.5) 40%, transparent 100%), url('/images/characters/${char.replace('.vrm', '')}.jpg') center/cover no-repeat`,
                                border: `2px solid ${isActive ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '16px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isActive ? 'translateY(-15px) scale(1.05)' : 'translateY(0) scale(1)',
                                boxShadow: isActive ? '0 15px 30px rgba(168,85,247,0.4), inset 0 0 20px rgba(168,85,247,0.2)' : '0 5px 15px rgba(0,0,0,0.5)',
                                overflow: 'hidden'
                            }}
                        >
                            {isActive && (
                                <div style={{ 
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                    background: 'radial-gradient(circle at top, rgba(168,85,247,0.3) 0%, transparent 70%)',
                                    pointerEvents: 'none'
                                }}></div>
                            )}
                            
                            <h3 style={{ 
                                color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', 
                                fontSize: '1.4rem', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                                zIndex: 1
                            }}>
                                {char.replace('.vrm', '')}
                            </h3>
                            <div style={{ 
                                color: isActive ? '#d8b4fe' : '#888', fontSize: '0.8rem', marginTop: '8px',
                                fontWeight: 'bold', letterSpacing: '1px', zIndex: 1,
                                background: isActive ? 'rgba(168,85,247,0.2)' : 'rgba(0,0,0,0.5)',
                                padding: '4px 12px', borderRadius: '12px',
                                border: isActive ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {isActive ? 'EQUIPADO' : 'SELECIONAR'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
