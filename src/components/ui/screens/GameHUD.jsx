import { AuracashIcon } from '../AuracashIcon';
import React, { useEffect, useState } from 'react';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { useUISystem } from '../../../systems/useUISystem';
import { usePlayerSystem, getSafeRandomSpawn } from '../../../systems/usePlayerSystem';
import { AuraSystem } from '../../../systems/rhythm/AuraSystem';
import { DanceSystem, useDanceSystem } from '../../../systems/animation/DanceSystem';
import { Joystick } from '../Joystick';
import { 
    Trophy, Crown, Swords,
    BarChart2, Shield, ScrollText, Gift, Briefcase, ShoppingCart, 
    Flame, Zap, Sparkles, Home, UserSquare, Sparkle, User, ChevronRight, ChevronLeft, Loader2, Map, FlaskConical, Pickaxe, Circle
} from 'lucide-react';
import { MultiplayerChat } from '../MultiplayerChat';
import { DuelModal } from './DuelModal';
import { DuelInvitePopup } from './DuelInvitePopup';
import { useMultiplayerSystem } from '../../../systems/useMultiplayerSystem';
import { useRankingSystem } from '../../../systems/useRankingSystem';
import { WEEKLY_TOP_REWARDS } from '../../../systems/useDatabaseSystem';
import { useMapActivitiesSystem } from '../../../systems/useMapActivitiesSystem';
import { MapTopBanner } from '../MapTopBanner';

const formatGameNumber = (value = 0) => {
    const number = Number(value) || 0;
    const abs = Math.abs(number);
    const units = [
        [1e15, 'Q'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']
    ];
    const unit = units.find(([limit]) => abs >= limit);
    if (!unit) return Math.floor(number).toLocaleString('pt-BR');
    const [limit, suffix] = unit;
    const digits = abs >= limit * 100 ? 0 : abs >= limit * 10 ? 1 : 2;
    return `${(number / limit).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: digits })}${suffix}`;
};

export function GameHUD() {
    const { aura, message, lastPoints, comboCount, maxCombo, hitId, isMilestone, hitSide, auraMultiplier, multiplierEndTime, weeklyAura } = useAuraSystem();
    const stats = useUISystem(state => state.playerStats);
    const setScreen = useUISystem(state => state.setScreen);
    
    // Garante que a posição é resetada para a praça toda vez que o jogador SAIR do jogo
    useEffect(() => {
        useMapActivitiesSystem.getState().ensureActive({ resetFountain: true });
        return () => {
            usePlayerSystem.getState().setPosition(getSafeRandomSpawn());
        };
    }, []);

    const isMapMode = useUISystem(state => state.isMapMode);
    const toggleMapMode = useUISystem(state => state.toggleMapMode);
    const isOnlineMode = useUISystem(state => state.isOnlineMode);
    const onlinePlayersCount = useMultiplayerSystem(state => state.players ? Object.keys(state.players).length : 0);
    const isConnected = useMultiplayerSystem(state => state.isConnected);
    const joinRoom = useMultiplayerSystem(state => state.joinRoom);
    const nickname = stats.nickname || 'Marcos';
    const isDancing = useDanceSystem(state => state.isDancing);
    const inventory = useUISystem(state => state.inventory || []);
    const orbBank = useMapActivitiesSystem((s) => s.orbBank || 0);
    const farmMode = useUISystem(state => state.farmMode);
    const setFarmMode = useUISystem(state => state.setFarmMode);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showOrbModal, setShowOrbModal] = useState(false);
    const [showFarmModal, setShowFarmModal] = useState(false);
    const [showDuelModal, setShowDuelModal] = useState(false);


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
    const { weeklyRanking, isLoading: isLoadingRank } = useRankingSystem();
    const myRank = useRankingSystem.getState().getMyPosition(weeklyRanking);

    useEffect(() => {
        if (showRankingModal) {
            useRankingSystem.getState().fetchRankings();
        }
    }, [showRankingModal]);

    useEffect(() => {
        if (aura > 0) {
            setAuraGlow(true);
            const t = setTimeout(() => setAuraGlow(false), 200);
            return () => clearTimeout(t);
        }
    }, [aura]);

    // ==========================================
    // CONTROLES DE FARM (MOUSE / TOUCH / KEYBOARD)
    // ==========================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (useUISystem.getState().farmMode !== 'six_seven') return;
            if (e.key === '6' && !e.repeat) AuraSystem.setRawInput('left', true, e.isTrusted);
            if (e.key === '7' && !e.repeat) AuraSystem.setRawInput('right', true, e.isTrusted);
        };
        const handleKeyUp = (e) => {
            if (useUISystem.getState().farmMode !== 'six_seven') return;
            if (e.key === '6') AuraSystem.setRawInput('left', false, e.isTrusted);
            if (e.key === '7') AuraSystem.setRawInput('right', false, e.isTrusted);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleFarmPointerDown = (side, e) => {
        if (useUISystem.getState().farmMode === 'none') return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.currentTarget.dataset.pressed = 'true';
        AuraSystem.setRawInput(side, true, e.isTrusted);
    };

    const handleFarmPointerUp = (side, e) => {
        if (useUISystem.getState().farmMode === 'none') return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.dataset.pressed = 'false';
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        AuraSystem.setRawInput(side, false, e.isTrusted);
    };

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
                
                /* CONTROLES PREMIUM: MEIAS-LUAS DE FARM + JOYSTICK CENTRAL */
                .farm-controls-layer {
                    position: absolute; inset: 0; z-index: 8; pointer-events: none;
                    transition: opacity 0.5s ease;
                }

                .farm-crescent {
                    position: absolute;
                    bottom: calc(82px + env(safe-area-inset-bottom, 0px));
                    width: clamp(66px, 7.5vw, 88px);
                    height: clamp(108px, 16vh, 142px);
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 2px; overflow: hidden; pointer-events: auto; touch-action: none;
                    user-select: none; -webkit-user-select: none; cursor: pointer;
                    color: #fff; border: 1px solid rgba(255,255,255,0.18);
                    background: radial-gradient(circle at center, rgba(168,85,247,0.28), rgba(20,12,38,0.9) 58%, rgba(7,5,15,0.97) 100%);
                    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
                    transition: transform 0.08s ease, filter 0.08s ease, box-shadow 0.12s ease, opacity 0.2s ease;
                    opacity: 0.72;
                }

                .farm-crescent:hover { opacity: 0.92; }
                .farm-crescent-left {
                    left: 0; border-left: none; border-radius: 0 100% 100% 0; padding-right: 13px;
                    box-shadow: 10px 0 35px rgba(168,85,247,0.25), inset -7px 0 24px rgba(168,85,247,0.16);
                }
                .farm-crescent-right {
                    right: 0; border-right: none; border-radius: 100% 0 0 100%; padding-left: 13px;
                    box-shadow: -10px 0 35px rgba(251,191,36,0.22), inset 7px 0 24px rgba(251,191,36,0.14);
                }
                .farm-crescent::before {
                    content: ''; position: absolute; inset: 8px; border-radius: inherit;
                    border: 1px solid rgba(255,255,255,0.06); pointer-events: none;
                }
                .farm-crescent-number {
                    position: relative; z-index: 1; font-size: clamp(1.65rem, 3.6vw, 2.25rem);
                    font-weight: 950; line-height: 1; text-shadow: 0 3px 5px rgba(0,0,0,0.85), 0 0 24px currentColor;
                }
                .farm-crescent-left .farm-crescent-number { color: #c084fc; }
                .farm-crescent-right .farm-crescent-number { color: #fbbf24; }
                .farm-crescent-label {
                    position: relative; z-index: 1; color: rgba(255,255,255,0.55);
                    font-size: 0.38rem; font-weight: 900; letter-spacing: 1.5px;
                }
                .farm-crescent[data-pressed='true'] {
                    transform: scaleX(0.91) scaleY(0.96); filter: brightness(1.45); opacity: 1;
                }
                .farm-crescent-left[data-pressed='true'] {
                    box-shadow: 12px 0 42px rgba(168,85,247,0.55), inset -15px 0 45px rgba(168,85,247,0.5);
                }
                .farm-crescent-right[data-pressed='true'] {
                    box-shadow: -12px 0 42px rgba(251,191,36,0.5), inset 15px 0 45px rgba(251,191,36,0.42);
                }
                .premium-joystick-area {
                    position: absolute; left: 50%; bottom: calc(74px + env(safe-area-inset-bottom, 0px));
                    transform: translateX(-50%); width: 96px; height: 96px;
                    display: flex; align-items: center; justify-content: center; pointer-events: auto; touch-action: none;
                }

                @media (max-width: 768px) {
                    .farm-crescent {
                        bottom: calc(78px + env(safe-area-inset-bottom, 0px));
                        width: 70px; height: min(126px, 18vh);
                    }
                    .premium-joystick-area {
                        bottom: calc(72px + env(safe-area-inset-bottom, 0px));
                        width: 92px; height: 92px;
                    }
                }
                
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
                @keyframes floatUp {
                    0% { opacity: 0; transform: translate(-50%, -50%) translateY(8px) scale(0.7); filter: blur(2px); }
                    18% { opacity: 1; transform: translate(-50%, -50%) translateY(-6px) scale(1.15); filter: blur(0); }
                    45% { transform: translate(-50%, -50%) translateY(-18px) scale(1); }
                    75% { opacity: 1; transform: translate(-50%, -50%) translateY(-36px) scale(1.02); }
                    100% { opacity: 0; transform: translate(-50%, -50%) translateY(-52px) scale(0.9); filter: blur(1px); }
                }
                @keyframes auraGainPop {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4) rotate(-6deg); filter: blur(4px); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1.28) rotate(2deg); filter: blur(0); }
                    35% { transform: translate(-50%, -50%) scale(0.96) rotate(0deg); }
                    70% { opacity: 1; transform: translate(-50%, -50%) scale(1.05) translateY(-12px); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.85) translateY(-48px); filter: blur(2px); }
                }
                @keyframes auraGainGlow {
                    0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.8); }
                    40% { opacity: 0.85; transform: translate(-50%, -50%) scale(1.35); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
                }
                @keyframes auraSpark {
                    0% { opacity: 0; transform: translate(0, 0) scale(0.2); }
                    20% { opacity: 1; transform: translate(calc(var(--sx) * 0.35), calc(var(--sy) * 0.35)) scale(1); }
                    100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(0.35); }
                }
                @keyframes epicPopup {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.45); filter: blur(6px); }
                    18% { opacity: 1; transform: translate(-50%, -50%) scale(1.22); filter: blur(0); }
                    40% { transform: translate(-50%, -50%) scale(1); }
                    75% { opacity: 1; transform: translate(-50%, -50%) scale(1.04) translateY(-14px); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.88) translateY(-56px); filter: blur(3px); }
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

            <MapTopBanner />

            {/* Modal de Desconexão / Sala Fantasma */}
            {(isOnlineMode && !isConnected) && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 10000,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', pointerEvents: 'auto'
                }}>
                    <Loader2 size={64} color="#ef4444" className="animate-spin mb-4" />
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '10px' }}>CONEXÃO PERDIDA</h2>
                    <p style={{ fontSize: '1.2rem', marginBottom: '30px', textAlign: 'center', maxWidth: '400px', color: '#ccc' }}>
                        Você foi desconectado do servidor multiplayer. A sala pode ter sido fechada ou sua internet oscilou.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button 
                            onClick={() => {
                                const stats = useUISystem.getState().playerStats;
                                const aura = useAuraSystem.getState().aura;
                                const activeModel = usePlayerSystem.getState().activeModel;
                                import('../../../config/firebase').then(({ auth }) => {
                                    joinRoom('farma_room', {
                                        name: stats.nickname || 'Jogador',
                                        aura,
                                        model: activeModel,
                                        uid: auth?.currentUser?.uid || '',
                                    });
                                });
                            }}
                            className="action-button"
                            style={{ padding: '15px 30px', fontSize: '1.2rem', background: '#3b82f6', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}
                        >
                            Reconectar
                        </button>
                        
                        <button 
                            onClick={() => {
                                useUISystem.getState().setIsOnlineMode(false);
                                useMultiplayerSystem.getState().leaveRoom();
                            }}
                            className="action-button"
                            style={{ padding: '15px 30px', fontSize: '1.2rem', background: '#333', border: '1px solid #555', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}
                        >
                            Jogar Offline
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════ TOP BAR — GRID 3 COLUNAS FIXAS ══════════ */}
            <div style={{
                padding: '8px 12px 0 12px',
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
                    borderRadius: '14px',
                    padding: '7px 10px',
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
                                {formatGameNumber(aura)}
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
                                {formatGameNumber(stats.diamonds || 0)}
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
                                const mp = await import('../../../systems/useMultiplayerSystem');
                                await mp.useMultiplayerSystem.getState().leaveRoom();
                                useUISystem.getState().setIsOnlineMode(false);
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

            {/* Popups de Acerto (+Aura) */}
            {message && !isMilestone && (
                <div
                    key={`small-${hitId}`}
                    style={{
                        position: 'absolute',
                        top: '42%',
                        left: hitSide === 'left' ? '28%' : '72%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 6,
                        animation: 'auraGainPop 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                        pointerEvents: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(52,211,153,0.45) 0%, transparent 70%)',
                            animation: 'auraGainGlow 0.85s ease-out forwards',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                    <span
                        style={{
                            position: 'relative',
                            color: '#ecfdf5',
                            fontSize: '1.15rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px',
                            textShadow:
                                '0 0 12px rgba(52,211,153,0.9), 0 0 28px rgba(16,185,129,0.55), 0 2px 6px rgba(0,0,0,0.65)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {message}
                    </span>
                </div>
            )}

            {message && isMilestone && (
                <div
                    key={`mile-${hitId}`}
                    style={{
                        position: 'absolute',
                        top: '28%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 7,
                        pointerEvents: 'none',
                        animation: 'epicPopup 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            width: 160,
                            height: 160,
                            borderRadius: '50%',
                            background:
                                lastPoints >= 50
                                    ? 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 68%)'
                                    : 'radial-gradient(circle, rgba(252,211,77,0.5) 0%, transparent 68%)',
                            animation: 'auraGainGlow 1.5s ease-out forwards',
                            left: '50%',
                            top: '50%',
                        }}
                    />
                    {[
                        { x: -42, y: -38, d: '0s' },
                        { x: 48, y: -28, d: '0.05s' },
                        { x: -36, y: 34, d: '0.1s' },
                        { x: 40, y: 30, d: '0.08s' },
                        { x: 0, y: -52, d: '0.12s' },
                        { x: 8, y: 46, d: '0.15s' },
                    ].map((sp, i) => (
                        <span
                            key={i}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                width: 7,
                                height: 7,
                                marginLeft: -3.5,
                                marginTop: -3.5,
                                borderRadius: '50%',
                                background: lastPoints >= 50 ? '#c084fc' : '#fde68a',
                                boxShadow: `0 0 10px ${lastPoints >= 50 ? '#a855f7' : '#fbbf24'}`,
                                ['--sx']: `${sp.x}px`,
                                ['--sy']: `${sp.y}px`,
                                animation: `auraSpark 1.1s ease-out ${sp.d} forwards`,
                            }}
                        />
                    ))}
                    <span
                        style={{
                            position: 'relative',
                            color: lastPoints >= 50 ? '#e9d5ff' : '#fef3c7',
                            fontWeight: 900,
                            fontSize: 'clamp(1.6rem, 5vw, 2.35rem)',
                            fontStyle: 'italic',
                            letterSpacing: '1.5px',
                            textShadow:
                                lastPoints >= 50
                                    ? '0 0 18px rgba(168,85,247,0.95), 0 0 40px rgba(126,34,206,0.6), 0 4px 12px rgba(0,0,0,0.7)'
                                    : '0 0 18px rgba(252,211,77,0.95), 0 0 40px rgba(245,158,11,0.55), 0 4px 12px rgba(0,0,0,0.7)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {message}
                    </span>
                </div>
            )}

            {/* MIDDLE LAYOUT */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '0', zIndex: 5, pointerEvents: 'none' }}>
                


            </div>

            {/* CONTROLES DE GAMEPLAY — MEIAS-LUAS LATERAIS + JOYSTICK CENTRAL */}
            <div className="farm-controls-layer" style={{ opacity: menuOpacity }}>
                {farmMode === 'six_seven' && (
                    <button
                        type="button"
                        className="farm-crescent farm-crescent-left"
                        aria-label="Farmar aura com o botão 6"
                        onPointerDown={(e) => handleFarmPointerDown('left', e)}
                        onPointerUp={(e) => handleFarmPointerUp('left', e)}
                        onPointerCancel={(e) => handleFarmPointerUp('left', e)}
                    >
                        <span className="farm-crescent-number">6</span>
                        <span className="farm-crescent-label">AURA</span>
                    </button>
                )}

                <div className="premium-joystick-area">
                    <Joystick size={92} opacity={0.6} />
                </div>

                {farmMode === 'six_seven' && (
                    <button
                        type="button"
                        className="farm-crescent farm-crescent-right"
                        aria-label="Farmar aura com o botão 7"
                        onPointerDown={(e) => handleFarmPointerDown('right', e)}
                        onPointerUp={(e) => handleFarmPointerUp('right', e)}
                        onPointerCancel={(e) => handleFarmPointerUp('right', e)}
                    >
                        <span className="farm-crescent-number">7</span>
                        <span className="farm-crescent-label">AURA</span>
                    </button>
                )}
            </div>

            {/* BOTÕES LADO ESQUERDO (Mapa e Modo Farm) */}
            <div style={{
                position: 'absolute', left: '15px', top: '40%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'auto',
                display: 'flex', flexDirection: 'column', gap: '15px'
            }}>
                {/* Botão Modos de Farm */}
                <div className="top-btn anim-float" style={{ 
                    width: '45px', height: '45px', borderRadius: '50%', position: 'relative',
                    background: showFarmModal ? 'rgba(234, 179, 8, 0.4)' : 'var(--bg-glass)',
                    border: showFarmModal ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: showFarmModal ? '0 0 15px rgba(234, 179, 8, 0.5)' : 'none'
                }} onClick={() => setShowFarmModal(true)}>
                    <Sparkles size={22} color={showFarmModal ? "#fff" : "#eab308"} />
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

                {/* Banco de Orbes */}
                <div className="top-btn anim-float" style={{
                    width: '45px', height: '45px', borderRadius: '50%', position: 'relative',
                    background: showOrbModal ? 'rgba(239, 68, 68, 0.4)' : 'var(--bg-glass)',
                    border: showOrbModal ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: showOrbModal ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none'
                }} onClick={() => setShowOrbModal(true)}>
                    <Circle size={22} color={showOrbModal ? '#fff' : '#ef4444'} fill={showOrbModal ? '#fecaca' : '#ef4444'} />
                    <div style={{
                        position: 'absolute', top: '-5px', right: '-5px',
                        background: '#ef4444', color: '#fff', borderRadius: '50%',
                        minWidth: '20px', height: '20px', padding: '0 4px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        fontSize: '0.55rem', fontWeight: 'bold', border: '2px solid #000'
                    }}>
                        {orbBank > 99 ? '99+' : orbBank}
                    </div>
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

                {/* Botão Duelo (Farma VS) */}
                {isOnlineMode && (
                    <div className="top-btn anim-float" style={{ 
                        width: '45px', height: '45px', borderRadius: '50%', 
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
                        animationDelay: '0.2s'
                    }} onClick={() => setShowDuelModal(true)}>
                        <Swords size={22} color="#ef4444" />
                    </div>
                )}
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

            {/* MODAL BANCO DE ORBES */}
            {showOrbModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto'
                }} onClick={() => setShowOrbModal(false)}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                        border: '2px solid #ef4444', borderRadius: '16px',
                        width: '90%', maxWidth: '380px', padding: '24px',
                        boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Circle color="#ef4444" fill="#ef4444" size={22} /> Orbes
                            </h2>
                            <button onClick={() => setShowOrbModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{
                            textAlign: 'center',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            borderRadius: '12px',
                            padding: '20px 16px',
                            marginBottom: '16px'
                        }}>
                            <div style={{ color: '#fecaca', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                                Você tem
                            </div>
                            <div style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>
                                {orbBank}
                            </div>
                            <div style={{ color: '#f87171', fontSize: '0.9rem', marginTop: '4px' }}>
                                {orbBank === 1 ? 'orbe' : 'orbes'}
                            </div>
                        </div>

                        <p style={{ margin: 0, textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.45 }}>
                            Em breve você poderá trocar orbes por poderes na mesa de feitiços.
                        </p>
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
                                <Sparkles color="#eab308" /> Modos de Farm
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
                                const { isFarmBlocked, unblockFarmMode } = useAuraSystem.getState();
                                if (isFarmBlocked) {
                                    unblockFarmMode();
                                }
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
                position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                width: 'min(92%, 560px)', height: '52px', padding: '0 12px', borderRadius: '18px',
                background: comboCount > 50 ? 'rgba(30,5,5,0.95)' : 'rgba(15,10,20,0.95)', 
                border: `1.5px solid ${comboCount > 50 ? '#f87171' : comboCount > 10 ? '#a855f7' : 'rgba(255,255,255,0.15)'}`, 
                boxShadow: comboCount > 50 ? '0 10px 25px rgba(248,113,113,0.4)' : '0 10px 25px rgba(0,0,0,0.7)', 
                backdropFilter: 'blur(20px)', pointerEvents: 'auto', zIndex: 10, opacity: menuOpacity, transition: 'opacity 0.5s'
            }}>
                
                {/* COMBO DESTAQUE */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1.2 }}>
                    <div style={{ 
                        flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%', 
                        background: comboCount > 50 ? 'radial-gradient(circle, rgba(248,113,113,0.3), transparent)' : 'radial-gradient(circle, rgba(168,85,247,0.3), transparent)', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', 
                        border: `1.5px solid ${comboCount > 50 ? '#f87171' : '#a855f7'}`
                    }}>
                        <Flame size={18} color={comboCount > 50 ? "#f87171" : "#a855f7"} className={comboCount > 10 ? "anim-wobble" : ""} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ color: comboCount > 50 ? '#fca5a5' : '#d8b4fe', fontSize: '0.55rem', fontWeight: '900', letterSpacing: '2px', whiteSpace: 'nowrap' }}>COMBO</span>
                        <span className={comboCount > 10 ? 'anim-epic-combo' : ''} style={{ 
                            color: comboCount > 50 ? '#f87171' : '#fff', 
                            fontSize: comboCount > 99999 ? '1rem' : comboCount > 999 ? '1.2rem' : '1.45rem', 
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
                {farmMode === 'free' ? (
                    <>
                        <div style={{ flex: 1, touchAction: 'none', pointerEvents: 'auto' }} onPointerDown={(e) => handleFarmPointerDown('left', e)} onPointerUp={(e) => handleFarmPointerUp('left', e)} onPointerCancel={(e) => handleFarmPointerUp('left', e)} />
                        <div style={{ width: '40%', pointerEvents: 'none' }}></div>
                        <div style={{ flex: 1, touchAction: 'none', pointerEvents: 'auto' }} onPointerDown={(e) => handleFarmPointerDown('right', e)} onPointerUp={(e) => handleFarmPointerUp('right', e)} onPointerCancel={(e) => handleFarmPointerUp('right', e)} />
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
                                RANKING SEMANAL
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px' }}>
                                <div className="ranking-modal-row">
                                    <span className="ranking-modal-lbl">MINHA POSIÇÃO</span>
                                    <span className="ranking-modal-val" style={{ color: '#fcd34d' }}>
                                        {isLoadingRank ? '...' : `#${myRank || '?'}`}
                                    </span>
                                </div>
                                <div className="ranking-modal-row" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                                    <span className="ranking-modal-lbl">AURA DA SEMANA</span>
                                    <span className="ranking-modal-val" style={{ color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.2rem' }}>
                                        <Sparkles size={16} color="#d8b4fe" className="anim-pulse" /> {formatGameNumber(weeklyAura)}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div style={{ color: '#888', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center', letterSpacing: '2px' }}>TOP 50 SEMANAL</div>
                                
                                <div className="ranking-modal-scroll">
                                    {isLoadingRank && <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>CARREGANDO...</div>}
                                    {!isLoadingRank && weeklyRanking.length === 0 && (
                                        <div style={{ textAlign: 'center', color: '#888', marginTop: '20px', fontSize: '0.85rem' }}>
                                            Ninguém pontuou nesta semana ainda.
                                        </div>
                                    )}
                                    {!isLoadingRank && weeklyRanking.map(player => (
                                        <div key={player.rank} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px',
                                            background: player.rank % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <span style={{ 
                                                    color: player.rank === 1 ? '#ffd700' : player.rank === 2 ? '#c0c0c0' : player.rank === 3 ? '#cd7f32' : '#888',
                                                    fontWeight: '900', fontSize: '1.1rem', width: '35px', textAlign: 'center',
                                                    textShadow: player.rank <= 3 ? '0 0 10px currentColor' : 'none'
                                                }}>#{player.rank}</span>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ color: player.rank <= 3 ? '#fff' : '#ccc', fontWeight: 'bold', fontSize: '0.9rem' }}>{player.name}</span>
                                                    {WEEKLY_TOP_REWARDS[player.rank] > 0 && (
                                                        <span style={{ color: '#34d399', fontWeight: '800', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            +{WEEKLY_TOP_REWARDS[player.rank]} <AuracashIcon size={9} color="#34d399" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ color: '#d8b4fe', fontWeight: 'bold', fontSize: '0.85rem' }}>{player.score.toLocaleString()}</span>
                                                <Sparkles size={10} color="#d8b4fe" />
                                            </div>
                                        </div>
                                    ))}
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

            {/* Chat Multiplayer */}
            {isOnlineMode && <MultiplayerChat />}

            {/* Modais de Duelo */}
            {showDuelModal && <DuelModal onClose={() => setShowDuelModal(false)} />}
            {isOnlineMode && <DuelInvitePopup />}
        </div>
    );
}