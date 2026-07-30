import { AuracashIcon } from '../AuracashIcon';
import React, { useEffect, useState } from 'react';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem, getSafeRandomSpawn } from '../../../systems/usePlayerSystem';
import { AuraSystem } from '../../../systems/rhythm/AuraSystem';
import { DanceSystem, useDanceSystem } from '../../../systems/animation/DanceSystem';
import { Joystick } from '../Joystick';
import { 
    Settings, Trophy, Crown, 
    BarChart2, Shield, ScrollText, Gift, Briefcase, ShoppingCart, 
    Flame, Zap, Sparkles, Home, UserSquare, Sparkle, User, ChevronRight, ChevronLeft, Loader2, Map, FlaskConical, Pickaxe
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { MultiplayerChat } from '../MultiplayerChat';
import { useMultiplayerSystem } from '../../../systems/useMultiplayerSystem';

export function GameHUD() {
    const { aura, message, lastPoints, comboCount, maxCombo, hitId, isMilestone, hitSide, auraMultiplier, multiplierEndTime } = useAuraSystem();
    const stats = useUISystem(state => state.playerStats);
    const setScreen = useUISystem(state => state.setScreen);
    
    // Garante que a posição é resetada para a praça toda vez que o jogador SAIR do jogo
    useEffect(() => {
        return () => {
            usePlayerSystem.getState().setPosition(getSafeRandomSpawn());
        };
    }, []);

    const isMapMode = useUISystem(state => state.isMapMode);
    const toggleMapMode = useUISystem(state => state.toggleMapMode);
    const isOnlineMode = useUISystem(state => state.isOnlineMode);
    const onlinePlayersCount = useMultiplayerSystem(state => state.players ? Object.keys(state.players).length : 0);
    const nickname = stats.nickname || 'Marcos';
    const isDancing = useDanceSystem(state => state.isDancing);
    const inventory = useUISystem(state => state.inventory || []);
    const farmMode = useUISystem(state => state.farmMode);
    const setFarmMode = useUISystem(state => state.setFarmMode);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showFarmModal, setShowFarmModal] = useState(false);


    const [progression, setProgression] = useState(null);
    useEffect(() => {
        import('../../../systems/progressionRules').then(rules => {
            setProgression(rules);
        });
    }, []);

    const level = progression ? progression.getPlayerLevel(aura) : 1;
    const title = progression ? progression.getPlayerTitle(level) : 'Carregando...';

    const [auraGlow, setAuraGlow] = useState(false);
    const [autoHide, setAutoHide] = useState(false);
    const [multiplierTimeLeft, setMultiplierTimeLeft] = useState(0);

    useEffect(() => {
        if (auraMultiplier > 1 && multiplierEndTime) {
            // Atualiza de imediato
            setMultiplierTimeLeft(Math.max(0, Math.floor((multiplierEndTime - Date.now()) / 1000)));
            const interval = setInterval(() => {
                const now = Date.now();
                const diff = Math.floor((multiplierEndTime - now) / 1000);
                if (diff <= 0) {
                    setMultiplierTimeLeft(0);
                    clearInterval(interval);
                } else {
                    setMultiplierTimeLeft(diff);
                }
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setMultiplierTimeLeft(0);
        }
    }, [auraMultiplier, multiplierEndTime]);
    
    const [showLeftMenu, setShowLeftMenu] = useState(false);
    
    // Estados do Ranking
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [realRanking, setRealRanking] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [isLoadingRank, setIsLoadingRank] = useState(false);

    useEffect(() => {
        if (showRankingModal) {
            setIsLoadingRank(true);
            const fetchRanking = async () => {
                try {
                    const q = query(collection(db, 'users'), orderBy('aura', 'desc'), limit(100));
                    const snapshot = await getDocs(q);
                    const rankData = [];
                    let index = 1;
                    let foundMyRank = false;
                    
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const pName = data.name ? data.name.split(' ')[0] : 'Jogador';
                        const player = {
                            id: doc.id,
                            rank: index,
                            name: pName,
                            aura: data.aura || 0
                        };
                        rankData.push(player);
                        if (pName === nickname) {
                            setMyRank(index);
                            foundMyRank = true;
                        }
                        index++;
                    });
                    
                    setRealRanking(rankData);
                    if (!foundMyRank) setMyRank('+100');
                } catch (error) {
                    console.error("Erro ao buscar ranking:", error);
                } finally {
                    setIsLoadingRank(false);
                }
            };
            fetchRanking();
        }
    }, [showRankingModal, nickname]);

    useEffect(() => {
        if (aura > 0) {
            setAuraGlow(true);
            const t = setTimeout(() => setAuraGlow(false), 200);
            return () => clearTimeout(t);
        }
    }, [aura]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (useUISystem.getState().farmMode !== 'six_seven') return;
            if (e.key === '6' && !e.repeat) AuraSystem.setRawInput('left', true);
            if (e.key === '7' && !e.repeat) AuraSystem.setRawInput('right', true);
        };
        const handleKeyUp = (e) => {
            if (useUISystem.getState().farmMode !== 'six_seven') return;
            if (e.key === '6') AuraSystem.setRawInput('left', false);
            if (e.key === '7') AuraSystem.setRawInput('right', false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleLeftDown = (e) => { e.target.setPointerCapture(e.pointerId); AuraSystem.setRawInput('left', true); };
    const handleLeftUp = (e) => { e.target.releasePointerCapture(e.pointerId); AuraSystem.setRawInput('left', false); };
    const handleRightDown = (e) => { e.target.setPointerCapture(e.pointerId); AuraSystem.setRawInput('right', true); };
    const handleRightUp = (e) => { e.target.releasePointerCapture(e.pointerId); AuraSystem.setRawInput('right', false); };

    let menuOpacity = 1;
    if (autoHide) {
        if (comboCount >= 1000) menuOpacity = 0;
        else if (comboCount >= 500) menuOpacity = 0.3;
        else if (comboCount >= 300) menuOpacity = 0.5;
        else if (comboCount >= 100) menuOpacity = 0.75;
        else if (comboCount >= 50) menuOpacity = 0.9;
    }

    const transitionStyle = { transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' };
    const progressAura = aura % 500;

    return (
        <div key={isMilestone && message ? hitId : 'hud'} style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', display: 'flex', flexDirection: 'column',
            fontFamily: 'sans-serif', overflow: 'hidden',
            animation: (message && isMilestone) ? 'screenShake 0.35s ease-in-out' : 'none'
        }}>
            <style>{`
                :root {
                    --top-padding: 15px 20px;
                    --mid-pad-x: 15px;
                    --mid-padding: 0 var(--mid-pad-x);
                    --bot-padding: 0 15px 10px 15px;
                    
                    /* TUDO 15% MENOR QUE ANTES */
                    --glass-pad: 6px 10px;
                    --glass-width: 102px; 
                    
                    --btn-size: 30px;
                    --left-btn-w: 38px;
                    --left-btn-h: 42px;
                    --left-icon: 14px;
                    
                    --avatar-size: 32px;
                    --nav-height: 55px;
                    
                    /* TRANSPARÊNCIA AUMENTADA, BLUR INTENSO */
                    --bg-glass: rgba(10, 10, 15, 0.4);
                    --bg-blur: blur(12px);
                }
                
                @media (max-width: 768px) {
                    :root {
                        --top-padding: 10px 10px;
                        --mid-pad-x: 10px;
                        --mid-padding: 0 var(--mid-pad-x);
                        --bot-padding: 0 10px 10px 10px;
                        
                        --glass-pad: 5px 6px;
                        --glass-width: 85px; 
                        
                        --btn-size: 26px;
                        --left-btn-w: 30px;
                        --left-btn-h: 34px;
                        --left-icon: 12px;
                        
                        --avatar-size: 28px;
                        --nav-height: 48px;
                    }
                    .text-avatar-name { font-size: 0.75rem !important; }
                    .text-avatar-title { font-size: 0.45rem !important; }
                    .text-aura-val { font-size: 0.9rem !important; }
                    .text-aura-lbl { font-size: 0.5rem !important; }
                    .right-stat-val { font-size: 0.75rem !important; }
                    .right-stat-lbl { font-size: 0.45rem !important; }
                    .bottom-nav-lbl { font-size: 0.5rem !important; }
                }

                .glass-panel {
                    background: var(--bg-glass);
                    backdrop-filter: var(--bg-blur);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    pointer-events: auto;
                    padding: var(--glass-pad);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
                }
                
                .top-btn {
                    width: var(--btn-size); height: var(--btn-size);
                    display: flex; justify-content: center; align-items: center;
                    background: var(--bg-glass);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px; color: #fff; cursor: pointer;
                    pointer-events: auto; backdrop-filter: var(--bg-blur);
                    transition: transform 0.2s ease;
                }
                .top-btn:active { transform: scale(0.9); }
                
                .left-menu-btn {
                    width: var(--left-btn-w); height: var(--left-btn-h);
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    background: transparent; border: 1px solid transparent;
                    border-radius: 8px; margin-bottom: 2px; color: #fcd34d; cursor: pointer;
                    pointer-events: auto;
                    gap: 2px; transition: transform 0.2s ease, background 0.2s ease;
                }
                .left-menu-btn:hover { background: rgba(255,255,255,0.05); transform: translateX(3px); }
                .left-menu-btn span { font-size: 0.45rem; font-weight: bold; text-transform: uppercase; color: #fff; letter-spacing: 0.5px; }
                
                .bottom-nav-btn {
                    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
                    color: #888; gap: 4px; cursor: pointer; pointer-events: auto; transition: color 0.3s ease;
                }
                .bottom-nav-btn:hover { color: #ccc; }
                .bottom-nav-btn.active { color: #a855f7; }
                .bottom-nav-lbl { font-size: 0.6rem; font-weight: bold; letter-spacing: 0.5px; }
                
                .collapse-btn {
                    width: 24px; height: 48px; background: rgba(10, 10, 15, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex; justify-content: center; align-items: center;
                    cursor: pointer; pointer-events: auto; backdrop-filter: var(--bg-blur);
                    color: #fff; transition: background 0.2s; z-index: 10;
                }
                .collapse-btn:hover { background: rgba(168, 85, 247, 0.4); }
                
                /* ANIMAÇÕES CINEMATOGRÁFICAS PARA ÍCONES */
                @keyframes floatAnim {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                @keyframes pulseAnim {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                @keyframes wobbleAnim {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(5deg); }
                    75% { transform: rotate(-5deg); }
                }
                @keyframes cinematicComboPulse {
                    0%, 100% { transform: scale(1); text-shadow: 0 0 15px rgba(168,85,247,0.8), 0 0 30px rgba(168,85,247,0.4); }
                    50% { transform: scale(1.05); text-shadow: 0 0 25px rgba(168,85,247,1), 0 0 50px rgba(168,85,247,0.6); }
                }
                @keyframes epicFooterPulse {
                    0%, 100% { box-shadow: 0 -5px 30px rgba(168,85,247,0.3); border-top-color: rgba(168,85,247,0.4); }
                    50% { box-shadow: 0 -15px 50px rgba(168,85,247,0.6); border-top-color: rgba(168,85,247,0.8); }
                }
                @keyframes fireFooterPulse {
                    0%, 100% { box-shadow: 0 -5px 30px rgba(248,113,113,0.3); border-top-color: rgba(248,113,113,0.4); }
                    50% { box-shadow: 0 -15px 50px rgba(248,113,113,0.6); border-top-color: rgba(248,113,113,0.8); }
                }
                @keyframes epicPopup {
                    0% { opacity: 0; transform: scale(0.5) translateY(20px); filter: blur(4px); }
                    20% { opacity: 1; transform: scale(1.2) translateY(-5px); filter: blur(0px); text-shadow: 0 0 30px rgba(255,255,255,1); }
                    40% { transform: scale(1) translateY(0); text-shadow: 0 5px 15px rgba(0,0,0,0.8); }
                    80% { opacity: 1; transform: scale(1) translateY(-10px); }
                    100% { opacity: 0; transform: scale(0.8) translateY(-30px); filter: blur(2px); }
                }
                @keyframes floatUp {
                    0% { opacity: 0; transform: translateY(0); }
                    20% { opacity: 1; transform: translateY(-10px); }
                    80% { opacity: 1; transform: translateY(-30px); }
                    100% { opacity: 0; transform: translateY(-40px); }
                }
                @keyframes screenShake {
                    0% { transform: translate(0, 0); }
                    20% { transform: translate(-3px, 2px); }
                    40% { transform: translate(3px, -2px); }
                    60% { transform: translate(-3px, -2px); }
                    80% { transform: translate(2px, 3px); }
                    100% { transform: translate(0, 0); }
                }

                .anim-float { animation: floatAnim 3s ease-in-out infinite; }
                .anim-pulse { animation: pulseAnim 2s ease-in-out infinite; }
                .anim-wobble { animation: wobbleAnim 4s ease-in-out infinite; }
                .anim-epic-combo { animation: cinematicComboPulse 1s ease-in-out infinite; }
                .anim-footer-epic { animation: epicFooterPulse 1.5s ease-in-out infinite; }
                .anim-footer-fire { animation: fireFooterPulse 1s ease-in-out infinite; }

                /* MODAL RANKING RESPONSIVO */
                .ranking-modal {
                    background: rgba(20, 18, 28, 0.85);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-top: 1px solid rgba(168, 85, 247, 0.3);
                    border-radius: 24px;
                    padding: 32px;
                    display: flex; flex-direction: column; gap: 15px;
                    width: 90%; max-width: 480px;
                    height: 85vh; max-height: 800px;
                    text-align: left;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(168, 85, 247, 0.1);
                    animation: modalPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    position: relative; overflow: hidden;
                }

                .ranking-modal::before {
                    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(circle at top, rgba(168, 85, 247, 0.15) 0%, transparent 60%);
                    pointer-events: none; z-index: 0;
                }

                .ranking-modal-scroll {
                    flex: 1; overflow-y: auto; padding-right: 10px; margin-top: 10px;
                }
                .ranking-modal-scroll::-webkit-scrollbar { width: 6px; }
                .ranking-modal-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 3px; }
                .ranking-modal-scroll::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.5); border-radius: 3px; }

                @keyframes modalPop {
                    0% { transform: scale(0.8) translateY(40px); opacity: 0; filter: blur(10px); }
                    100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0px); }
                }

                .ranking-modal-content { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }
                .ranking-modal-row {
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;
                }
                .ranking-modal-row:last-child { border-bottom: none; }
                
                .ranking-modal-lbl { color: #888; font-size: 0.85rem; font-weight: bold; letter-spacing: 1px; }
                .ranking-modal-val { color: #fff; font-size: 1.1rem; font-weight: 900; }
                .ranking-modal-title { color: #fcd34d; font-size: 1.4rem; font-weight: 900; letter-spacing: 2px; text-shadow: 0 0 15px rgba(252, 211, 77, 0.5); text-align: center; }

                @media (max-width: 768px) {
                    .ranking-modal { padding: 24px 20px; border-radius: 20px; width: 95%; gap: 10px; }
                    .ranking-modal-title { font-size: 1.1rem; }
                    .ranking-modal-row { padding-bottom: 8px; }
                    .ranking-modal-val { font-size: 0.95rem; }
                    .ranking-modal-lbl { font-size: 0.75rem; }
                }
            `}</style>

            {/* ══════════ TOP BAR — GRID 3 COLUNAS FIXAS ══════════ */}
            <div style={{
                padding: '10px 14px 0 14px',
                opacity: menuOpacity, transition: 'opacity 0.5s',
                pointerEvents: 'none', zIndex: 10, width: '100%',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(8,6,18,0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(168,85,247,0.18)',
                    borderRadius: '16px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}>

                    {/* ── COLUNA ESQUERDA: Avatar (Nome/Título flutuando abaixo) ── */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
                        {/* Avatar circular */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'linear-gradient(135deg,#2e1065,#1e0a45)',
                                border: '2px solid #a855f7',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 12px rgba(168,85,247,0.45)'
                            }}>
                                <User color="#d8b4fe" size={16} />
                            </div>
                            {/* Badge de nível */}
                            <div style={{
                                position: 'absolute', bottom: '-5px', left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'linear-gradient(90deg,#7c3aed,#a855f7)',
                                borderRadius: '6px', padding: '1px 5px',
                                color: '#fff', fontSize: '0.48rem', fontWeight: '900',
                                whiteSpace: 'nowrap', letterSpacing: '0.5px',
                                boxShadow: '0 2px 6px rgba(124,58,237,0.6)'
                            }}>
                                LV {level}
                            </div>
                            
                            {/* Nome e Título posicionados fora do cabeçalho */}
                            <div style={{
                                position: 'absolute', top: '48px', left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                gap: '2px', pointerEvents: 'none'
                            }}>
                                <div style={{
                                    color: '#fff', fontSize: '0.82rem', fontWeight: '900',
                                    lineHeight: '1.1', whiteSpace: 'nowrap',
                                    textShadow: '0 2px 5px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.8)'
                                }}>{nickname}</div>
                                <div style={{
                                    color: '#c084fc', fontSize: '0.5rem', fontWeight: '700',
                                    textTransform: 'uppercase', letterSpacing: '0.8px',
                                    whiteSpace: 'nowrap',
                                    textShadow: '0 2px 5px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.8)'
                                }}>{title}</div>
                            </div>
                        </div>
                    </div>

                    {/* ── COLUNA CENTRAL: AURA (destaque adaptável) ── */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        position: 'relative', padding: '2px 8px', minWidth: 0
                    }}>
                        {/* Label AURA */}
                        <div style={{
                            fontSize: '0.48rem', fontWeight: '900', letterSpacing: '3px',
                            color: '#c084fc', textTransform: 'uppercase', marginBottom: '1px'
                        }}>✦ AURA ✦</div>

                        {/* Valor principal adaptável */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            maxWidth: '100%'
                        }}>
                            <Sparkles size={13} color="#a855f7" className="anim-pulse" style={{ flexShrink: 0 }} />
                            <span style={{
                                fontSize: '1.35rem', fontWeight: '900', lineHeight: '1',
                                color: auraGlow ? '#ffd700' : '#fff',
                                textShadow: auraGlow
                                    ? '0 0 20px rgba(255,215,0,0.9), 0 0 40px rgba(255,215,0,0.5)'
                                    : '0 0 18px rgba(168,85,247,0.7)',
                                transition: 'color 0.15s, text-shadow 0.15s',
                                letterSpacing: '-0.5px',
                                fontVariantNumeric: 'tabular-nums',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>
                                {Math.floor(aura).toLocaleString()}
                            </span>
                        </div>

                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'flex-end', gap: '7px', minWidth: 0
                    }}>

                        {/* Contador de AuraCash adaptável */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: 'rgba(52,211,153,0.1)',
                            border: '1px solid rgba(52,211,153,0.25)',
                            borderRadius: '10px', padding: '5px 9px',
                            pointerEvents: 'auto', minWidth: 0
                        }}>
                            <AuracashIcon size={11} color="#34d399" style={{ flexShrink: 0 }} />
                            <span style={{
                                color: '#34d399', fontSize: '0.78rem', fontWeight: '900',
                                whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                                overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                                {(stats.diamonds || 0).toLocaleString()}
                            </span>
                        </div>

                        {/* Botão Home */}
                        <div
                            style={{
                                flexShrink: 0, width: '34px', height: '34px',
                                borderRadius: '10px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                backdropFilter: 'blur(10px)',
                                pointerEvents: 'auto',
                                transition: 'background 0.2s, transform 0.15s'
                            }}
                            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
                            onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={async () => {
                                import('../../../systems/useMultiplayerSystem').then(m => m.useMultiplayerSystem.getState().leaveRoom());
                                const [pSys, aSys, dbSys, qSys, achSys] = await Promise.all([
                                    import('../../../systems/usePlayerSystem'),
                                    import('../../../systems/useAuraSystem'),
                                    import('../../../systems/useDatabaseSystem'),
                                    import('../../../systems/useQuestSystem'),
                                    import('../../../systems/useAchievementSystem')
                                ]);
                                const pos = pSys.usePlayerSystem.getState().position;
                                const model = pSys.usePlayerSystem.getState().activeModel;
                                const { comboCount, maxCombo, aura, weeklyAura } = aSys.useAuraSystem.getState();
                                const diamonds = useUISystem.getState().playerStats.diamonds || 0;
                                const { dailyQuests, lastResetDate } = qSys.useQuestSystem.getState();
                                const achievements = achSys.useAchievementSystem.getState().getSavableData();
                                await dbSys.useDatabaseSystem.getState().saveGameState(
                                    pos, comboCount, model, aura, diamonds, maxCombo, dailyQuests, lastResetDate, weeklyAura, undefined, achievements
                                );
                                // Reseta a posição instantaneamente para a fonte ao sair do mapa
                                pSys.usePlayerSystem.getState().setPosition(pSys.getSafeRandomSpawn());
                                setScreen('MENU');
                            }}
                        >
                            <Home size={15} color="#fff" />
                        </div>
                    </div>

                </div>
            </div>

            {/* ══════════ BOTÃO PASSINHO DO JAMAL — Canto superior direito ══════════ */}
            <div style={{
                position: 'absolute',
                top: '80px',
                right: '14px',
                pointerEvents: 'auto',
                zIndex: 20,
                display: 'none' // Botão oculto a pedido
            }}>
                <button
                    onPointerDown={(e) => { e.stopPropagation(); DanceSystem.toggleDance(); }}
                    style={{
                        padding: '10px 14px',
                        background: isDancing
                            ? 'linear-gradient(135deg, #ff6ec7, #ffb347)'
                            : 'rgba(20, 10, 35, 0.75)',
                        color: 'white',
                        border: isDancing
                            ? '2px solid rgba(255,255,255,0.8)'
                            : '1px solid rgba(255, 100, 180, 0.5)',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: isDancing
                            ? '0 0 22px rgba(255, 100, 180, 0.85)'
                            : '0 2px 10px rgba(0,0,0,0.5)',
                        transform: isDancing ? 'scale(1.07)' : 'scale(1)',
                        transition: 'all 0.12s ease',
                        letterSpacing: '0.5px',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    🕺 Passinho
                </button>
            </div>

            {/* Popups de Acerto */}
            {message && !isMilestone && (
                <div key={`small-${hitId}`} style={{
                    position: 'absolute',
                    top: '40%',
                    left: hitSide === 'left' ? '30%' : '70%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 6,
                    animation: 'floatUp 0.6s ease forwards',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    textShadow: '0 2px 5px rgba(0,0,0,0.5)'
                }}>
                    {message}
                </div>
            )}

            {message && isMilestone && (
                <div key={`mile-${hitId}`} style={{
                    position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 6, pointerEvents: 'none',
                    animation: 'epicPopup 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', display: 'flex', gap: '6px', alignItems: 'baseline'
                }}>
                    <span style={{ color: lastPoints >= 50 ? '#a855f7' : '#fcd34d', fontWeight: '900', fontSize: '2.2rem', fontStyle: 'italic', letterSpacing: '2px', textShadow: '0 0 15px rgba(252,211,77,0.8)' }}>
                        {message}
                    </span>
                </div>
            )}

            {/* MIDDLE LAYOUT */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '0', zIndex: 5, pointerEvents: 'none' }}>
                
                {/* LEFT RETRACTABLE MENU */}
                <div style={{ 
                    position: 'relative',
                    transform: showLeftMenu ? 'translateX(0)' : 'translateX(-100%)',
                    opacity: menuOpacity,
                    transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s',
                    display: 'flex', alignItems: 'center',
                    pointerEvents: 'auto'
                }}>
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '10px 5px', borderLeft: 'none', borderRadius: '0 12px 12px 0' }}>
                        <div className="left-menu-btn" onClick={async () => {
                            const [pSys, aSys, dbSys, qSys, achSys] = await Promise.all([
                                import('../../../systems/usePlayerSystem'),
                                import('../../../systems/useAuraSystem'),
                                import('../../../systems/useDatabaseSystem'),
                                import('../../../systems/useQuestSystem'),
                                import('../../../systems/useAchievementSystem')
                            ]);
                            const pos = pSys.usePlayerSystem.getState().position;
                            const model = pSys.usePlayerSystem.getState().activeModel;
                            const { comboCount, maxCombo, aura, weeklyAura } = aSys.useAuraSystem.getState();
                            const diamonds = useUISystem.getState().playerStats.diamonds || 0;
                            const { dailyQuests, lastResetDate } = qSys.useQuestSystem.getState();
                            const achievements = achSys.useAchievementSystem.getState().getSavableData();

                            await dbSys.useDatabaseSystem.getState().saveGameState(
                                pos, comboCount, model, aura, diamonds, maxCombo, dailyQuests, lastResetDate, weeklyAura, undefined, achievements
                            );
                            
                            setShowRankingModal(true);
                        }}><BarChart2 className="anim-float" size={16} /><span>Ranking</span></div>
                        <div className="left-menu-btn" onClick={() => setScreen('ACHIEVEMENTS')}><Shield className="anim-wobble" size={16} /><span>Conquistas</span></div>
                        <div className="left-menu-btn" style={{ position: 'relative' }} onClick={() => setScreen('QUESTS')}>
                            <ScrollText size={16} color="#fff" />
                            <div className="anim-pulse" style={{ position: 'absolute', top: '6px', right: '6px', width: '4px', height: '4px', background: '#ef4444', borderRadius: '50%' }} />
                            <span>Missões</span>
                        </div>
                        <div className="left-menu-btn"><Gift className="anim-pulse" size={16} color="#fcd34d" /><span>Eventos</span></div>
                        <div className="left-menu-btn"><Briefcase size={16} color="#fff" /><span>Inventário</span></div>
                        <div className="left-menu-btn" onClick={() => setScreen('STORE')}><ShoppingCart size={16} color="#fff" /><span>Loja</span></div>
                    </div>
                    
                    <div className="collapse-btn" style={{ position: 'absolute', right: '-24px', borderRadius: '0 10px 10px 0', borderLeft: 'none', width: '24px' }} onClick={() => setShowLeftMenu(!showLeftMenu)}>
                        {showLeftMenu ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </div>
                </div>

            </div>

            {/* BOTTOM AREA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: 'var(--bot-padding)', opacity: menuOpacity, transition: 'opacity 0.5s', zIndex: 5, marginBottom: '85px' }}>
                <div style={{ position: 'relative', width: '45px', height: '45px', transform: 'scale(1.1)', transformOrigin: 'bottom left', pointerEvents: 'auto' }}>
                    <Joystick />
                </div>
                
                <div className="glass-panel" style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ color: '#fcd34d', fontSize: '0.45rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Sparkles size={8} /> SISTEMAS
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ color: '#aaa', fontSize: '0.45rem', fontWeight: 'bold' }}>AUTO HIDE</span>
                        <div className={`toggle-switch ${autoHide ? 'active' : ''}`} onClick={() => setAutoHide(!autoHide)}>
                            <div className="toggle-knob" />
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTÕES LADO DIREITO (Inventário, Mapa e Modo Farm) */}
            <div style={{
                position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'auto',
                display: 'flex', flexDirection: 'column', gap: '15px'
            }}>
                {/* Botão Modos de Farm */}
                <div className="top-btn anim-float" style={{ 
                    width: '45px', height: '45px', borderRadius: '50%', position: 'relative',
                    background: showFarmModal ? 'rgba(234, 179, 8, 0.4)' : 'var(--bg-glass)',
                    border: showFarmModal ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: showFarmModal ? '0 0 15px rgba(234, 179, 8, 0.5)' : 'none'
                }} onClick={() => setShowFarmModal(true)}>
                    <Pickaxe size={22} color={showFarmModal ? "#fff" : "#eab308"} />
                    {farmMode !== 'none' && (
                        <div style={{
                            position: 'absolute', top: '-2px', right: '-2px',
                            background: '#eab308', borderRadius: '50%',
                            width: '12px', height: '12px', border: '2px solid #000'
                        }} />
                    )}
                </div>
                {/* Botão Inventário de Poções */}
                <div className="top-btn anim-float" style={{ 
                    width: '45px', height: '45px', borderRadius: '50%', position: 'relative',
                    background: showInventoryModal ? 'rgba(168, 85, 247, 0.4)' : 'var(--bg-glass)',
                    border: showInventoryModal ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: showInventoryModal ? '0 0 15px rgba(168, 85, 247, 0.5)' : 'none'
                }} onClick={() => setShowInventoryModal(true)}>
                    <FlaskConical size={22} color={showInventoryModal ? "#fff" : "#a855f7"} />
                    {inventory.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '-5px', right: '-5px',
                            background: '#ef4444', color: '#fff', borderRadius: '50%',
                            width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: '0.6rem', fontWeight: 'bold', border: '2px solid #000'
                        }}>
                            {inventory.length}
                        </div>
                    )}
                </div>

                {/* Botão Mapa */}
                <div className="top-btn anim-float" style={{ 
                    width: '45px', height: '45px', borderRadius: '50%', 
                    background: isMapMode ? 'rgba(168, 85, 247, 0.4)' : 'var(--bg-glass)',
                    border: isMapMode ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isMapMode ? '0 0 15px rgba(168, 85, 247, 0.5)' : 'none'
                }} onClick={toggleMapMode}>
                    <Map size={22} color={isMapMode ? "#fff" : "#a855f7"} />
                </div>
            </div>

            {/* MODAL INVENTÁRIO DE POÇÕES */}
            {showInventoryModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto'
                }} onClick={() => setShowInventoryModal(false)}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                        border: '2px solid #ec4899', borderRadius: '16px',
                        width: '90%', maxWidth: '400px', padding: '24px',
                        boxShadow: '0 0 30px rgba(236, 72, 153, 0.4)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FlaskConical color="#ec4899" /> Suas Poções
                            </h2>
                            <button onClick={() => setShowInventoryModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        {inventory.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontStyle: 'italic' }}>
                                Seu inventário está vazio.<br/>Compre poções na loja!
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '50vh', overflowY: 'auto' }}>
                                {inventory.map((potion) => (
                                    <div key={potion.instanceId} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(236, 72, 153, 0.3)',
                                        borderRadius: '12px', padding: '12px'
                                    }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: '#ec4899', fontSize: '1rem' }}>{potion.name}</h3>
                                            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Multiplicador {potion.multiplier}x (5 min)</p>
                                        </div>
                                        <button onClick={async () => {
                                            const { setMultiplier } = useAuraSystem.getState();
                                            setMultiplier(potion.multiplier, 5 * 60 * 1000);
                                            useUISystem.getState().removePotionFromInventory(potion.instanceId);
                                            
                                            // Progresso de quest
                                            import('../../../systems/useQuestSystem').then(m => m.useQuestSystem.getState().updateQuestProgress('use_potion', 1));
                                            
                                            // Salvar novo inventario e status
                                            const [pSys, aSys, dbSys] = await Promise.all([
                                                import('../../../systems/usePlayerSystem'),
                                                import('../../../systems/useAuraSystem'),
                                                import('../../../systems/useDatabaseSystem')
                                            ]);
                                            const pos = pSys.usePlayerSystem.getState().position;
                                            const model = pSys.usePlayerSystem.getState().activeModel;
                                            const { comboCount, maxCombo, aura, weeklyAura } = aSys.useAuraSystem.getState();
                                            const diamonds = useUISystem.getState().playerStats.diamonds || 0;
                                            const newInventory = useUISystem.getState().inventory;
                                            await dbSys.useDatabaseSystem.getState().saveGameState(pos, comboCount, model, aura, diamonds, maxCombo, undefined, undefined, weeklyAura, undefined, undefined, undefined, newInventory);
                                            
                                            setShowInventoryModal(false);
                                        }} style={{
                                            background: '#ec4899', color: '#fff', border: 'none',
                                            padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                                        }}>
                                            USAR
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL MODOS DE FARM */}
            {showFarmModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto'
                }} onClick={() => setShowFarmModal(false)}>
                    <div style={{
                        background: 'linear-gradient(135deg, #422006, #1e293b)',
                        border: '2px solid #eab308', borderRadius: '16px',
                        width: '90%', maxWidth: '400px', padding: '24px',
                        boxShadow: '0 0 30px rgba(234, 179, 8, 0.4)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Pickaxe color="#eab308" /> Modos de Farm
                            </h2>
                            <button onClick={() => setShowFarmModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Card do Six Seven */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: farmMode === 'six_seven' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.05)', 
                                border: farmMode === 'six_seven' ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s'
                            }} onClick={() => {
                                setFarmMode(farmMode === 'six_seven' ? 'none' : 'six_seven');
                                setShowFarmModal(false);
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, color: farmMode === 'six_seven' ? '#eab308' : '#fff', fontSize: '1rem' }}>Modo Six Seven</h3>
                                    <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Ritmo de 2 toques (6 e 7) alternados.</p>
                                </div>
                                <div style={{ 
                                    width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #eab308',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    background: farmMode === 'six_seven' ? '#eab308' : 'transparent'
                                }}>
                                    {farmMode === 'six_seven' && <div style={{ width: '10px', height: '10px', background: '#000', borderRadius: '50%' }} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTTOM STATS HUD (COMPACT PILL) */}
            <div className={comboCount > 50 ? 'anim-footer-fire' : comboCount > 10 ? 'anim-footer-epic' : ''} style={{ 
                position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                width: '95%', maxWidth: '500px', height: '60px', padding: '0 15px', borderRadius: '30px',
                background: comboCount > 50 ? 'rgba(30,5,5,0.95)' : 'rgba(15,10,20,0.95)', 
                border: `1.5px solid ${comboCount > 50 ? '#f87171' : comboCount > 10 ? '#a855f7' : 'rgba(255,255,255,0.15)'}`, 
                boxShadow: comboCount > 50 ? '0 10px 25px rgba(248,113,113,0.4)' : '0 10px 25px rgba(0,0,0,0.7)', 
                backdropFilter: 'blur(20px)', pointerEvents: 'auto', zIndex: 10, opacity: menuOpacity, transition: 'opacity 0.5s'
            }}>
                
                {/* COMBO DESTAQUE */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1.2 }}>
                    <div style={{ 
                        flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', 
                        background: comboCount > 50 ? 'radial-gradient(circle, rgba(248,113,113,0.3), transparent)' : 'radial-gradient(circle, rgba(168,85,247,0.3), transparent)', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', 
                        border: `1.5px solid ${comboCount > 50 ? '#f87171' : '#a855f7'}`
                    }}>
                        <Flame size={22} color={comboCount > 50 ? "#f87171" : "#a855f7"} className={comboCount > 10 ? "anim-wobble" : ""} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ color: comboCount > 50 ? '#fca5a5' : '#d8b4fe', fontSize: '0.55rem', fontWeight: '900', letterSpacing: '2px', whiteSpace: 'nowrap' }}>COMBO</span>
                        <span className={comboCount > 10 ? 'anim-epic-combo' : ''} style={{ 
                            color: comboCount > 50 ? '#f87171' : '#fff', 
                            fontSize: comboCount > 99999 ? '1.2rem' : comboCount > 999 ? '1.5rem' : '1.8rem', 
                            fontWeight: '900', fontStyle: 'italic', lineHeight: '1', marginTop: '2px',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                            {comboCount > 0 ? comboCount : '-'}
                        </span>
                        {maxCombo > 0 && (
                            <span style={{ color: '#fbbf24', fontSize: '0.45rem', fontWeight: 'bold', letterSpacing: '1px', marginTop: '2px' }}>
                                MAX: {maxCombo}
                            </span>
                        )}
                    </div>
                </div>

                {/* STATS CARD (RIGHT) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0 }}>
                        {multiplierTimeLeft > 0 && (
                            <span style={{ color: '#fcd34d', fontSize: '0.45rem', fontWeight: 'bold', marginBottom: '2px', letterSpacing: '1px' }}>
                                ⏱ {Math.floor(multiplierTimeLeft / 60)}:{String(multiplierTimeLeft % 60).padStart(2, '0')}
                            </span>
                        )}
                        <span style={{ color: '#888', fontSize: '0.5rem', fontWeight: 'bold', letterSpacing: '1px', whiteSpace: 'nowrap' }}>MULT.</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={12} color="#4ade80" className={auraMultiplier > 1 ? "anim-float" : ""} />
                            <span style={{ color: '#4ade80', fontSize: '1rem', fontWeight: '900', whiteSpace: 'nowrap' }}>x{auraMultiplier}</span>
                        </div>
                    </div>
                    
                    <div style={{ flexShrink: 0, width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                        <span style={{ color: '#888', fontSize: '0.5rem', fontWeight: 'bold', letterSpacing: '1px', whiteSpace: 'nowrap' }}>BÔNUS</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={12} color="#a855f7" className={comboCount >= 100 ? "anim-pulse" : ""} />
                            <span style={{ color: '#a855f7', fontSize: '1rem', fontWeight: '900', whiteSpace: 'nowrap' }}>+{Math.floor(comboCount / 100) * 10}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zonas de Farm (Six Seven e Livres) */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', pointerEvents: 'none', zIndex: 4 }}>
                {farmMode === 'six_seven' ? (
                    <>
                        {/* Botão 6 (Esquerda) */}
                        <div style={{ 
                            position: 'absolute', top: '50%', left: '8%', transform: 'translateY(-50%)',
                            width: '100px', height: '100px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.15)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: '3.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.2)',
                            touchAction: 'none', pointerEvents: 'auto', background: 'rgba(255,255,255,0.02)',
                            userSelect: 'none'
                        }}
                        onPointerDown={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; handleLeftDown(e); }}
                        onPointerUp={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; handleLeftUp(e); }}
                        onPointerCancel={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; handleLeftUp(e); }}
                        >
                            6
                        </div>

                        {/* Botão 7 (Direita) */}
                        <div style={{ 
                            position: 'absolute', top: '50%', right: '8%', transform: 'translateY(-50%)',
                            width: '100px', height: '100px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.15)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: '3.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.2)',
                            touchAction: 'none', pointerEvents: 'auto', background: 'rgba(255,255,255,0.02)',
                            userSelect: 'none'
                        }}
                        onPointerDown={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; handleRightDown(e); }}
                        onPointerUp={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; handleRightUp(e); }}
                        onPointerCancel={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; handleRightUp(e); }}
                        >
                            7
                        </div>
                    </>
                ) : farmMode === 'free' ? (
                    <>
                        <div style={{ flex: 1, touchAction: 'none', pointerEvents: 'auto' }} onPointerDown={handleLeftDown} onPointerUp={handleLeftUp} onPointerCancel={handleLeftUp} />
                        <div style={{ width: '40%', pointerEvents: 'none' }}></div>
                        <div style={{ flex: 1, touchAction: 'none', pointerEvents: 'auto' }} onPointerDown={handleRightDown} onPointerUp={handleRightUp} onPointerCancel={handleRightUp} />
                    </>
                ) : null}
            </div>

            {/* RANKING MODAL TRANSLÚCIDO */}
            {showRankingModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, pointerEvents: 'auto'
                }} onClick={() => setShowRankingModal(false)}>
                    
                    <div className="ranking-modal" onClick={e => e.stopPropagation()}>
                        <div className="ranking-modal-content">
                            <div className="ranking-modal-title">
                                <Trophy size={24} style={{marginRight: '10px', verticalAlign: 'middle', paddingBottom: '4px'}} className="anim-wobble" color="#fcd34d"/> 
                                MEU RANKING
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px' }}>
                                <div className="ranking-modal-row">
                                    <span className="ranking-modal-lbl">MINHA POSIÇÃO</span>
                                    <span className="ranking-modal-val" style={{ color: '#fcd34d' }}>{myRank ? `#${myRank}` : '...'}</span>
                                </div>
                                <div className="ranking-modal-row" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                                    <span className="ranking-modal-lbl">TOTAL AURA</span>
                                    <span className="ranking-modal-val" style={{ color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.2rem' }}>
                                        <Sparkles size={16} color="#fcd34d" className="anim-pulse" /> {Math.floor(aura).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div style={{ color: '#888', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center', letterSpacing: '2px' }}>TOP 100 GLOBAL</div>
                                
                                <div className="ranking-modal-scroll">
                                    {isLoadingRank ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                            <Loader2 size={24} color="#a855f7" className="anim-spin" style={{ animation: 'spin 1s linear infinite' }} />
                                        </div>
                                    ) : (
                                        realRanking.map(player => (
                                            <div key={player.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px',
                                                background: player.rank % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                borderRadius: '8px',
                                                border: player.name === nickname ? '1px solid rgba(168,85,247,0.5)' : 'none'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <span style={{ 
                                                        color: player.rank === 1 ? '#ffd700' : player.rank === 2 ? '#c0c0c0' : player.rank === 3 ? '#cd7f32' : '#888',
                                                        fontWeight: '900', fontSize: '1.1rem', width: '35px', textAlign: 'center',
                                                        textShadow: player.rank <= 3 ? '0 0 10px currentColor' : 'none'
                                                    }}>#{player.rank}</span>
                                                    <span style={{ color: player.rank <= 3 ? '#fff' : (player.name === nickname ? '#a855f7' : '#ccc'), fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                        {player.name} {player.name === nickname && '(Você)'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ color: '#a855f7', fontWeight: 'bold', fontSize: '0.85rem' }}>{Math.floor(player.aura).toLocaleString()}</span>
                                                    <AuracashIcon size={10} color="#a855f7" />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowRankingModal(false)}
                                style={{
                                    marginTop: '20px', width: '100%', background: 'linear-gradient(90deg, rgba(168,85,247,0.2), rgba(216,180,254,0.2))',
                                    border: '1px solid rgba(168,85,247,0.4)', color: '#fff', padding: '14px', borderRadius: '12px', 
                                    fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s', letterSpacing: '2px',
                                    boxShadow: '0 5px 15px rgba(168,85,247,0.2)', flexShrink: 0
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'linear-gradient(90deg, rgba(168,85,247,0.4), rgba(216,180,254,0.4))'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'linear-gradient(90deg, rgba(168,85,247,0.2), rgba(216,180,254,0.2))'; }}
                            >
                                FECHAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat multiplayer (só aparece no modo online) */}
            {isOnlineMode && <MultiplayerChat />}
        </div>
    );
}
