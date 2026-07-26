import React, { useRef, useState, useEffect } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

const CHAR_NAMES = {
    'san.vrm': 'Samy',
    'deric.vrm': 'Marc',
    'carol.vrm': 'Carol',
    'rafa.vrm': 'Rafa'
};

// Avatar simplificado para o menu, sem lógica de combate ou movimento
function PreviewAvatar({ url }) {
    const [vrm, setVrm] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        loader.load(`/models/${url}`, (gltf) => {
            if (!isMounted) return;
            const vrmData = gltf.userData.vrm;
            vrmData.scene.rotation.y = Math.PI; 
            // Levanta os braços um pouco para pose mais natural (Pose A)
            if (vrmData.humanoid) {
                const leftArm = vrmData.humanoid.getNormalizedBoneNode('leftUpperArm');
                const rightArm = vrmData.humanoid.getNormalizedBoneNode('rightUpperArm');
                if (leftArm) leftArm.rotation.z = 1.1;
                if (rightArm) rightArm.rotation.z = -1.1;
            }
            setVrm(vrmData);
        });
        return () => { 
            isMounted = false;
            if (vrm) {
                vrm.scene.traverse(c => {
                    if (c.isMesh) { c.geometry?.dispose(); c.material?.dispose?.(); }
                });
            }
        };
    }, [url]);

    useFrame((state, delta) => {
        if (vrm) {
            vrm.update(delta);
            // Efeito de respiração suave
            vrm.scene.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.015;
            
            // Piscar os olhos aleatoriamente
            if (vrm.expressionManager) {
                const blinkValue = vrm.expressionManager.getValue('blink') || 0;
                if (Math.random() < 0.01 && blinkValue === 0) {
                    vrm.expressionManager.setValue('blink', 1);
                    setTimeout(() => { if (vrm.expressionManager) vrm.expressionManager.setValue('blink', 0) }, 150);
                }
            }
        }
    });

    return vrm ? <primitive object={vrm.scene} /> : null;
}

export function CharacterScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const { activeModel, setActiveModel } = usePlayerSystem();
    const characters = ['san.vrm', 'deric.vrm', 'carol.vrm', 'rafa.vrm'];

    // Guardamos o modelo original para reverter caso o usuário saia sem salvar
    const originalModel = useRef(activeModel);
    // Controlamos qual modelo está salvo vs. qual está sendo "visualizado" agora
    const [savedModel, setSavedModel] = useState(activeModel);

    // Quando clica no card, apenas mudamos o modelo de visualização
    const handlePreview = (char) => {
        setActiveModel(char);
    };

    // Quando clica no botão EQUIPAR, salva no banco de dados
    const handleEquip = (char, e) => {
        e.stopPropagation(); // Evita acionar o click do card
        setActiveModel(char);
        setSavedModel(char);
        originalModel.current = char;

        Promise.all([
            import('../../../systems/usePlayerSystem'),
            import('../../../systems/useAuraSystem'),
            import('../../../systems/useDatabaseSystem'),
            import('../../../systems/useQuestSystem'),
            import('../../../systems/useAchievementSystem')
        ]).then(([pSys, aSys, dbSys, qSys, achSys]) => {
            const pos = pSys.usePlayerSystem.getState().position;
            const { comboCount, maxCombo, aura, weeklyAura } = aSys.useAuraSystem.getState();
            const diamonds = useUISystem.getState().playerStats.diamonds || 0;
            const { dailyQuests, lastResetDate } = qSys.useQuestSystem.getState();
            const achievements = achSys.useAchievementSystem.getState().getSavableData();
            
            dbSys.useDatabaseSystem.getState().saveGameState(
                pos, comboCount, char, aura, diamonds, maxCombo, dailyQuests, lastResetDate, weeklyAura, undefined, achievements
            );
        });
    };

    const handleBack = () => {
        // Se visualizou algo mas não salvou, reverte pro original no sistema
        if (activeModel !== savedModel) {
            setActiveModel(originalModel.current);
        }
        setScreen('MENU');
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '40px', boxSizing: 'border-box', pointerEvents: 'auto',
            background: '#05050a' // Fundo sólido escuro cobrindo o mapa original!
        }}>
            {/* Canvas 3D Dedicado Exclusivo para Preview */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'auto' }}>
                <Canvas camera={{ position: [0, 1.2, 2.5], fov: 40 }}>
                    <ambientLight intensity={0.7} />
                    <spotLight position={[2, 4, 3]} angle={0.5} penumbra={1} intensity={1.5} color="#d8b4fe" />
                    <spotLight position={[-2, -1, -2]} angle={0.8} penumbra={1} intensity={0.5} color="#4ade80" />
                    <PreviewAvatar key={activeModel} url={activeModel} />
                    <OrbitControls 
                        enablePan={false} 
                        enableZoom={true} 
                        minDistance={1.0}
                        maxDistance={4.0}
                        target={[0, 1.0, 0]}
                        maxPolarAngle={Math.PI / 2 + 0.2}
                        minPolarAngle={0.5}
                        autoRotate={true}
                        autoRotateSpeed={0.5}
                    />
                </Canvas>
            </div>
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                pointerEvents: 'none', zIndex: -1
            }} />

            {/* Header */}
            <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{
                        color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '4px',
                        textShadow: '0 0 20px rgba(168, 85, 247, 0.8)', fontSize: '2.5rem', fontWeight: '900'
                    }}>
                        Equipe
                    </h2>
                    <div style={{ color: '#d8b4fe', fontSize: '0.9rem', letterSpacing: '2px', fontWeight: 'bold' }}>
                        ESCOLHA SEU AVATAR PARA O METAVERSO
                    </div>
                </div>
                <button 
                    onClick={handleBack}
                    style={{
                        padding: '12px 30px', background: 'rgba(255,255,255,0.05)', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', cursor: 'pointer',
                        fontWeight: 'bold', backdropFilter: 'blur(10px)', transition: 'all 0.2s', letterSpacing: '1px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    VOLTAR
                </button>
            </div>

            {/* Bottom Carousel / Selection */}
            <div style={{ 
                pointerEvents: 'auto', display: 'flex', gap: '25px', overflowX: 'auto', 
                padding: '20px 10px', width: '100%', boxSizing: 'border-box'
            }}>
                <style>{`
                    .char-card::-webkit-scrollbar { display: none; }
                    .char-card:hover { transform: translateY(-10px); background: rgba(168,85,247,0.1) !important; border-color: rgba(168,85,247,0.5) !important; }
                    
                    @keyframes borderPulse {
                        0%, 100% { box-shadow: 0 0 15px rgba(168,85,247,0.4), inset 0 0 20px rgba(168,85,247,0.2); }
                        50% { box-shadow: 0 0 30px rgba(168,85,247,0.8), inset 0 0 40px rgba(168,85,247,0.4); }
                    }
                `}</style>
                {characters.map((char) => {
                    const isPreviewing = activeModel === char;
                    const isEquipped = savedModel === char;

                    return (
                        <div
                            key={char}
                            className="char-card"
                            onClick={() => handlePreview(char)}
                            style={{
                                position: 'relative',
                                padding: '25px',
                                minWidth: '220px',
                                height: '300px',
                                background: isPreviewing ? 'rgba(20, 15, 30, 0.6)' : 'rgba(10, 5, 20, 0.4)',
                                border: `1px solid ${isPreviewing ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isPreviewing ? 'translateY(-15px)' : 'translateY(0)',
                                boxShadow: isPreviewing ? 'none' : '0 10px 30px rgba(0,0,0,0.5)',
                                animation: isPreviewing ? 'borderPulse 2s infinite' : 'none',
                                backdropFilter: 'blur(15px)',
                                overflow: 'hidden'
                            }}
                        >
                            {isPreviewing && (
                                <div style={{ 
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                    background: 'radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
                                    pointerEvents: 'none'
                                }}></div>
                            )}
                            
                            <div style={{ textAlign: 'center', zIndex: 1, marginTop: '20px' }}>
                                <div style={{ color: isPreviewing ? '#a855f7' : '#888', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '3px', marginBottom: '8px' }}>
                                    {isPreviewing ? 'VISUALIZANDO' : 'CLIQUE PARA VER'}
                                </div>
                                <h3 style={{ 
                                    color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '4px', 
                                    fontSize: '2rem', fontWeight: '900', textShadow: '0 4px 20px rgba(0,0,0,0.8)'
                                }}>
                                    {CHAR_NAMES[char]}
                                </h3>
                            </div>

                            <button 
                                onClick={(e) => handleEquip(char, e)}
                                style={{ 
                                    zIndex: 1, width: '100%', padding: '15px', borderRadius: '14px',
                                    fontWeight: '900', letterSpacing: '1px', fontSize: '0.9rem',
                                    cursor: isEquipped ? 'default' : 'pointer', transition: 'all 0.2s',
                                    background: isEquipped ? 'rgba(52,211,153,0.1)' : (isPreviewing ? 'linear-gradient(90deg, #a855f7, #6b21a8)' : 'rgba(255,255,255,0.05)'),
                                    color: isEquipped ? '#34d399' : '#fff',
                                    border: isEquipped ? '1px solid rgba(52,211,153,0.4)' : (isPreviewing ? 'none' : '1px solid rgba(255,255,255,0.2)'),
                                    boxShadow: isPreviewing && !isEquipped ? '0 5px 20px rgba(168,85,247,0.4)' : 'none'
                                }}
                            >
                                {isEquipped ? 'EQUIPADO ✓' : 'EQUIPAR'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
