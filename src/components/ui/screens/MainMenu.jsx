import { AuracashIcon } from '../AuracashIcon';
import React, { useState, useEffect } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { useRankingSystem } from '../../../systems/useRankingSystem';
import { useMultiplayerSystem } from '../../../systems/useMultiplayerSystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { useAudioSystem } from '../../../systems/useAudioSystem';
import { usePWASystem } from '../../../systems/usePWASystem';
import { 
    Menu, User, Shield, ScrollText, Star, ShoppingCart, Play, Settings, Info, ShieldAlert, FileText, X, Globe, Trophy, Target, CheckCircle, LogOut, Users, Plus, Sparkles, Volume2, VolumeX, Download
} from 'lucide-react';
import splashImg from '../../../assets/splash.png';
import { auth } from '../../../config/firebase';
import { signOut } from 'firebase/auth';


export function MainMenu() {
    const setScreen = useUISystem(state => state.setScreen);
    const { aura, comboCount, weeklyAura } = useAuraSystem();
    const stats = useUISystem(state => state.playerStats);
    const updateStats = useUISystem(state => state.updateStats);
    const activeModel = usePlayerSystem(state => state.activeModel);
    const nickname = stats.nickname || 'Marcos';

    const [dailyQuests, setDailyQuests] = useState([]);
    const [rankings, setRankings] = useState({ global: [], combo: [], weekly: [], isLoading: true });
    const [hasUnclaimedAchievements, setHasUnclaimedAchievements] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showLobbyModal, setShowLobbyModal] = useState(false);
    const [rankingType, setRankingType] = useState('global');
    
    const { joinRoom, getGlobalOnlineCount } = useMultiplayerSystem();
    const [onlinePlayers, setOnlinePlayers] = useState(0);

    // Busca contador de jogadores online a cada 5s enquanto o modal estiver aberto (ou periodicamente)
    useEffect(() => {
        let interval;
        const fetchCount = async () => {
            const count = await getGlobalOnlineCount();
            setOnlinePlayers(count);
        };
        fetchCount();
        interval = setInterval(fetchCount, 5000);
        return () => clearInterval(interval);
    }, [getGlobalOnlineCount]);

    const MAX_PLAYERS = 30;
    const setIsOnlineMode = useUISystem(state => state.setIsOnlineMode);
    const [isJoining, setIsJoining] = useState(false);

    const [progression, setProgression] = useState(null);

    // Carrega dados na inicialização
    useEffect(() => {
        import('../../../systems/progressionRules').then(rules => {
            setProgression(rules);
        });

        import('../../../systems/useQuestSystem').then(m => {
            const unsub = m.useQuestSystem.subscribe((state) => {
                setDailyQuests(state.dailyQuests);
            });
            setDailyQuests(m.useQuestSystem.getState().dailyQuests);
        });

        import('../../../systems/useAchievementSystem').then(m => {
            const unsub = m.useAchievementSystem.subscribe((state) => {
                const unclaimed = state.achievements.some(a => a.completed && !a.claimed);
                setHasUnclaimedAchievements(unclaimed);
            });
            const unclaimed = m.useAchievementSystem.getState().achievements.some(a => a.completed && !a.claimed);
            setHasUnclaimedAchievements(unclaimed);
        });

        import('../../../systems/useRankingSystem').then(m => {
            m.useRankingSystem.getState().fetchRankings();
            const unsub = m.useRankingSystem.subscribe((state) => {
                setRankings({ 
                    global: state.globalRanking, 
                    combo: state.comboRanking, 
                    weekly: state.weeklyRanking, 
                    isLoading: state.isLoading 
                });
            });
        });
    }, []);

    const handleJoinRoom = async (roomId) => {
        setIsJoining(true);
        const aura = useAuraSystem.getState().aura || 0;
        const success = await joinRoom(roomId, { 
            name: nickname, 
            model: activeModel || 'san.vrm',
            aura
        });
        if (success) {
            setIsOnlineMode(true);
            setScreen('GAME');
        }
        setIsJoining(false);
    };

    const handleCreateRoom = async () => {
        const currentCount = Object.keys(rooms).length;
        const roomName = `Farmaverso ${currentCount + 1}`;
        const roomId = await createRoom(roomName);
        if (roomId) {
            handleJoinRoom(roomId);
        }
    };

    const handleClaimReward = async (questId) => {
        const m = await import('../../../systems/useQuestSystem');
        const reward = m.useQuestSystem.getState().claimQuest(questId);
        if (reward > 0) {
            const currentDiamonds = useUISystem.getState().playerStats.diamonds || 0;
            const newDiamonds = currentDiamonds + reward;
            updateStats({ diamonds: newDiamonds });
            Promise.all([
                import('../../../systems/usePlayerSystem'),
                import('../../../systems/useAuraSystem'),
                import('../../../systems/useDatabaseSystem')
            ]).then(([pSys, aSys, dbSys]) => {
                const pos = pSys.usePlayerSystem.getState().position;
                const model = pSys.usePlayerSystem.getState().activeModel;
                const combo = aSys.useAuraSystem.getState().comboCount;
                const maxC = aSys.useAuraSystem.getState().maxCombo;
                const currAura = aSys.useAuraSystem.getState().aura;
                
                dbSys.useDatabaseSystem.getState().saveGameState(
                    pos, combo, model, currAura, newDiamonds, maxC, m.useQuestSystem.getState().dailyQuests, m.useQuestSystem.getState().lastResetDate
                );
            });
        }
    };

    const handleLogout = async () => {
        try {
            // Salva o estado atual ANTES de deslogar
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

            await signOut(auth);
            setScreen('LOGIN');
        } catch (error) {
            console.error('Erro ao sair:', error);
            setScreen('LOGIN'); 
        }
    };

    // Cálculos de progressão dinâmicos
    const level = progression ? progression.getPlayerLevel(aura) : 1;
    const title = progression ? progression.getPlayerTitle(level) : 'Carregando...';
    const auraToNextLevel = progression ? progression.getAuraToNextLevel(aura) : 500;
    const nextLevel = level + 1;
    
    const nextTitleData = progression ? progression.getNextTitle(level) : null;
    const auraToNextTitle = progression ? progression.getAuraToNextTitle(level, aura) : 0;

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: '#050505', 
            pointerEvents: 'auto', zIndex: 50,
            fontFamily: 'sans-serif', color: '#fff',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
            <img 
                src={splashImg} 
                alt="Background" 
                style={{
                    position: 'absolute', top: 0, left: 0, 
                    width: '100%', height: '100%', 
                    objectFit: 'cover', zIndex: -1,
                    opacity: 0.35 // Escurecido para não prejudicar a leitura e focar no UI
                }}
            />
            <style>{`
                .home-scroll { flex: 1; overflow-y: auto; padding-bottom: 75px; }
                .home-scroll::-webkit-scrollbar { display: none; }
                
                @keyframes floatAnim {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 10px rgba(168,85,247,0.3); }
                    50% { box-shadow: 0 0 25px rgba(168,85,247,0.8); }
                }
                @keyframes notifPulse {
                    0%, 100% { box-shadow: 0 0 15px rgba(245,158,11,0.6); border-color: rgba(245,158,11,0.5); transform: translateY(0); background: rgba(245,158,11,0.2); }
                    50% { box-shadow: 0 0 35px rgba(245,158,11,1); border-color: rgba(245,158,11,1); transform: translateY(-5px) scale(1.1); background: rgba(245,158,11,0.4); }
                }
                
                .icon-circle.has-notif {
                    animation: notifPulse 1.5s infinite ease-in-out !important;
                }
                
                .drawer {
                    position: fixed; top: 0; left: 0; width: 250px; height: 100%;
                    background: rgba(15, 12, 25, 0.95); backdrop-filter: blur(20px);
                    border-right: 1px solid rgba(255,255,255,0.05); z-index: 200;
                    transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex; flex-direction: column; padding: 15px;
                }
                .drawer.open { transform: translateX(0); }
                .drawer-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.6); z-index: 199;
                    opacity: 0; pointer-events: none; transition: opacity 0.3s;
                }
                .drawer-overlay.open { opacity: 1; pointer-events: auto; }
                
                .drawer-btn {
                    display: flex; align-items: center; gap: 10px; padding: 12px;
                    color: #ccc; font-weight: bold; border-radius: 10px; cursor: pointer;
                    transition: all 0.2s; margin-bottom: 5px; font-size: 0.8rem;
                }
                .drawer-btn:hover { background: rgba(168,85,247,0.2); color: #fff; transform: translateX(5px); }

                .top-header {
                    display: flex; align-items: center; gap: 8px; padding: 4px 15px 2px 15px;
                    background: transparent;
                    position: relative;
                }

                .icon-row {
                    display: flex; justify-content: space-between; padding: 0 10px; margin: 8px 0;
                    overflow-x: auto; gap: 5px;
                }
                .icon-row::-webkit-scrollbar { display: none; }
                
                .icon-btn {
                    display: flex; flex-direction: column; align-items: center; gap: 4px;
                    cursor: pointer; flex: 1; min-width: 0; text-align: center;
                }
                .icon-circle {
                    width: 40px; height: 40px; border-radius: 12px;
                    background: rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center;
                    border: 1px solid rgba(255,255,255,0.08); transition: all 0.2s;
                    backdrop-filter: blur(8px);
                    animation: floatAnim 3s infinite ease-in-out;
                }
                .icon-btn:hover .icon-circle { background: rgba(168,85,247,0.2); border-color: #a855f7; transform: translateY(-3px) scale(1.1); }
                .icon-label { font-size: 0.45rem; font-weight: 900; color: #aaa; letter-spacing: 0; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; }

                .play-card {
                    margin: 0 15px 12px 15px; padding: 10px 15px; border-radius: 16px;
                    background: linear-gradient(135deg, rgba(168,85,247,0.4), rgba(107,33,168,0.4), rgba(236,72,153,0.4));
                    background-size: 200% 200%;
                    backdrop-filter: blur(12px);
                    animation: gradientMove 5s ease infinite, pulseGlow 2s infinite;
                    border: 1px solid rgba(255,255,255,0.15);
                    box-shadow: 0 5px 20px rgba(168,85,247,0.2);
                    display: flex; justify-content: space-between; align-items: center;
                    cursor: pointer; transition: transform 0.2s; position: relative; overflow: hidden;
                }
                @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .play-card:active { transform: scale(0.95); }
                .play-card::before {
                    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%);
                    animation: pulseLight 3s infinite; pointer-events: none;
                }
                @keyframes pulseLight { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }

                .info-card {
                    margin: 0 15px 10px 15px; padding: 12px 15px; border-radius: 14px;
                    background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255,255,255,0.08);
                    backdrop-filter: blur(12px);
                    transition: transform 0.2s, background 0.3s;
                }
                .info-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.06); }
                .card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #a855f7; font-weight: 900; letter-spacing: 1px; font-size: 0.7rem; }

                .prog-bar { width: 100%; height: 5px; background: rgba(0,0,0,0.5); border-radius: 3px; margin-top: 4px; overflow: hidden; }
                .prog-fill { height: 100%; background: linear-gradient(90deg, #a855f7, #ec4899); position: relative; }
                .prog-fill::after {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
                    animation: shimmer 1.5s infinite;
                }
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

                .fixed-footer {
                    position: fixed; bottom: 0; left: 0; width: 100%; height: 50px;
                    background: rgba(10,5,20,0.95); backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(255,255,255,0.05);
                    display: flex; justify-content: center; align-items: center; padding: 0 10px; gap: 10px;
                    z-index: 100;
                }
                .footer-btn {
                    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
                    padding: 6px; border-radius: 10px; font-weight: 900; font-size: 0.7rem; cursor: pointer;
                    transition: all 0.2s; letter-spacing: 0.5px;
                }
                .btn-global { background: rgba(255,215,0,0.1); color: #ffd700; border: 1px solid rgba(255,215,0,0.3); }
                .btn-weekly { background: rgba(168,85,247,0.1); color: #d8b4fe; border: 1px solid rgba(168,85,247,0.3); }
                .btn-global:hover { background: rgba(255,215,0,0.2); }
                .btn-weekly:hover { background: rgba(168,85,247,0.2); }
                .footer-btn:active { transform: scale(0.92); }

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

            {/* OVERLAY E MENU LATERAL */}
            <div className={`drawer-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
            <div className={`drawer ${isMenuOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#fff', letterSpacing: '2px' }}>OPÇÕES</div>
                    <X size={24} color="#888" cursor="pointer" onClick={() => setIsMenuOpen(false)} />
                </div>
                
                <div className="drawer-btn" onClick={() => {
                    import('../../../systems/useAudioSystem').then(m => m.useAudioSystem.getState().toggleMute());
                }}>
                    {useAudioSystem(state => state.isMuted) ? <VolumeX size={18} /> : <Volume2 size={18} />} 
                    {useAudioSystem(state => state.isMuted) ? 'MÚSICA: DESLIGADA' : 'MÚSICA: LIGADA'}
                </div>
                <div className="drawer-btn" onClick={() => { setIsMenuOpen(false); setShowAboutModal(true); }}><Info size={18} /> SOBRE O GAME</div>
                
                {usePWASystem(state => state.isInstallable) && (
                    <div className="drawer-btn" style={{ color: '#4ade80' }} onClick={() => usePWASystem.getState().installPWA()}>
                        <Download size={18} /> INSTALAR APP
                    </div>
                )}

                <div className="drawer-btn" style={{ marginTop: '20px', color: '#f87171' }} onClick={handleLogout}>
                    <LogOut size={18} /> SAIR DA CONTA
                </div>

                <div style={{ marginTop: 'auto', textAlign: 'center', color: '#666', fontSize: '0.6rem' }}>FARM AI v1.0.0</div>
            </div>

            {/* CONTEÚDO ROLÁVEL */}
            <div className="home-scroll">
                
                {/* 1. CABEÇALHO */}
                <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1 }}>
                        <div onClick={() => setScreen('PROFILE')} style={{ flexShrink: 0, cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', background: '#222', border: '2px solid #a855f7', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', boxShadow: '0 0 10px rgba(168,85,247,0.5)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                            <User size={16} color="#a855f7" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', minWidth: 0 }}>
                            <div style={{ color: '#ccc', fontSize: '0.6rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>OLÁ, <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '900' }}>{nickname.toUpperCase()}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                                <div style={{ background: 'linear-gradient(to right, #a855f7, #6b21a8)', color: '#fff', padding: '1px 4px', borderRadius: '4px', fontSize: '0.45rem', fontWeight: 'bold', flexShrink: 0 }}>LV {level}</div>
                                <div style={{ color: '#d8b4fe', fontSize: '0.55rem', fontWeight: '900', fontStyle: 'italic', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, zIndex: 10 }}>
                        <div className="anim-float" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(168,85,247,0.1)', padding: '2px 6px', borderRadius: '8px', border: '1px solid rgba(168,85,247,0.3)' }}>
                            <Sparkles size={10} color="#a855f7" />
                            <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>{Math.floor(aura).toLocaleString()}</span>
                        </div>
                        <div className="anim-float" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(52,211,153,0.1)', padding: '2px 6px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.3)', animationDelay: '0.5s' }}>
                            <AuracashIcon size={10} color="#34d399" />
                            <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>{stats.diamonds ? stats.diamonds.toLocaleString() : 0}</span>
                        </div>
                        <div onClick={() => setIsMenuOpen(true)} style={{ cursor: 'pointer' }}>
                            <Menu size={20} color="#fff" />
                        </div>
                    </div>
                </div>

                {/* 2. ÍCONES LADO A LADO */}
                <div className="icon-row">
                    <div className="icon-btn" onClick={() => setScreen('CHARACTERS')}>
                        <div className="icon-circle" style={{ animationDelay: '0s' }}><User size={20} color="#4ade80" /></div>
                        <span className="icon-label">PERSONAGENS</span>
                    </div>
                    <div className="icon-btn" onClick={() => setScreen('ACHIEVEMENTS')}>
                        <div className={`icon-circle ${hasUnclaimedAchievements ? 'has-notif' : ''}`} style={{ animationDelay: '0.2s' }}>
                            <Shield size={20} color={hasUnclaimedAchievements ? '#fbbf24' : '#60a5fa'} />
                        </div>
                        <span className="icon-label" style={{ color: hasUnclaimedAchievements ? '#fbbf24' : '#aaa' }}>CONQUISTAS</span>
                    </div>
                    <div className="icon-btn" onClick={() => setScreen('QUESTS')}>
                        <div className="icon-circle" style={{ animationDelay: '0.4s' }}><ScrollText size={20} color="#fcd34d" /></div>
                        <span className="icon-label">MISSÕES</span>
                    </div>
                    <div className="icon-btn">
                        <div className="icon-circle" style={{ animationDelay: '0.6s' }}><Star size={20} color="#f43f5e" /></div>
                        <span className="icon-label">EVENTOS</span>
                    </div>
                    <div className="icon-btn" onClick={() => setScreen('STORE')}>
                        <div className="icon-circle" style={{ animationDelay: '0.8s' }}><ShoppingCart size={20} color="#34d399" /></div>
                        <span className="icon-label">LOJA</span>
                    </div>
                </div>

                {/* 3. CARDS DE JOGO (LOCAL E ONLINE) */}
                <div style={{ display: 'flex', gap: '15px', margin: '0 15px 12px 15px' }}>
                    
                    {/* FARMAR LOCAL */}
                    <div className="play-card" onClick={() => { setIsOnlineMode(false); setScreen('GAME'); }} style={{ margin: 0, flex: 1, padding: '12px', background: 'linear-gradient(135deg, rgba(52,211,153,0.3), rgba(16,185,129,0.3))', borderColor: 'rgba(52,211,153,0.3)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 1 }}>
                            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>SOZINHO</div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '900', letterSpacing: '1px' }}>LOCAL</div>
                        </div>
                        <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                            <Play size={16} color="#10b981" style={{ marginLeft: '3px' }} />
                        </div>
                    </div>

                    {/* FARMAR ONLINE */}
                    <div className="play-card" onClick={() => setShowLobbyModal(true)} style={{ margin: 0, flex: 1, padding: '12px', background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(236,72,153,0.4))' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 1 }}>
                            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>FARMAVERSO</div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '900', letterSpacing: '1px' }}>ONLINE</div>
                        </div>
                        <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                            <Globe size={16} color="#a855f7" />
                        </div>
                    </div>

                </div>

                {/* 4. ASCENSÃO DA AURA */}
                <div className="info-card">
                    <div className="card-header"><Target size={16} /> ASCENSÃO DA AURA</div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: '#aaa' }}>
                            <span>FALTAM {auraToNextLevel.toLocaleString()}</span>
                            <span style={{ color: '#fff' }}>LV {nextLevel}</span>
                        </div>
                        <div className="prog-bar"><div className="prog-fill" style={{ width: `${((500 - auraToNextLevel) / 500) * 100}%` }}></div></div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: '#aaa' }}>
                            <span>{nextTitleData ? `FALTAM ${auraToNextTitle.toLocaleString()}` : "DEUS SUPREMO"}</span>
                            <span style={{ color: '#d8b4fe' }}>{nextTitleData ? `PRÓX. TÍTULO: ${nextTitleData.name.toUpperCase()}` : 'MÁXIMO ALCANÇADO'}</span>
                        </div>
                        <div className="prog-bar">
                            <div className="prog-fill" style={{ 
                                width: nextTitleData 
                                    ? `${Math.min(100, Math.max(0, (Math.floor(aura) / ((nextTitleData.minLevel - 1) * 500)) * 100))}%` 
                                    : '100%' 
                            }}></div>
                        </div>
                    </div>
                </div>

                {/* 5. MISSÕES DIÁRIAS (REAIS) */}
                <div className="info-card">
                    <div className="card-header"><CheckCircle size={16} /> MISSÕES DIÁRIAS</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {dailyQuests.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                Carregando missões ou sem missões ativas...
                            </div>
                        )}
                        {dailyQuests.map((quest) => (
                            <div key={quest.id} style={{ 
                                background: quest.claimed ? 'rgba(52,211,153,0.1)' : 'rgba(0,0,0,0.4)', 
                                border: quest.claimed ? '1px solid rgba(52,211,153,0.3)' : '1px solid transparent',
                                padding: '12px', borderRadius: '12px', transition: 'all 0.3s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ 
                                        fontSize: '0.8rem', fontWeight: 'bold', 
                                        color: quest.claimed ? '#34d399' : '#ccc',
                                        textDecoration: quest.claimed ? 'line-through' : 'none'
                                    }}>
                                        {quest.title}
                                    </span>
                                    {!quest.claimed && quest.progress < quest.target && (
                                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#a855f7' }}>+{quest.reward} <AuracashIcon size={10} style={{ display: 'inline', verticalAlign: 'baseline' }} /></span>
                                    )}
                                    {quest.progress >= quest.target && !quest.claimed && (
                                        <button 
                                            onClick={() => handleClaimReward(quest.id)}
                                            style={{
                                                background: 'linear-gradient(45deg, #f59e0b, #fbbf24)',
                                                border: 'none', padding: '4px 8px', borderRadius: '6px',
                                                color: '#000', fontWeight: '900', fontSize: '0.65rem',
                                                cursor: 'pointer', animation: 'pulseGlow 1.5s infinite',
                                                boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
                                            }}
                                        >
                                            COLETAR
                                        </button>
                                    )}
                                    {quest.claimed && (
                                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#34d399' }}>COLETADO</span>
                                    )}
                                </div>
                                {!quest.claimed && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                        <div className="prog-bar" style={{ height: '4px', flex: 1, margin: 0 }}>
                                            <div className="prog-fill" style={{ width: `${(quest.progress / quest.target) * 100}%` }}></div>
                                        </div>
                                        <span style={{ fontSize: '0.6rem', color: '#888', fontWeight: 'bold' }}>
                                            {Math.floor(quest.progress)} / {quest.target}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5.5 RANKING MAIORES COMBOS */}
                <div className="info-card">
                    <div className="card-header" style={{ color: '#fbbf24' }}>
                        <Trophy size={16} /> MAIORES COMBOS GLOBAIS
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {rankings.isLoading && <div style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>Carregando dados...</div>}
                        {!rankings.isLoading && rankings.combo.length === 0 && <div style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>Nenhum recorde ainda.</div>}
                        {!rankings.isLoading && rankings.combo.slice(0, 5).map(player => (
                            <div key={player.rank} style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '10px',
                                border: player.rank === 1 ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ 
                                        color: player.rank === 1 ? '#fbbf24' : player.rank === 2 ? '#9ca3af' : player.rank === 3 ? '#b45309' : '#6b7280', 
                                        fontWeight: '900', fontSize: '0.9rem', width: '25px' 
                                    }}>#{player.rank}</span>
                                    <span style={{ color: '#ccc', fontSize: '0.8rem', fontWeight: 'bold' }}>{player.name}</span>
                                </div>
                                <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {(player.score || 0).toLocaleString()} <span style={{ fontSize: '0.5rem', color: '#888' }}>HITS</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. EVENTOS */}
                <div className="info-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(45deg, rgba(244,63,94,0.1), rgba(0,0,0,0.5))', borderColor: 'rgba(244,63,94,0.2)' }}>
                    <div>
                        <div className="card-header" style={{ color: '#f43f5e', marginBottom: '5px' }}><Star size={16} /> EVENTO ATIVO</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>DEUS DA AURA</div>
                        <div style={{ fontSize: '0.7rem', color: '#fb7185', fontWeight: 'bold', marginTop: '4px' }}>BÔNUS DE +500% AURA!</div>
                    </div>
                    <div style={{ width: '50px', height: '50px', borderRadius: '25px', background: 'rgba(244,63,94,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Star size={24} color="#f43f5e" />
                    </div>
                </div>

            </div>

            {/* 7. RODAPÉ FIXO DE RANKING */}
            <div className="fixed-footer">
                <div className="footer-btn btn-global" onClick={() => { 
                    setRankingType('global'); 
                    setShowRankingModal(true);
                    import('../../../systems/useRankingSystem').then(m => m.useRankingSystem.getState().fetchRankings());
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Globe size={14} /> RANKING GLOBAL
                        </div>
                        <div style={{ fontSize: '0.55rem', color: '#fff', opacity: 0.8, marginTop: '2px' }}>
                            {rankings.isLoading ? 'CARREGANDO...' : `VOCÊ É O TOP #${useRankingSystem.getState().getMyPosition(rankings.global) || '?'}`}
                        </div>
                    </div>
                </div>
                <div className="footer-btn btn-weekly" onClick={() => { 
                    setRankingType('weekly'); 
                    setShowRankingModal(true);
                    import('../../../systems/useRankingSystem').then(m => m.useRankingSystem.getState().fetchRankings());
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trophy size={14} /> RANKING SEMANAL
                        </div>
                        <div style={{ fontSize: '0.55rem', color: '#fff', opacity: 0.8, marginTop: '2px' }}>
                            {rankings.isLoading ? 'CARREGANDO...' : `VOCÊ É O TOP #${useRankingSystem.getState().getMyPosition(rankings.weekly) || '?'}`}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE RANKING ORIGINAL RESTAURADO */}
            {showRankingModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 300, pointerEvents: 'auto'
                }} onClick={() => setShowRankingModal(false)}>
                    
                    <div className="ranking-modal" onClick={e => e.stopPropagation()}>
                        <div className="ranking-modal-content">
                            <div className="ranking-modal-title">
                                <Trophy size={24} style={{marginRight: '10px', verticalAlign: 'middle', paddingBottom: '4px'}} color="#fcd34d"/> 
                                {rankingType === 'global' ? 'MEU RANKING GLOBAL' : 'MEU RANKING SEMANAL'}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px' }}>
                                <div className="ranking-modal-row">
                                    <span className="ranking-modal-lbl">MINHA POSIÇÃO</span>
                                    <span className="ranking-modal-val" style={{ color: '#fcd34d' }}>
                                        {rankings.isLoading ? '...' : `#${useRankingSystem.getState().getMyPosition(rankingType === 'global' ? rankings.global : rankings.weekly)}`}
                                    </span>
                                </div>
                                <div className="ranking-modal-row" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                                    <span className="ranking-modal-lbl">TOTAL AURA {rankingType === 'weekly' ? 'SEMANAL' : ''}</span>
                                    <span className="ranking-modal-val" style={{ color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.2rem' }}>
                                        <Sparkles size={16} color="#fcd34d" /> 
                                        {rankingType === 'global' ? Math.floor(aura).toLocaleString() : Math.floor(weeklyAura || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div style={{ color: '#888', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center', letterSpacing: '2px' }}>
                                    {rankingType === 'global' ? 'TOP 50 GLOBAL' : 'TOP 50 SEMANAL'}
                                </div>
                                
                                <div className="ranking-modal-scroll">
                                    {rankings.isLoading && <div style={{ textAlign: 'center', color: '#888' }}>Carregando...</div>}
                                    {!rankings.isLoading && (rankingType === 'global' ? rankings.global : rankings.weekly).map(player => (
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
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: player.rank <= 3 ? '#fff' : '#ccc', fontWeight: 'bold', fontSize: '0.9rem' }}>{player.name}</span>
                                                    {rankingType === 'weekly' && player.rank <= 3 && (
                                                        <span style={{ fontSize: '0.5rem', color: '#34d399', fontWeight: 'bold' }}>+{player.rank === 1 ? 100 : player.rank === 2 ? 50 : 20} AuraCash</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ color: '#a855f7', fontWeight: 'bold', fontSize: '0.85rem' }}>{player.score.toLocaleString()}</span>
                                                <Sparkles size={10} color="#a855f7" />
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
                            >
                                FECHAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL LOBBY (EXPLORADOR DE SERVIDORES) */}
            {showLobbyModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 400, pointerEvents: 'auto'
                }} onClick={() => setShowLobbyModal(false)}>
                    
                    <div style={{
                        background: 'rgba(20, 18, 28, 0.95)', border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '24px', padding: '25px', width: '90%', maxWidth: '500px', height: '80vh',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(168, 85, 247, 0.1)',
                        animation: 'modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Globe size={24} color="#a855f7" />
                                <div>
                                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', letterSpacing: '2px' }}>FARMAVERSO</h2>
                                    <div style={{ color: '#a855f7', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' }}>SERVIDORES ONLINE</div>
                                        </div>
                            </div>
                            <X size={24} color="#888" cursor="pointer" onClick={() => setShowLobbyModal(false)} />
                        </div>

                        <div className="ranking-modal-scroll" style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px' }}>
                            {/* Card da Sala Global */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))',
                                border: '1px solid rgba(168,85,247,0.3)',
                                borderRadius: '16px', padding: '20px', marginBottom: '16px'
                            }}>
                                {/* Header do card */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 0 16px rgba(168,85,247,0.5)'
                                        }}>
                                            <Globe size={22} color="#fff" />
                                        </div>
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: '900', fontSize: '1rem', letterSpacing: '1px' }}>SALA GLOBAL</div>
                                            <div style={{ color: '#a855f7', fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '1px' }}>FARMAVERSO</div>
                                        </div>
                                    </div>
                                    {/* Badge ao vivo */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        background: 'rgba(34, 197, 94, 0.15)',
                                        border: '1px solid rgba(34, 197, 94, 0.4)',
                                        borderRadius: '20px', padding: '4px 10px'
                                    }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} className="anim-pulse" />
                                        <span style={{ color: '#22c55e', fontSize: '0.65rem', fontWeight: 'bold' }}>AO VIVO</span>
                                    </div>
                                </div>

                                {/* Contador de jogadores */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Users size={14} color="#a855f7" />
                                            <span style={{ color: '#ccc', fontSize: '0.8rem', fontWeight: 'bold' }}>Jogadores online</span>
                                        </div>
                                        <span style={{ color: '#fff', fontSize: '1rem', fontWeight: '900' }}>
                                            <span style={{ color: onlinePlayers >= MAX_PLAYERS ? '#ef4444' : '#a855f7' }}>{onlinePlayers}</span>
                                            <span style={{ color: '#666' }}>/{MAX_PLAYERS}</span>
                                        </span>
                                    </div>
                                    {/* Barra de capacidade */}
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '3px',
                                            width: `${Math.min(100, (onlinePlayers / MAX_PLAYERS) * 100)}%`,
                                            background: onlinePlayers >= MAX_PLAYERS
                                                ? '#ef4444'
                                                : onlinePlayers >= MAX_PLAYERS * 0.7
                                                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                                : 'linear-gradient(90deg, #a855f7, #ec4899)',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                </div>

                                <p style={{ color: '#888', fontSize: '0.82rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                                    Junte-se a outros jogadores em tempo real no Farmaverso. Faça farm, suba de nível e mostre sua aura! 🌿
                                </p>

                                <button
                                    onClick={() => !isJoining && onlinePlayers < MAX_PLAYERS && handleJoinRoom('global_lobby')}
                                    disabled={isJoining || onlinePlayers >= MAX_PLAYERS}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px',
                                        background: isJoining || onlinePlayers >= MAX_PLAYERS
                                            ? 'rgba(100,100,100,0.5)'
                                            : 'linear-gradient(90deg, #a855f7, #6b21a8)',
                                        border: 'none', color: '#fff', fontWeight: '900',
                                        cursor: isJoining || onlinePlayers >= MAX_PLAYERS ? 'not-allowed' : 'pointer',
                                        fontSize: '1rem', letterSpacing: '1px',
                                        transition: 'all 0.2s ease',
                                        opacity: isJoining ? 0.7 : 1
                                    }}
                                >
                                    {isJoining
                                        ? '⏳ Conectando...'
                                        : onlinePlayers >= MAX_PLAYERS
                                        ? '🔒 SALA CHEIA'
                                        : '🌿 ENTRAR AGORA'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SOBRE O GAME */}
            {showAboutModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 400, pointerEvents: 'auto'
                }} onClick={() => setShowAboutModal(false)}>
                    
                    <div style={{
                        background: 'rgba(20, 18, 28, 0.9)', border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '24px', padding: '30px', width: '90%', maxWidth: '400px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(168, 85, 247, 0.1)',
                        animation: 'modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        textAlign: 'center'
                    }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ 
                            width: '60px', height: '60px', margin: '0 auto 15px auto', 
                            background: 'linear-gradient(135deg, #a855f7, #ec4899)', borderRadius: '15px', 
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            boxShadow: '0 5px 15px rgba(168,85,247,0.5)'
                        }}>
                            <Info size={32} color="#fff" />
                        </div>
                        
                        <h2 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '1.8rem', letterSpacing: '2px', textShadow: '0 0 10px #a855f7' }}>FARM <span style={{ color: '#a855f7' }}>AI</span></h2>
                        <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '2px', marginBottom: '20px' }}>VERSÃO 1.0.0 (BETA)</div>
                        
                        <div style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: '1.6', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px' }}>
                            <p style={{ marginTop: 0 }}>
                                O <strong>FarmAi</strong> é uma plataforma imersiva no Metaverso, onde a coleta de Aura se transforma em evolução. Através de mecânicas rítmicas e foco, os jogadores acumulam energia vital (Aura) que permite avançar de nível, desbloquear conquistas exclusivas e descobrir novos personagens 3D.
                            </p>
                            <p style={{ marginBottom: 0 }}>
                                Esta é a <strong>Versão 1.0.0</strong> focada na fundação da economia de AuraCash, Ranking Global em tempo real e sistema de farm dinâmico. Novas expansões, lojas de itens e eventos épicos estão em desenvolvimento contínuo para transformar sua experiência.
                            </p>
                        </div>
                        
                        <div style={{ marginTop: '20px', color: '#666', fontSize: '0.65rem' }}>
                            Desenvolvido para revolucionar o engajamento através da gamificação.
                        </div>

                        <button 
                            onClick={() => setShowAboutModal(false)}
                            style={{
                                marginTop: '25px', width: '100%', background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                                border: 'none', color: '#fff', padding: '14px', borderRadius: '12px', 
                                fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '2px',
                                boxShadow: '0 5px 15px rgba(168,85,247,0.4)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            INCRÍVEL!
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
