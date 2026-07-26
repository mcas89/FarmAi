import React, { useState, useEffect } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { 
    Menu, User, Shield, ScrollText, Star, ShoppingCart, Play, Settings, Info, ShieldAlert, FileText, X, Diamond, Globe, Trophy, Target, CheckCircle, LogOut
} from 'lucide-react';
import splashImg from '../../../assets/splash.png';
import { auth } from '../../../config/firebase';
import { signOut } from 'firebase/auth';

const MOCK_TOP_100 = [
    { name: 'DeusFamer_99', aura: 2500000000 },
    { name: 'SigmaGrindset', aura: 1800000000 },
    { name: 'AuraKing', aura: 1200000000 },
    ...Array.from({length: 97}, (_, i) => ({
        name: `Farmador_${Math.floor(Math.random() * 9000)+1000}`,
        aura: Math.floor(1000000000 - (i * 10000000) - (Math.random() * 5000000))
    })).sort((a,b) => b.aura - a.aura)
].map((p, i) => ({ ...p, rank: i + 1 }));

export function MainMenu() {
    const setScreen = useUISystem(state => state.setScreen);
    const { aura, title, level, comboCount } = useAuraSystem();
    const stats = useUISystem(state => state.playerStats);
    const updateStats = useUISystem(state => state.updateStats);
    const nickname = stats.nickname || 'Marcos';

    // Importando state de Missões
    const [dailyQuests, setDailyQuests] = useState([]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showRankingModal, setShowRankingModal] = useState(false);

    // Carregar sistema de quests dinamicamente para evitar erro de circular dependência se houver
    useEffect(() => {
        import('../../../systems/useQuestSystem').then(m => {
            const unsub = m.useQuestSystem.subscribe((state) => {
                setDailyQuests(state.dailyQuests);
            });
            setDailyQuests(m.useQuestSystem.getState().dailyQuests);
            return unsub;
        });
    }, []);

    const handleClaimReward = async (questId) => {
        const m = await import('../../../systems/useQuestSystem');
        const reward = m.useQuestSystem.getState().claimQuest(questId);
        if (reward > 0) {
            updateStats({ diamonds: (stats.diamonds || 0) + reward });
            // Força salvar no banco imediatamente com os valores reais
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
                    pos, combo, model, currAura, (stats.diamonds || 0) + reward, maxC, m.useQuestSystem.getState().dailyQuests, m.useQuestSystem.getState().lastResetDate
                );
            });
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setScreen('LOGIN');
        } catch (error) {
            console.error('Erro ao sair:', error);
            setScreen('LOGIN'); 
        }
    };

    // Cálculos de progressão
    const auraToNextLevel = 500 - (Math.floor(aura) % 500);
    const nextLevel = level + 1;

    const getNextTitleThreshold = (currentAura) => {
        const thresholds = [5500, 10000, 15000, 50000, 100000, 250000, 500000, 1000000, 5000000, 10000000, 100000000, 1000000000];
        const next = thresholds.find(t => t > currentAura) || "MÁXIMO ALCANÇADO";
        return next;
    };
    const nextTitleAura = getNextTitleThreshold(aura);
    const auraToNextTitle = nextTitleAura - Math.floor(aura);

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
                    background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
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
                
                <div className="drawer-btn"><Settings size={18} /> CONFIGURAÇÃO</div>
                <div className="drawer-btn"><Info size={18} /> SOBRE O GAME</div>
                <div className="drawer-btn"><ShieldAlert size={18} /> TERMO DE RESPONSABILIDADE</div>
                <div className="drawer-btn"><FileText size={18} /> POLÍTICA DE PRIVACIDADE</div>
                
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
                            <Target size={10} color="#a855f7" />
                            <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>{Math.floor(aura).toLocaleString()}</span>
                        </div>
                        <div className="anim-float" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(52,211,153,0.1)', padding: '2px 6px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.3)', animationDelay: '0.5s' }}>
                            <Diamond size={10} color="#34d399" />
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
                        <div className="icon-circle" style={{ animationDelay: '0.2s' }}><Shield size={20} color="#60a5fa" /></div>
                        <span className="icon-label">CONQUISTAS</span>
                    </div>
                    <div className="icon-btn">
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

                {/* 3. CARD INICIAR JOGO */}
                <div className="play-card" onClick={() => setScreen('GAME')}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 1 }}>
                        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '2px' }}>VAMOS FARMAR</div>
                        <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '1px' }}>INICIAR JOGO</div>
                    </div>
                    <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1, boxShadow: '0 5px 15px rgba(0,0,0,0.3)', transition: 'transform 0.3s' }}>
                        <Play size={20} color="#a855f7" style={{ marginLeft: '3px' }} />
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
                            <span>{typeof nextTitleAura === 'number' ? `FALTAM ${auraToNextTitle.toLocaleString()}` : "DEUS SUPREMO"}</span>
                            <span style={{ color: '#d8b4fe' }}>PRÓXIMO TÍTULO</span>
                        </div>
                        <div className="prog-bar"><div className="prog-fill" style={{ width: `${typeof nextTitleAura === 'number' ? (Math.floor(aura) / nextTitleAura) * 100 : 100}%` }}></div></div>
                    </div>
                </div>

                {/* 5. MISSÕES DIÁRIAS (REAIS) */}
                <div className="info-card">
                    <div className="card-header"><CheckCircle size={16} /> MISSÕES DIÁRIAS</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#a855f7' }}>+{quest.reward} <Diamond size={10} style={{ display: 'inline', verticalAlign: 'baseline' }} /></span>
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
                <div className="footer-btn btn-global" onClick={() => setShowRankingModal(true)}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Globe size={14} /> RANKING GLOBAL
                        </div>
                        <div style={{ fontSize: '0.55rem', color: '#fff', opacity: 0.8, marginTop: '2px' }}>VOCÊ É O TOP #4521</div>
                    </div>
                </div>
                <div className="footer-btn btn-weekly" onClick={() => setShowRankingModal(true)}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trophy size={14} /> RANKING SEMANAL
                        </div>
                        <div style={{ fontSize: '0.55rem', color: '#fff', opacity: 0.8, marginTop: '2px' }}>ENCERRA EM 2 DIAS</div>
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
                                MEU RANKING
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px' }}>
                                <div className="ranking-modal-row">
                                    <span className="ranking-modal-lbl">MINHA POSIÇÃO</span>
                                    <span className="ranking-modal-val" style={{ color: '#fcd34d' }}>#4521</span>
                                </div>
                                <div className="ranking-modal-row" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                                    <span className="ranking-modal-lbl">TOTAL AURA</span>
                                    <span className="ranking-modal-val" style={{ color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.2rem' }}>
                                        <Diamond size={16} color="#fcd34d" /> {Math.floor(aura).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div style={{ color: '#888', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center', letterSpacing: '2px' }}>TOP 100 GLOBAL</div>
                                
                                <div className="ranking-modal-scroll">
                                    {MOCK_TOP_100.map(player => (
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
                                                <span style={{ color: player.rank <= 3 ? '#fff' : '#ccc', fontWeight: 'bold', fontSize: '0.9rem' }}>{player.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ color: '#a855f7', fontWeight: 'bold', fontSize: '0.85rem' }}>{player.aura.toLocaleString()}</span>
                                                <Diamond size={10} color="#a855f7" />
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

        </div>
    );
}
