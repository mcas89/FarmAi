import React, { useRef, useState } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { Diamond, Lock, CheckCircle, ShoppingCart, X, AlertCircle } from 'lucide-react';
import { getPlayerLevel } from '../../../systems/progressionRules';

// Configuração dos personagens (agora apontando para imagens 2D)
const CHARACTERS = [
    { file: 'san.vrm',   name: 'Samy',  image: '/images/characters/Samy.png', price: 0,    level: 1,  desc: 'Jardineira novata cheia de energia e vontade de cultivar a melhor fazenda.' },
    { file: 'deric.vrm', name: 'Marc',  image: '/images/characters/Marc.png', price: 0,    level: 1,  desc: 'Um rapaz focado e muito ágil. Gosta de planejar bem as plantações.' },
    { file: 'carol.vrm', name: 'Carol', image: '/images/characters/Carol.png', price: 2000, level: 5,  desc: 'Especialista em botânica avançada. Dizem que as plantas crescem mais rápido com ela.' },
    { file: 'rafa.vrm',  name: 'Rafa',  image: '/images/characters/Rafa.png', price: 2000, level: 5,  desc: 'Veterano do campo. Carrega consigo a sabedoria das antigas gerações de fazendeiros.' },
    { file: 'mary.vrm',  name: 'Mary',  image: '/images/characters/Mary.png', price: 5000, level: 10, desc: 'Mestre da colheita e lenda entre os jardineiros.' },
    { file: 'eric.vrm',  name: 'Eric',  image: '/images/characters/Eric.png', price: 5000, level: 10, desc: 'Especialista em magias da terra e solo sagrado.' },
];

function CustomModal({ modal, onClose }) {
    if (!modal) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.2s ease', pointerEvents: 'auto'
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

export function CharacterScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const updateStats = useUISystem(state => state.updateStats);
    const { activeModel, setActiveModel, unlockedCharacters } = usePlayerSystem();
    const stats = useUISystem(state => state.playerStats);

    const [modal, setModal] = useState(null);

    const closeModal = () => setModal(null);
    const showAlert = (title, message) => setModal({ type: 'alert', title, message, onConfirm: null });
    const showConfirm = (title, message, onConfirm) => setModal({ type: 'confirm', title, message, onConfirm });

    const handleAction = (charConfig) => {
        const char = charConfig.file;
        const isUnlocked = unlockedCharacters.includes(char);

        if (!isUnlocked) {
            const currentAura = useAuraSystem.getState().aura;
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

            showConfirm(
                'Confirmar Compra',
                `Deseja comprar ${charConfig.name} por ${charConfig.price} AuraCash?`,
                () => _doEquip(char, charConfig, true)
            );
            return;
        }

        _doEquip(char, charConfig, false);
    };

    const _doEquip = async (char, charConfig, isBuying) => {
        try {
            if (isBuying) {
                const diamonds = useUISystem.getState().playerStats.diamonds || 0;
                const newDiamonds = diamonds - charConfig.price;
                updateStats({ diamonds: newDiamonds });
                
                const currentUnlockedArray = usePlayerSystem.getState().unlockedCharacters;
                if (!currentUnlockedArray.includes(char)) {
                    const newUnlocked = [...currentUnlockedArray, char];
                    usePlayerSystem.setState({ unlockedCharacters: newUnlocked });
                }
            }

            setActiveModel(char);

            // Carrega sistemas dinamicamente
            const [pSys, aSys, dbSys, qSys, achSys] = await Promise.all([
                import('../../../systems/usePlayerSystem'),
                import('../../../systems/useAuraSystem'),
                import('../../../systems/useDatabaseSystem'),
                import('../../../systems/useQuestSystem'),
                import('../../../systems/useAchievementSystem')
            ]);
            
            const pos = pSys.usePlayerSystem.getState().position;
            const { comboCount, maxCombo, aura, weeklyAura } = aSys.useAuraSystem.getState();
            const diamonds = useUISystem.getState().playerStats.diamonds || 0;
            const { dailyQuests, lastResetDate } = qSys.useQuestSystem.getState();
            const achievements = achSys.useAchievementSystem.getState().getSavableData();
            const currentUnlocked = pSys.usePlayerSystem.getState().unlockedCharacters;

            // Salva no Firebase e aguarda
            await dbSys.useDatabaseSystem.getState().saveGameState(
                pos, comboCount, char, aura, diamonds,
                maxCombo, dailyQuests, lastResetDate,
                weeklyAura, undefined, achievements, currentUnlocked
            );
            
            console.log("✅ Compra/Equip executado e salvo com sucesso:", char);
        } catch (err) {
            console.error("❌ Erro ao equipar/comprar personagem:", err);
            showAlert("Erro", "Ocorreu um erro ao processar a requisição. Tente novamente.");
        }
    };

    return (
        <>
            <style>{`
                @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity:0; } to { transform: translateY(0); opacity:1; } }
                
                .store-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    padding: 16px;
                    overflow-y: auto;
                    flex: 1 1 0;
                    height: 100%;
                    min-height: 0;
                    -webkit-overflow-scrolling: touch;
                    padding-bottom: 40px;
                }
                
                .store-grid::-webkit-scrollbar { width: 8px; }
                .store-grid::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .store-grid::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.4); border-radius: 4px; }
                
                .char-card-2d {
                    background: rgba(15, 10, 25, 0.75);
                    border: 1px solid rgba(168, 85, 247, 0.15);
                    border-radius: 16px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.4);
                }
                
                .char-card-2d:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(168, 85, 247, 0.25);
                    border-color: rgba(168, 85, 247, 0.4);
                }
                
                .char-img-container {
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    background: radial-gradient(circle at bottom, rgba(76, 29, 149, 0.4) 0%, rgba(0,0,0,0) 80%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    min-height: 120px; /* Garante que não suma */
                }
                
                .char-img {
                    width: 90%;
                    height: 90%;
                    object-fit: contain;
                    transition: transform 0.3s ease;
                }
                
                .char-card-2d:hover .char-img {
                    transform: scale(1.05);
                }
                
                .char-info {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    flex-grow: 1; /* Permite crescer se o card for maior, mas não colapsa */
                }
            `}</style>

            <CustomModal modal={modal} onClose={closeModal} />

            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                background: 'radial-gradient(ellipse at 50% -20%, #2e1065 0%, #05050a 100%)',
                pointerEvents: 'auto', overflow: 'hidden'
            }}>
                {/* ── HEADER LOJA ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 30px', background: 'rgba(8,6,18,0.7)',
                    borderBottom: '1px solid rgba(168,85,247,0.2)',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(20px)', zIndex: 10
                }}>
                    <div>
                        <h2 style={{
                            color: '#fff', margin: 0, textTransform: 'uppercase',
                            letterSpacing: '2px', fontSize: '1.4rem', fontWeight: '900',
                            textShadow: '0 2px 10px rgba(168,85,247,0.6)'
                        }}>
                            Loja de Personagens
                        </h2>
                        <div style={{ color: '#d8b4fe', fontSize: '0.7rem', letterSpacing: '1px', fontWeight: 'bold' }}>
                            ESCOLHA OU COMPRE SEU AVATAR
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* Saldo do jogador */}
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', 
                            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                            padding: '10px 16px', borderRadius: '14px',
                            boxShadow: '0 0 15px rgba(52,211,153,0.15)'
                        }}>
                            <Diamond size={18} color="#34d399" />
                            <span style={{ color: '#34d399', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px' }}>
                                {(stats.diamonds || 0).toLocaleString()}
                            </span>
                        </div>
                        
                        <button
                            onClick={() => setScreen('MENU')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '11px 24px', background: 'rgba(255,255,255,0.06)',
                                color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold',
                                backdropFilter: 'blur(10px)', transition: 'background 0.2s',
                                letterSpacing: '1px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        >
                            <X size={18} /> FECHAR
                        </button>
                    </div>
                </div>

                {/* ── GRID DE PERSONAGENS ── */}
                <div className="store-grid">
                    {CHARACTERS.map((char, index) => {
                        const isEquipped = activeModel === char.file;
                        const isUnlocked = unlockedCharacters.includes(char.file);

                        let btnLabel, btnStyle, btnIcon;
                        
                        if (isEquipped) {
                            btnLabel = 'EM USO';
                            btnIcon = <CheckCircle size={18} />;
                            btnStyle = { 
                                background: 'rgba(52,211,153,0.15)', color: '#34d399', 
                                border: '1px solid rgba(52,211,153,0.5)', cursor: 'default',
                                boxShadow: '0 0 20px rgba(52,211,153,0.2)'
                            };
                        } else if (!isUnlocked) {
                            btnLabel = char.price > 0 ? `COMPRAR (${char.price})` : `LIBERA NO LV ${char.level}`;
                            btnIcon = char.price > 0 ? <Diamond size={18} /> : <Lock size={18} />;
                            btnStyle = { 
                                background: 'linear-gradient(90deg, #c026d3, #9333ea)', 
                                color: '#fff', border: 'none', 
                                boxShadow: '0 8px 20px rgba(168,85,247,0.5)' 
                            };
                        } else {
                            btnLabel = 'SELECIONAR';
                            btnIcon = <ShoppingCart size={18} />;
                            btnStyle = { 
                                background: 'rgba(255,255,255,0.1)', color: '#fff', 
                                border: '1px solid rgba(255,255,255,0.3)' 
                            };
                        }

                        return (
                            <div key={char.file} className="char-card-2d" style={{ animation: 'slideUp 0.4s ease-out backwards', animationDelay: `${index * 0.1}s` }}>
                                {/* Imagem do Personagem */}
                                <div className="char-img-container">
                                    <img src={char.image} alt={char.name} className="char-img" />
                                </div>
                                
                                {/* Informações minimalistas */}
                                <div className="char-info">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                                            {char.name}
                                        </h3>
                                        {!isUnlocked && (
                                            <span style={{ 
                                                background: 'rgba(239,68,68,0.15)', color: '#fca5a5', 
                                                padding: '2px 8px', borderRadius: '6px', 
                                                fontSize: '0.65rem', fontWeight: '900', border: '1px solid rgba(239,68,68,0.3)',
                                                letterSpacing: '1px'
                                            }}>
                                                REQ: LV {char.level}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => !isEquipped && handleAction(char)}
                                        style={{
                                            width: '100%', padding: '10px', borderRadius: '10px',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                                            fontWeight: '900', fontSize: '0.85rem', letterSpacing: '1px',
                                            cursor: isEquipped ? 'default' : 'pointer',
                                            transition: 'transform 0.1s, filter 0.2s',
                                            marginTop: 'auto',
                                            ...btnStyle
                                        }}
                                        onPointerDown={e => { if (!isEquipped) e.currentTarget.style.transform = 'scale(0.97)' }}
                                        onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                        onMouseEnter={e => { if (!isEquipped) e.currentTarget.style.filter = 'brightness(1.2)' }}
                                        onMouseLeave={e => { if (!isEquipped) e.currentTarget.style.filter = 'brightness(1)' }}
                                    >
                                        {btnIcon} {btnLabel}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
