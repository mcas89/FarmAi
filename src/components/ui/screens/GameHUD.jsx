import React, { useEffect, useState } from 'react';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { AuraSystem } from '../../../systems/rhythm/AuraSystem';
import { Joystick } from '../Joystick';
import { 
    Settings, Trophy, Crown, 
    BarChart2, Shield, ScrollText, Gift, Briefcase, ShoppingCart, 
    Flame, Zap, Sparkles, Diamond,
    Home, UserSquare, Sparkle, User, ChevronRight, ChevronLeft, Loader2
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export function GameHUD() {
    const { aura, message, lastPoints, comboCount, maxCombo, hitId } = useAuraSystem();
    const stats = useUISystem(state => state.playerStats);
    const setScreen = useUISystem(state => state.setScreen);
    const nickname = stats.nickname || 'Marcos';

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
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', display: 'flex', flexDirection: 'column',
            fontFamily: 'sans-serif', overflow: 'hidden'
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

            {/* TOP BAR RESTRUTURADA */}
            <div style={{ display: 'flex', padding: 'var(--top-padding)', opacity: menuOpacity, transition: 'opacity 0.5s', pointerEvents: 'none', zIndex: 10, width: '100%' }}>
                
                {/* Card Único de Ponta a Ponta */}
                <div className="glass-panel" style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    width: '100%', padding: '8px 15px', gap: '10px'
                }}>
                    
                    {/* 1. Avatar (Left) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, maxWidth: '30%' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', border: '1.5px solid #a855f7', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 10px rgba(168,85,247,0.3)' }}>
                                <User color="#fff" size={20} style={{ opacity: 0.5 }} />
                            </div>
                            <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', background: '#000', border: '1px solid #fff', borderRadius: '8px', padding: '1px 6px', color: '#fff', fontSize: '0.55rem', fontWeight: 'bold' }}>
                                LV {level}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '900', lineHeight: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nickname}</div>
                            <div style={{ color: '#d8b4fe', fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                        </div>
                    </div>

                    {/* 2. Aura Bar (Center Expandido) */}
                    <div style={{ 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', 
                        flex: 1, minWidth: 0, position: 'relative'
                    }}>
                        <div style={{ color: '#a855f7', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '2px' }}>AURA</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <Diamond size={14} color="#a855f7" className="anim-pulse" style={{ flexShrink: 0 }} />
                            <span style={{ 
                                color: '#fff', fontSize: '1.4rem', fontWeight: '900', lineHeight: '1',
                                textShadow: auraGlow ? '0 0 15px rgba(255,215,0,1)' : 'none',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                                {Math.floor(aura).toLocaleString()}
                            </span>
                        </div>
                        {auraGlow && (
                            <div style={{ color: '#ffd700', fontSize: '0.7rem', fontWeight: 'bold', position: 'absolute', bottom: '-12px', whiteSpace: 'nowrap' }}>
                                +{lastPoints}
                            </div>
                        )}
                    </div>

                    {/* 3. Icons (Right) */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', height: '38px', borderRadius: '8px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', pointerEvents: 'auto' }}>
                            <Diamond size={12} color="#34d399" />
                            <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '900' }}>{stats.diamonds ? stats.diamonds.toLocaleString() : 0}</span>
                        </div>
                        <div className="top-btn" style={{ width: '38px', height: '38px', borderRadius: '8px' }} onClick={() => setScreen('MENU')}><Home size={16} color="#fff" /></div>
                    </div>

                </div>
            </div>

            {/* Popups de Acerto */}
            <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 6 }}>
                {message && (
                    <div key={hitId} style={{ animation: 'epicPopup 1s ease forwards', display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                        <span style={{ color: lastPoints >= 50 ? '#a855f7' : lastPoints > 0 ? '#4ade80' : '#f87171', fontWeight: '900', fontSize: '1.8rem', fontStyle: 'italic', letterSpacing: '2px' }}>{message}</span>
                    </div>
                )}
            </div>

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
                        <div className="left-menu-btn" onClick={() => setShowRankingModal(true)}><BarChart2 className="anim-float" size={16} /><span>Ranking</span></div>
                        <div className="left-menu-btn" onClick={() => setScreen('ACHIEVEMENTS')}><Shield className="anim-wobble" size={16} /><span>Conquistas</span></div>
                        <div className="left-menu-btn" style={{ position: 'relative' }}>
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
                <div style={{ position: 'relative', width: '45px', height: '45px', transform: 'scale(0.75)', transformOrigin: 'bottom left', pointerEvents: 'auto' }}>
                    <Joystick />
                </div>
                
                <div className="glass-panel" style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <div style={{ color: '#fcd34d', fontSize: '0.45rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Sparkles size={8} /> FARM MODE
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#aaa', fontSize: '0.45rem', fontWeight: 'bold' }}>AUTO HIDE</span>
                        <div className={`toggle-switch ${autoHide ? 'active' : ''}`} onClick={() => setAutoHide(!autoHide)}>
                            <div className="toggle-knob" />
                        </div>
                    </div>
                </div>
            </div>

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
                        <span style={{ color: '#888', fontSize: '0.5rem', fontWeight: 'bold', letterSpacing: '1px', whiteSpace: 'nowrap' }}>MULT.</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={12} color="#4ade80" className={comboCount > 50 ? "anim-float" : ""} />
                            <span style={{ color: '#4ade80', fontSize: '1rem', fontWeight: '900', whiteSpace: 'nowrap' }}>x{Math.max(1, Math.floor(comboCount / 50))}</span>
                        </div>
                    </div>
                    
                    <div style={{ flexShrink: 0, width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                        <span style={{ color: '#888', fontSize: '0.5rem', fontWeight: 'bold', letterSpacing: '1px', whiteSpace: 'nowrap' }}>BÔNUS</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Diamond size={12} color="#a855f7" className={comboCount > 10 ? "anim-pulse" : ""} />
                            <span style={{ color: '#a855f7', fontSize: '1rem', fontWeight: '900', whiteSpace: 'nowrap' }}>+{Math.floor(comboCount / 50 * 10)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Farm Zones Livres na Tela (MANTIDAS INTACTAS E INVISÍVEIS) */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', pointerEvents: 'none', zIndex: 4 }}>
                <div style={{ flex: 1, touchAction: 'none', pointerEvents: 'auto' }} onPointerDown={handleLeftDown} onPointerUp={handleLeftUp} onPointerCancel={handleLeftUp} />
                <div style={{ width: '40%', pointerEvents: 'none' }}></div>
                <div style={{ flex: 1, touchAction: 'none', pointerEvents: 'auto' }} onPointerDown={handleRightDown} onPointerUp={handleRightUp} onPointerCancel={handleRightUp} />
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
                                        <Diamond size={16} color="#fcd34d" className="anim-pulse" /> {Math.floor(aura).toLocaleString()}
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
                                                    <Diamond size={10} color="#a855f7" />
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
        </div>
    );
}
