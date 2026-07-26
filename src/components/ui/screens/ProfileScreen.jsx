import React from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { 
    User, ChevronLeft, Shield, Zap, Target, 
    Clock, Trophy, Sparkles, Diamond, Flame, Star, BarChart2
} from 'lucide-react';

export function ProfileScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const stats = useUISystem(state => state.playerStats);
    
    // Dados reais
    const { aura, comboCount } = useAuraSystem();
    const activeModel = usePlayerSystem(state => state.activeModel);

    const [progression, setProgression] = React.useState(null);
    React.useEffect(() => {
        import('../../../systems/progressionRules').then(rules => {
            setProgression(rules);
        });
    }, []);

    const displayAura = Math.floor(aura);
    // Formatação MÁXIMA RESPONSIVA para trilhões (ex: 1.5B, 2T) para nunca quebrar layout
    const compactAura = new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(displayAura);
    
    const displayLevel = progression ? progression.getPlayerLevel(aura) : 1;
    const displayTitle = progression ? progression.getPlayerTitle(displayLevel) : 'Carregando...';
    const displayCombo = Math.max(comboCount, stats.maxCombo || 0);

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'auto', display: 'flex', flexDirection: 'column',
            fontFamily: 'sans-serif', overflowY: 'auto', overflowX: 'hidden'
        }}>
            <style>{`
                .profile-bg {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: linear-gradient(90deg, rgba(10, 5, 20, 0.95) 0%, rgba(10, 5, 20, 0.7) 30%, transparent 50%, rgba(10, 5, 20, 0.7) 70%, rgba(10, 5, 20, 0.95) 100%);
                    pointer-events: none; z-index: 0;
                }
                
                .profile-content-wrapper {
                    position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column;
                }

                .profile-top-bar {
                    display: flex; align-items: center; padding: 25px 5vw;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
                }
                .back-btn {
                    display: flex; align-items: center; gap: 8px; color: #fff; background: rgba(255,255,255,0.05);
                    padding: 10px 20px; border-radius: 30px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px); transition: all 0.3s; font-weight: 900; letter-spacing: 1px; font-size: 0.9rem;
                }
                .back-btn:hover { background: rgba(255,255,255,0.15); transform: translateX(-5px); border: 1px solid rgba(255,255,255,0.3); }
                
                .profile-layout {
                    flex: 1; display: flex; justify-content: space-between; padding: 20px 5vw 60px 5vw;
                    align-items: center; pointer-events: none;
                }
                
                .profile-panel {
                    pointer-events: auto; padding: 20px; width: 32%;
                }

                .stat-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 18px 0; position: relative; z-index: 1;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .stat-row:last-child { border-bottom: none; }
                .stat-label { color: #888; font-size: 0.85rem; font-weight: bold; letter-spacing: 2px; display: flex; align-items: center; gap: 12px; text-transform: uppercase; }
                .stat-value { color: #fff; font-size: 1.3rem; font-weight: 900; text-align: right; letter-spacing: 1px; }

                /* Texto Responsivo para Aura Absurda */
                .aura-compact-text {
                    font-size: clamp(2.5rem, 5vw, 4.5rem);
                    font-weight: 900;
                    line-height: 1;
                    color: #fff;
                    letter-spacing: -1px;
                }

                @media (max-width: 1024px) {
                    .profile-panel { width: 45% !important; }
                }
                @media (max-width: 768px) {
                    .profile-bg { background: linear-gradient(180deg, rgba(10,5,20,0.95) 0%, transparent 40%, rgba(10,5,20,0.8) 60%, rgba(10,5,20,0.95) 100%); }
                    .profile-layout { flex-direction: column; justify-content: flex-start; padding: 0 5vw 40px 5vw; gap: 20px; }
                    .profile-panel { width: 100% !important; padding: 10px; }
                    .char-placeholder { display: block; flex-shrink: 0; height: 350px; pointer-events: none; } 
                    .stat-value { font-size: 1.1rem; }
                    .stat-label { font-size: 0.75rem; }
                    .profile-top-bar { padding: 15px 5vw; }
                }
                
                .glow-text { text-shadow: 0 0 30px rgba(168,85,247,0.6); }
                @keyframes slideInLeft { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
                
                .panel-left { animation: slideInLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                .panel-right { animation: slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
            `}</style>

            <div className="profile-bg"></div>

            <div className="profile-content-wrapper">
                <div className="profile-top-bar">
                    <div className="back-btn" onClick={() => setScreen('MENU')}>
                        <ChevronLeft size={20} /> MENU
                    </div>
                </div>

                <div className="profile-layout">
                    {/* LADO ESQUERDO: INFOS DO JOGADOR */}
                    <div className="profile-panel panel-left" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#a855f7', fontSize: '1rem', fontWeight: '900', letterSpacing: '4px' }}>CAÇADOR</div>
                                <div style={{ color: '#fff', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '900', lineHeight: '1.2', textTransform: 'uppercase' }}>{stats.nickname}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                                    <div style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', padding: '6px 16px', borderRadius: '30px', color: '#fff', fontWeight: '900', fontSize: '1rem' }}>LV {displayLevel}</div>
                                    <div style={{ color: '#d8b4fe', fontWeight: '900', fontStyle: 'italic', letterSpacing: '2px', fontSize: '1.1rem' }}>{displayTitle}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <div style={{ color: '#888', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '3px', marginBottom: '15px' }}>AURA ACUMULADA</div>
                            <div className="glow-text" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Diamond size={40} color="#a855f7" style={{ opacity: 0.8 }} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {/* Usa compact notation (1.5B, 2T) para números grandes para não quebrar layout */}
                                    <span className="aura-compact-text">{compactAura}</span>
                                    {/* Mostra o número exato embaixo com opacidade reduzida se for grande */}
                                    {displayAura >= 10000 && (
                                        <span style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1px', marginTop: '5px' }}>
                                            Exato: {displayAura.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                    </div>

                    {/* CENTRO: PERSONAGEM 3D */}
                    <div className="char-placeholder" style={{ flex: 1, height: '100%' }}></div>

                    {/* LADO DIREITO: ESTATÍSTICAS DETALHADAS */}
                    <div className="profile-panel panel-right" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '900', letterSpacing: '4px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <BarChart2 color="#a855f7" size={24} /> DADOS DE COMBATE
                        </div>

                        <div className="stat-row">
                            <div className="stat-label"><Flame size={20} color="#fb923c" /> Combo Máximo</div>
                            <div className="stat-value">{displayCombo.toLocaleString()}</div>
                        </div>
                        <div className="stat-row">
                            <div className="stat-label"><Target size={20} color="#4ade80" /> Acertos Perfeitos</div>
                            <div className="stat-value">{stats.perfectHits.toLocaleString()}</div>
                        </div>
                        <div className="stat-row">
                            <div className="stat-label"><Clock size={20} color="#60a5fa" /> Tempo Farmado</div>
                            <div className="stat-value">{stats.timeFarmed}</div>
                        </div>
                        <div className="stat-row">
                            <div className="stat-label"><Trophy size={20} color="#fcd34d" /> Ranking Global</div>
                            <div className="stat-value" style={{ color: '#fcd34d' }}>#{stats.globalRanking || 42}</div>
                        </div>
                        <div className="stat-row">
                            <div className="stat-label"><Star size={20} color="#f472b6" /> Personagem</div>
                            <div className="stat-value" style={{ fontSize: '1.1rem', color: '#fbcfe8' }}>{activeModel.replace('.vrm', '').toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
