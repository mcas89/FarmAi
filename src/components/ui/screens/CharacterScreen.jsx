import React, { useRef, useState, useEffect } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Backdrop, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

const CHAR_NAMES = {
    'san.vrm': 'Samy',
    'deric.vrm': 'Marc',
    'carol.vrm': 'Carol',
    'rafa.vrm': 'Rafa'
};

const CHAR_REQUIREMENTS = {
    'san.vrm': { price: 0, level: 1 },
    'deric.vrm': { price: 0, level: 1 },
    'carol.vrm': { price: 1000, level: 5 },
    'rafa.vrm': { price: 1000, level: 5 }
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
            
            // Configurações de esqueleto idênticas ao "arms_down_pose" do personagem principal
            if (vrmData.humanoid) {
                const setBone = (name, x, y, z) => {
                    const bone = vrmData.humanoid.getNormalizedBoneNode(name);
                    if (bone) {
                        if (x !== undefined) bone.rotation.x = x;
                        if (y !== undefined) bone.rotation.y = y;
                        if (z !== undefined) bone.rotation.z = z;
                    }
                };
                
                // Hips e Ombros
                setBone('hips', 0, -0.27, 0);
                setBone('leftShoulder', 0, 0, -0.39);
                setBone('rightShoulder', 0, 0.09, 0.36);
                
                // Braços
                setBone('leftUpperArm', 0, 0, -0.6);
                setBone('leftLowerArm', 0, 0, -0.24);
                setBone('rightUpperArm', 0, 0, 0.65);
                setBone('rightLowerArm', 0, 0, 0.33);
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
            
            // Efeito de respiração suave (LifeAnimation)
            const time = state.clock.elapsedTime;
            const breath = Math.sin(time * 2.0) * 0.03;
            const chestBreath = Math.sin(time * 2.0) * 0.02;
            
            vrm.scene.position.y = Math.sin(time * 2) * 0.015; // Leve flutuação do corpo
            
            if (vrm.humanoid) {
                const chest = vrm.humanoid.getNormalizedBoneNode('chest');
                const leftShoulder = vrm.humanoid.getNormalizedBoneNode('leftShoulder');
                const rightShoulder = vrm.humanoid.getNormalizedBoneNode('rightShoulder');
                
                if (chest) chest.rotation.x = chestBreath;
                if (leftShoulder) leftShoulder.rotation.z = -breath;
                if (rightShoulder) rightShoulder.rotation.z = breath;
            }
            
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
    const { activeModel, setActiveModel, unlockedCharacters } = usePlayerSystem();
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
        
        const isUnlocked = unlockedCharacters.includes(char);
        const req = CHAR_REQUIREMENTS[char];

        if (!isUnlocked) {
            const aura = useAuraSystem.getState().aura;
            const level = 1 + Math.floor(aura / 500);
            
            if (level < req.level) {
                alert(`Personagem bloqueado!\n\nVocê precisa alcançar o Nível ${req.level} para usar este personagem.\n(Seu nível atual: ${level})`);
                return;
            }
            
            const diamonds = useUISystem.getState().playerStats.diamonds || 0;
            if (diamonds < req.price) {
                alert(`AuraCash insuficiente!\n\nVocê precisa de ${req.price} AuraCash para comprar este personagem.\n(Seu saldo atual: ${diamonds})`);
                return;
            }
            
            // Compra o personagem
            const confirmBuy = window.confirm(`Deseja comprar ${CHAR_NAMES[char]} por ${req.price} AuraCash?`);
            if (!confirmBuy) return;
            
            useUISystem.getState().updateStats({ diamonds: diamonds - req.price });
            const newUnlocked = [...unlockedCharacters, char];
            usePlayerSystem.setState({ unlockedCharacters: newUnlocked });
        }

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
            const currentUnlocked = pSys.usePlayerSystem.getState().unlockedCharacters;
            
            dbSys.useDatabaseSystem.getState().saveGameState(
                pos, comboCount, char, aura, diamonds, maxCombo, dailyQuests, lastResetDate, weeklyAura, undefined, achievements, currentUnlocked
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
            padding: '20px 20px 0 20px', boxSizing: 'border-box', pointerEvents: 'auto',
            background: 'radial-gradient(circle at center, #2e1065, #05050a)'
        }}>
            {/* Canvas 3D Dedicado Exclusivo para Preview */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'auto' }}>
                <Canvas camera={{ position: [0, 1.0, 7.0], fov: 40 }}>
                    <ambientLight intensity={0.7} />
                    <spotLight position={[2, 4, 3]} angle={0.5} penumbra={1} intensity={1.5} color="#d8b4fe" />
                    <spotLight position={[-2, -1, -2]} angle={0.8} penumbra={1} intensity={0.5} color="#4ade80" />
                    
                    {/* Cenário de Estúdio */}
                    <Backdrop
                        floor={1.5}
                        segments={20}
                        position={[0, -0.3, -2]}
                        scale={[20, 10, 5]}
                    >
                        <meshStandardMaterial color="#6b21a8" roughness={0.8} />
                    </Backdrop>
                    <ContactShadows 
                        position={[0, -0.28, 0]} 
                        opacity={0.8} 
                        scale={10} 
                        blur={2} 
                        far={4} 
                    />

                    <PreviewAvatar key={activeModel} url={activeModel} />
                    <OrbitControls 
                        enablePan={false} 
                        enableZoom={true} 
                        minDistance={2.0}
                        maxDistance={12.0}
                        target={[0, 0.9, 0]}
                        maxPolarAngle={Math.PI / 2 + 0.2}
                        minPolarAngle={0.5}
                        autoRotate={false}
                    />
                </Canvas>
            </div>
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                pointerEvents: 'none', zIndex: -1
            }} />

            {/* Header */}
            <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <div>
                    <h2 style={{
                        color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '3px',
                        textShadow: '0 0 10px rgba(168, 85, 247, 0.8)', fontSize: '1.2rem', fontWeight: '900'
                    }}>
                        Personagens
                    </h2>
                    <div style={{ color: '#d8b4fe', fontSize: '0.7rem', letterSpacing: '1px', fontWeight: 'bold' }}>
                        ESCOLHA SEU AVATAR
                    </div>
                </div>
                <button 
                    onClick={handleBack}
                    style={{
                        padding: '8px 20px', background: 'rgba(255,255,255,0.05)', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 'bold', backdropFilter: 'blur(10px)', transition: 'all 0.2s', letterSpacing: '1px', fontSize: '0.8rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    VOLTAR
                </button>
            </div>

            {/* Bottom Carousel / Selection */}
            <div style={{ 
                pointerEvents: 'auto', display: 'flex', gap: '15px', overflowX: 'auto', 
                padding: '20px 0', width: '100%', boxSizing: 'border-box', zIndex: 1
            }}>
                <style>{`
                    .char-card::-webkit-scrollbar { display: none; }
                    .char-card:hover { transform: translateY(-5px); background: rgba(168,85,247,0.1) !important; border-color: rgba(168,85,247,0.5) !important; }
                    
                    @keyframes borderPulse {
                        0%, 100% { box-shadow: 0 0 10px rgba(168,85,247,0.4), inset 0 0 10px rgba(168,85,247,0.2); }
                        50% { box-shadow: 0 0 20px rgba(168,85,247,0.8), inset 0 0 20px rgba(168,85,247,0.4); }
                    }
                `}</style>
                {characters.map((char) => {
                    const isPreviewing = activeModel === char;
                    const isEquipped = savedModel === char;
                    const isUnlocked = unlockedCharacters.includes(char);
                    const req = CHAR_REQUIREMENTS[char];

                    let btnText = 'EQUIPAR';
                    let btnStyle = { 
                        background: isPreviewing ? 'linear-gradient(90deg, #a855f7, #6b21a8)' : 'rgba(255,255,255,0.05)',
                        color: '#fff', border: isPreviewing ? 'none' : '1px solid rgba(255,255,255,0.2)' 
                    };

                    if (isEquipped) {
                        btnText = 'EQUIPADO ✓';
                        btnStyle = { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.4)' };
                    } else if (!isUnlocked) {
                        btnText = req.price > 0 ? `💎 ${req.price}` : 'DESBLOQUEAR';
                        btnStyle = { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.5)' };
                    }

                    return (
                        <div
                            key={char}
                            className="char-card"
                            onClick={() => handlePreview(char)}
                            style={{
                                position: 'relative',
                                padding: '10px',
                                minWidth: '80px',
                                height: '110px',
                                background: isPreviewing ? 'rgba(20, 15, 30, 0.6)' : 'rgba(10, 5, 20, 0.4)',
                                border: `1px solid ${isPreviewing ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isPreviewing ? 'translateY(-5px)' : 'translateY(0)',
                                boxShadow: isPreviewing ? 'none' : '0 2px 10px rgba(0,0,0,0.5)',
                                animation: isPreviewing ? 'borderPulse 2s infinite' : 'none',
                                backdropFilter: 'blur(10px)',
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
                            
                            <div style={{ textAlign: 'center', zIndex: 1, marginTop: '5px' }}>
                                <h3 style={{ 
                                    color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', 
                                    fontSize: '0.8rem', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                                }}>
                                    {CHAR_NAMES[char]}
                                </h3>
                                {!isUnlocked && (
                                    <div style={{ color: '#fca5a5', fontSize: '0.55rem', marginTop: '3px', fontWeight: 'bold' }}>
                                        NÍVEL {req.level}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={(e) => handleEquip(char, e)}
                                style={{ 
                                    zIndex: 1, width: '100%', padding: '6px', borderRadius: '8px',
                                    fontWeight: '900', letterSpacing: '0px', fontSize: '0.55rem',
                                    cursor: isEquipped ? 'default' : 'pointer', transition: 'all 0.2s',
                                    boxShadow: isPreviewing && !isEquipped && isUnlocked ? '0 5px 15px rgba(168,85,247,0.4)' : 'none',
                                    ...btnStyle
                                }}
                            >
                                {btnText}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
