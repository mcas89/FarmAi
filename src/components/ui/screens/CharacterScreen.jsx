import React, { useRef, useState, useEffect } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { Diamond, Lock, CheckCircle, ShoppingCart, X, AlertCircle } from 'lucide-react';
import { getPlayerLevel } from '../../../systems/progressionRules';

// ============================================================
// BUG #5 FIX — Configuração centralizada de personagens.
// Para adicionar novos personagens, basta incluir um novo
// objeto neste array. Nenhuma outra parte do código precisa mudar.
// ============================================================
const CHARACTERS = [
    { file: 'san.vrm',   name: 'Samy',  price: 0,    level: 1  },
    { file: 'deric.vrm', name: 'Marc',  price: 0,    level: 1  },
    { file: 'carol.vrm', name: 'Carol', price: 1000, level: 5  },
    { file: 'rafa.vrm',  name: 'Rafa',  price: 1000, level: 5  },
    // Adicione novos personagens aqui ↓
    // { file: 'novo.vrm', name: 'Novo', price: 2000, level: 10 },
];

// ============================================================
// BUG #3 FIX — Preview Avatar com cleanup correto via ref.
// O VRM antigo é descartado da memória antes de carregar o novo.
// ============================================================
function PreviewAvatar({ url }) {
    const vrmRef = useRef(null);
    const [, forceRender] = useState(0);

    useEffect(() => {
        let active = true;

        const loader = new GLTFLoader();
        loader.register(parser => new VRMLoaderPlugin(parser));

        loader.load(`/models/${url}`, gltf => {
            if (!active) return;
            const newVrm = gltf.userData.vrm;
            newVrm.scene.rotation.y = Math.PI;

            if (newVrm.humanoid) {
                const setBone = (name, x, y, z) => {
                    const bone = newVrm.humanoid.getNormalizedBoneNode(name);
                    if (!bone) return;
                    if (x !== undefined) bone.rotation.x = x;
                    if (y !== undefined) bone.rotation.y = y;
                    if (z !== undefined) bone.rotation.z = z;
                };
                setBone('hips',           0, -0.27, 0);
                setBone('leftShoulder',   0,  0,   -0.39);
                setBone('rightShoulder',  0,  0.09, 0.36);
                setBone('leftUpperArm',   0,  0,   -0.6);
                setBone('leftLowerArm',   0,  0,   -0.24);
                setBone('rightUpperArm',  0,  0,    0.65);
                setBone('rightLowerArm',  0,  0,    0.33);
            }

            // Descarta o VRM anterior da GPU antes de substituir
            if (vrmRef.current) {
                vrmRef.current.scene.traverse(child => {
                    if (child.isMesh) {
                        child.geometry?.dispose();
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(m => m?.dispose());
                    }
                });
            }

            vrmRef.current = newVrm;
            forceRender(n => n + 1); // força re-render para mostrar o novo VRM
        });

        return () => {
            active = false;
            // Cleanup total ao desmontar o componente
            if (vrmRef.current) {
                vrmRef.current.scene.traverse(child => {
                    if (child.isMesh) {
                        child.geometry?.dispose();
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(m => m?.dispose());
                    }
                });
                vrmRef.current = null;
            }
        };
    }, [url]);

    useFrame((state, delta) => {
        const vrm = vrmRef.current;
        if (!vrm) return;

        vrm.update(delta);
        const t = state.clock.elapsedTime;

        // Leve flutuação do corpo (respiração)
        vrm.scene.position.y = Math.sin(t * 2) * 0.015;

        if (vrm.humanoid) {
            const breath = Math.sin(t * 2.0) * 0.02;
            const chest = vrm.humanoid.getNormalizedBoneNode('chest');
            const ls    = vrm.humanoid.getNormalizedBoneNode('leftShoulder');
            const rs    = vrm.humanoid.getNormalizedBoneNode('rightShoulder');
            if (chest) chest.rotation.x = breath;
            if (ls)    ls.rotation.z    = -breath;
            if (rs)    rs.rotation.z    =  breath;
        }

        // Piscar aleatório
        if (vrm.expressionManager) {
            const blink = vrm.expressionManager.getValue('blink') || 0;
            if (Math.random() < 0.008 && blink === 0) {
                vrm.expressionManager.setValue('blink', 1);
                setTimeout(() => vrm.expressionManager?.setValue('blink', 0), 140);
            }
        }
    });

    return vrmRef.current ? <primitive object={vrmRef.current.scene} /> : null;
}

// ============================================================
// BUG #4 FIX — Modal customizado substitui window.alert/confirm
// ============================================================
function CustomModal({ modal, onClose }) {
    if (!modal) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a0e30, #0d0715)',
                border: '1px solid rgba(168,85,247,0.4)',
                borderRadius: '16px', padding: '28px 32px',
                maxWidth: '360px', width: '90%',
                boxShadow: '0 0 40px rgba(168,85,247,0.3)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <AlertCircle size={20} color="#a855f7" />
                    <span style={{ color: '#fff', fontWeight: '900', fontSize: '1rem', letterSpacing: '1px' }}>
                        {modal.title}
                    </span>
                </div>
                <p style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 24px' }}>
                    {modal.message}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    {modal.type === 'confirm' && (
                        <button
                            onClick={onClose}
                            style={{
                                padding: '9px 20px', borderRadius: '8px', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.05)', color: '#aaa',
                                border: '1px solid rgba(255,255,255,0.15)', fontWeight: 'bold', fontSize: '0.8rem'
                            }}
                        >
                            CANCELAR
                        </button>
                    )}
                    <button
                        onClick={() => { modal.onConfirm?.(); onClose(); }}
                        style={{
                            padding: '9px 20px', borderRadius: '8px', cursor: 'pointer',
                            background: 'linear-gradient(90deg, #a855f7, #6b21a8)',
                            color: '#fff', border: 'none', fontWeight: '900', fontSize: '0.8rem',
                            boxShadow: '0 4px 15px rgba(168,85,247,0.4)'
                        }}
                    >
                        {modal.type === 'confirm' ? 'CONFIRMAR' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// TELA PRINCIPAL
// ============================================================
export function CharacterScreen() {
    const setScreen      = useUISystem(state => state.setScreen);
    const updateStats    = useUISystem(state => state.updateStats);
    const { activeModel, setActiveModel, unlockedCharacters } = usePlayerSystem();

    // BUG #6 FIX — usa o activeModel do store como fonte de verdade para "equipado"
    // Guardamos no ref o valor real no momento de abertura da tela
    const equippedModel  = useRef(activeModel);
    const [previewModel, setPreviewModel] = useState(activeModel);

    // BUG #4 FIX — estado do modal customizado
    const [modal, setModal] = useState(null);

    const closeModal = () => setModal(null);

    const showAlert = (title, message) =>
        setModal({ type: 'alert', title, message, onConfirm: null });

    const showConfirm = (title, message, onConfirm) =>
        setModal({ type: 'confirm', title, message, onConfirm });

    // Clique no card — apenas visualiza
    const handlePreview = (char) => {
        setPreviewModel(char);
        setActiveModel(char);
    };

    // Clique em EQUIPAR / COMPRAR
    const handleEquip = (char, e) => {
        e.stopPropagation();

        const charConfig = CHARACTERS.find(c => c.file === char);
        if (!charConfig) return;

        const isUnlocked = unlockedCharacters.includes(char);

        if (!isUnlocked) {
            // BUG #1 FIX — usa progressionRules em vez de fórmula hardcoded
            const currentAura  = useAuraSystem.getState().aura;
            const currentLevel = getPlayerLevel(currentAura);

            if (currentLevel < charConfig.level) {
                showAlert(
                    'Personagem Bloqueado',
                    `Você precisa alcançar o Nível ${charConfig.level} para usar ${charConfig.name}.\n\nSeu nível atual: ${currentLevel}.`
                );
                return;
            }

            const diamonds = useUISystem.getState().playerStats.diamonds || 0;
            if (diamonds < charConfig.price) {
                showAlert(
                    'AuraCash Insuficiente',
                    `Você precisa de ${charConfig.price} AuraCash para comprar ${charConfig.name}.\n\nSeu saldo: ${diamonds} AuraCash.`
                );
                return;
            }

            // Confirmação de compra
            showConfirm(
                'Confirmar Compra',
                `Deseja comprar ${charConfig.name} por ${charConfig.price} AuraCash?`,
                () => _doEquip(char, charConfig, true)
            );
            return;
        }

        _doEquip(char, charConfig, false);
    };

    // Executa a troca/compra efetiva
    const _doEquip = (char, charConfig, isBuying) => {
        if (isBuying) {
            const diamonds    = useUISystem.getState().playerStats.diamonds || 0;
            const newDiamonds = diamonds - charConfig.price;
            updateStats({ diamonds: newDiamonds });
            const newUnlocked = [...usePlayerSystem.getState().unlockedCharacters, char];
            usePlayerSystem.setState({ unlockedCharacters: newUnlocked });
        }

        setActiveModel(char);
        setPreviewModel(char);
        equippedModel.current = char;

        // Salva tudo no Firebase
        Promise.all([
            import('../../../systems/usePlayerSystem'),
            import('../../../systems/useAuraSystem'),
            import('../../../systems/useDatabaseSystem'),
            import('../../../systems/useQuestSystem'),
            import('../../../systems/useAchievementSystem')
        ]).then(([pSys, aSys, dbSys, qSys, achSys]) => {
            const pos              = pSys.usePlayerSystem.getState().position;
            const { comboCount, maxCombo, aura, weeklyAura } = aSys.useAuraSystem.getState();
            const diamonds         = useUISystem.getState().playerStats.diamonds || 0;
            const { dailyQuests, lastResetDate } = qSys.useQuestSystem.getState();
            const achievements     = achSys.useAchievementSystem.getState().getSavableData();
            const currentUnlocked  = pSys.usePlayerSystem.getState().unlockedCharacters;

            dbSys.useDatabaseSystem.getState().saveGameState(
                pos, comboCount, char, aura, diamonds,
                maxCombo, dailyQuests, lastResetDate,
                weeklyAura, undefined, achievements, currentUnlocked
            );
        });
    };

    const handleBack = () => {
        // Reverte visualização se não salvou
        if (activeModel !== equippedModel.current) {
            setActiveModel(equippedModel.current);
        }
        setScreen('MENU');
    };

    return (
        <>
            <style>{`
                @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity:0; } to { transform: translateY(0); opacity:1; } }
                @keyframes borderPulse {
                    0%,100% { box-shadow: 0 0 12px rgba(168,85,247,0.5); }
                    50%      { box-shadow: 0 0 25px rgba(168,85,247,0.9); }
                }
                .char-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
                .char-card:hover { transform: translateY(-4px) scale(1.02) !important; }
                .char-scroll::-webkit-scrollbar { height: 4px; }
                .char-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .char-scroll::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.4); border-radius:4px; }
            `}</style>

            {/* Modal customizado */}
            <CustomModal modal={modal} onClose={closeModal} />

            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                background: 'radial-gradient(ellipse at 50% 30%, #2e1065 0%, #05050a 70%)',
                pointerEvents: 'auto', overflow: 'hidden'
            }}>
                {/* ── Canvas 3D de Preview ── */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <Canvas
                        dpr={[0.8, 1]}          /* Performance: limita pixel ratio */
                        gl={{ antialias: false, powerPreference: 'low-power' }}
                        camera={{ position: [0, 1.0, 6.5], fov: 42 }}
                    >
                        {/* Iluminação simplificada para melhor performance */}
                        <ambientLight intensity={0.8} />
                        <directionalLight position={[3, 5, 3]}  intensity={1.2} color="#d8b4fe" />
                        <directionalLight position={[-3, 1, -2]} intensity={0.4} color="#818cf8" />

                        {/* Chão simples em vez de Backdrop pesado */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.28, 0]} receiveShadow>
                            <circleGeometry args={[5, 48]} />
                            <meshStandardMaterial color="#2e1065" roughness={1} metalness={0} />
                        </mesh>

                        <ContactShadows
                            position={[0, -0.27, 0]}
                            opacity={0.6}
                            scale={6}
                            blur={2.5}
                            far={3}
                        />

                        <PreviewAvatar url={previewModel} />

                        <OrbitControls
                            enablePan={false}
                            enableZoom={true}
                            minDistance={2.5}
                            maxDistance={10}
                            target={[0, 0.9, 0]}
                            maxPolarAngle={Math.PI / 2 + 0.15}
                            minPolarAngle={0.4}
                        />
                    </Canvas>
                </div>

                {/* Gradiente de fade na base (sobre o canvas) */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, width: '100%', height: '45%',
                    background: 'linear-gradient(to top, rgba(5,5,10,0.97) 30%, transparent)',
                    pointerEvents: 'none', zIndex: 1
                }} />

                {/* ── Header ── */}
                <div style={{
                    position: 'relative', zIndex: 2,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '22px 24px 0'
                }}>
                    <div>
                        <h2 style={{
                            color: '#fff', margin: 0, textTransform: 'uppercase',
                            letterSpacing: '3px', fontSize: '1.3rem', fontWeight: '900',
                            textShadow: '0 0 14px rgba(168,85,247,0.9)'
                        }}>
                            Personagens
                        </h2>
                        <div style={{ color: '#a855f7', fontSize: '0.65rem', letterSpacing: '2px', fontWeight: 'bold', marginTop: '3px' }}>
                            ESCOLHA SEU AVATAR
                        </div>
                    </div>

                    <button
                        onClick={handleBack}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 18px', background: 'rgba(255,255,255,0.05)',
                            color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold',
                            backdropFilter: 'blur(10px)', fontSize: '0.75rem', letterSpacing: '1px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                        <X size={14} /> VOLTAR
                    </button>
                </div>

                {/* ── Nome e info do personagem em preview ── */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center', zIndex: 2, pointerEvents: 'none'
                }}>
                    {(() => {
                        const cfg = CHARACTERS.find(c => c.file === previewModel);
                        // BUG #6 FIX — "equipado" reflete o estado real do store
                        const isEquipped = equippedModel.current === previewModel;
                        return cfg ? (
                            <div style={{ animation: 'slideUp 0.3s ease' }}>
                                <div style={{
                                    color: '#fff', fontSize: '1.6rem', fontWeight: '900',
                                    textShadow: '0 0 20px rgba(168,85,247,0.8)', letterSpacing: '2px'
                                }}>
                                    {cfg.name}
                                </div>
                                {isEquipped && (
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)',
                                        borderRadius: '20px', padding: '3px 12px', marginTop: '6px',
                                        color: '#34d399', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '1px'
                                    }}>
                                        <CheckCircle size={10} /> EQUIPADO
                                    </div>
                                )}
                            </div>
                        ) : null;
                    })()}
                </div>

                {/* ── Carousel de Cards ── */}
                <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto', padding: '0 16px 20px' }}>
                    <div
                        className="char-scroll"
                        style={{
                            display: 'flex', gap: '12px', overflowX: 'auto',
                            paddingBottom: '6px', paddingTop: '4px',
                        }}
                    >
                        {CHARACTERS.map((char) => {
                            const isPreviewing = previewModel === char.file;
                            // BUG #6 FIX — isEquipped baseado no ref (estado real no Firebase)
                            const isEquipped   = equippedModel.current === char.file;
                            const isUnlocked   = unlockedCharacters.includes(char.file);

                            // Estilo do botão de ação
                            let btnLabel, btnStyle;
                            if (isEquipped) {
                                btnLabel = <><CheckCircle size={10} /> EQUIPADO</>;
                                btnStyle = { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.4)' };
                            } else if (!isUnlocked) {
                                btnLabel = char.price > 0
                                    ? <><Diamond size={9} /> {char.price}</>
                                    : <><Lock size={9} /> LVL {char.level}</>;
                                btnStyle = { background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)' };
                            } else {
                                btnLabel = <><ShoppingCart size={9} /> EQUIPAR</>;
                                btnStyle = {
                                    background: isPreviewing ? 'linear-gradient(90deg,#a855f7,#6b21a8)' : 'rgba(255,255,255,0.07)',
                                    color: '#fff', border: isPreviewing ? 'none' : '1px solid rgba(255,255,255,0.15)'
                                };
                            }

                            return (
                                <div
                                    key={char.file}
                                    className="char-card"
                                    onClick={() => handlePreview(char.file)}
                                    style={{
                                        minWidth: '90px', height: '110px',
                                        padding: '10px 8px',
                                        background: isPreviewing
                                            ? 'rgba(30,15,50,0.85)'
                                            : 'rgba(10,5,20,0.65)',
                                        border: `1px solid ${isPreviewing ? '#a855f7' : isEquipped ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.1)'}`,
                                        borderRadius: '14px', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column',
                                        justifyContent: 'space-between', alignItems: 'center',
                                        backdropFilter: 'blur(14px)',
                                        transform: isPreviewing ? 'translateY(-5px)' : 'translateY(0)',
                                        animation: isPreviewing ? 'borderPulse 2s infinite' : 'none',
                                        position: 'relative', overflow: 'hidden',
                                        flexShrink: 0
                                    }}
                                >
                                    {/* Brilho interno */}
                                    {isPreviewing && (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'radial-gradient(circle at center, rgba(168,85,247,0.18) 0%, transparent 70%)',
                                            pointerEvents: 'none'
                                        }} />
                                    )}

                                    {/* Nome */}
                                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                                        <div style={{
                                            color: isPreviewing ? '#d8b4fe' : isEquipped ? '#34d399' : '#fff',
                                            fontWeight: '900', fontSize: '0.78rem',
                                            textTransform: 'uppercase', letterSpacing: '1px'
                                        }}>
                                            {char.name}
                                        </div>
                                        {!isUnlocked && (
                                            <div style={{ color: '#fca5a5', fontSize: '0.5rem', marginTop: '2px', fontWeight: 'bold' }}>
                                                NV. {char.level}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botão de ação */}
                                    <button
                                        onClick={(e) => handleEquip(char.file, e)}
                                        style={{
                                            zIndex: 1, width: '100%',
                                            padding: '5px 4px', borderRadius: '8px',
                                            fontWeight: '900', fontSize: '0.5rem',
                                            letterSpacing: '0.5px',
                                            cursor: isEquipped ? 'default' : 'pointer',
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', gap: '4px',
                                            transition: 'all 0.2s',
                                            ...btnStyle
                                        }}
                                    >
                                        {btnLabel}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
