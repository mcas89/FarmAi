import React from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { AuracashIcon } from '../AuracashIcon';
import { CheckCircle, ShoppingCart, X } from 'lucide-react';

export const CHARACTERS = [
    { file: 'Carol.vrm', name: 'Carol', image: '/images/characters/Carol.png', price: 0, level: 1, desc: 'Jardineira novata cheia de energia e vontade de cultivar a melhor fazenda.' },
    { file: 'Eric.vrm',  name: 'Eric',  image: '/images/characters/Eric.png',  price: 0, level: 1, desc: 'Especialista em magias da terra e solo sagrado.' },
    { file: 'dan.vrm',   name: 'Dan',   image: '/images/characters/Dan.png',   price: 1200, level: 2, desc: 'Veterano do campo. Carrega consigo a sabedoria das antigas gerações de fazendeiros.' },
    { file: 'cris.vrm',  name: 'Cris',  image: '/images/characters/Cris.png',  price: 1700, level: 3, desc: 'Um talento nato para o cultivo rápido e eficiente.' },
    { file: 'gui.vrm',   name: 'Gui',   image: '/images/characters/Gui.png',   price: 2000, level: 4, desc: 'Sempre focado e muito ágil. Gosta de planejar bem as plantações.' },
    { file: 'rafa.vrm',  name: 'Rafa',  image: '/images/characters/Rafa.png',  price: 3000, level: 5, desc: 'Rápido e destemido. A lenda das colheitas de outono.' },
    { file: 'jack.vrm',  name: 'Jack',  image: '/images/characters/Jack.png',  price: 3500, level: 6, desc: 'O mestre da colheita e lenda entre os jardineiros de elite.' },
    { file: 'kelly.vrm', name: 'Kelly', image: '/images/characters/Kelly.png', price: 3900, level: 7, desc: 'Especialista em botânica avançada. Dizem que as plantas crescem mais rápido com ela.' },
    { file: 'tio.vrm',   name: 'Tio',   image: '/images/characters/Tio.png',   price: 4000, level: 8, desc: 'Experiência inigualável. Consegue cultivar nas piores condições.' },
    { file: 'nick.vrm',  name: 'Nick',  image: '/images/characters/Nick.png',  price: 4500, level: 10, desc: 'Um cultivador mítico cujos segredos poucos conhecem.' },
];

export function CharacterScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const { activeModel, setActiveModel, unlockedCharacters } = usePlayerSystem();
    const stats = useUISystem(state => state.playerStats);

    const handleSelect = async (charFile) => {
        try {
            setActiveModel(charFile);

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

            await dbSys.useDatabaseSystem.getState().saveGameState(
                pos, comboCount, charFile, aura, diamonds,
                maxCombo, dailyQuests, lastResetDate,
                weeklyAura, undefined, achievements, currentUnlocked
            );
        } catch (err) {
            console.error("❌ Erro ao selecionar personagem:", err);
        }
    };

    const myCharacters = CHARACTERS.filter(char => unlockedCharacters.includes(char.file));

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
                    touch-action: pan-y !important;
                    padding-bottom: 40px;
                }
                
                .store-grid::-webkit-scrollbar { width: 8px; }
                .store-grid::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .store-grid::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.4); border-radius: 4px; }
                
                .char-card-2d {
                    background: rgba(15, 10, 25, 0.75);
                    border: 1px solid rgba(168, 85, 247, 0.15);
                    border-radius: 16px;
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
                    height: 160px;
                    background: radial-gradient(circle at bottom, rgba(76, 29, 149, 0.4) 0%, rgba(0,0,0,0) 80%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    border-top-left-radius: 16px;
                    border-top-right-radius: 16px;
                    overflow: hidden;
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
                    flex: none;
                }
            `}</style>

            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                background: 'radial-gradient(ellipse at 50% -20%, #2e1065 0%, #05050a 100%)',
                pointerEvents: 'auto', overflow: 'hidden'
            }}>
                {/* ── HEADER MEUS PERSONAGENS ── */}
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
                            Meus Personagens
                        </h2>
                        <div style={{ color: '#d8b4fe', fontSize: '0.7rem', letterSpacing: '1px', fontWeight: 'bold' }}>
                            SELECIONE SEU AVATAR ATIVO
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* Auracash removido */}
                        
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

                {/* ── GRID DE PERSONAGENS DESBLOQUEADOS ── */}
                <div className="store-grid">
                    {myCharacters.map((char, index) => {
                        const isEquipped = activeModel === char.file;

                        let btnLabel = isEquipped ? 'EM USO' : 'SELECIONAR';
                        let btnIcon = isEquipped ? <CheckCircle size={18} /> : null;
                        let btnStyle = isEquipped 
                            ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.5)', cursor: 'default', boxShadow: '0 0 20px rgba(52,211,153,0.2)' }
                            : { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' };

                        return (
                            <div key={char.file} className="char-card-2d" style={{ animation: 'slideUp 0.4s ease-out backwards', animationDelay: `${index * 0.1}s` }}>
                                <div className="char-img-container">
                                    <img src={char.image} alt={char.name} className="char-img" />
                                </div>
                                
                                <div className="char-info">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                                            {char.name}
                                        </h3>
                                    </div>
                                    
                                    <button 
                                        onClick={() => !isEquipped && handleSelect(char.file)}
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

