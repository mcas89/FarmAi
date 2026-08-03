import React, { useState, useEffect } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import { usePlayerSystem } from '../../../systems/usePlayerSystem';
import { useQuestSystem } from '../../../systems/useQuestSystem';
import { useAchievementSystem } from '../../../systems/useAchievementSystem';
import { useFriendsSystem } from '../../../systems/useFriendsSystem';
import { usePresenceSystem } from '../../../systems/usePresenceSystem';
import {
    User, ChevronLeft, Target, Trophy, Sparkles, Flame, Star, BarChart2,
    AlertTriangle, Loader2, Users, UserPlus, Copy, Check, X, Search, Trash2
} from 'lucide-react';
import { auth, db } from '../../../config/firebase';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

export function ProfileScreen() {
    const setScreen = useUISystem((state) => state.setScreen);
    const stats = useUISystem((state) => state.playerStats);

    const { aura, comboCount, maxCombo } = useAuraSystem();
    const activeModel = usePlayerSystem((state) => state.activeModel);
    const unlockedCharacters = usePlayerSystem((state) => state.unlockedCharacters);

    const achievements = useAchievementSystem((state) => state.achievements) || [];
    const completedAchievements = achievements.filter((a) => a.claimed).length;

    const dailyQuests = useQuestSystem((state) => state.dailyQuests) || [];
    const completedQuests = dailyQuests.filter((q) => q.claimed).length;

    const [tab, setTab] = useState('stats'); // stats | friends
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [copied, setCopied] = useState(false);

    const [progression, setProgression] = useState(null);
    useEffect(() => {
        import('../../../systems/progressionRules').then((rules) => {
            setProgression(rules);
        });
    }, []);

    const friends = useFriendsSystem((s) => s.friends);
    const incoming = useFriendsSystem((s) => s.incoming);
    const outgoing = useFriendsSystem((s) => s.outgoing);
    const friendsLoading = useFriendsSystem((s) => s.loading);
    const friendsError = useFriendsSystem((s) => s.error);
    const lastSuccess = useFriendsSystem((s) => s.lastSuccess);
    const myFriendCode = useFriendsSystem((s) => s.myFriendCode);
    const searchQuery = useFriendsSystem((s) => s.searchQuery);
    const viewingFriend = useFriendsSystem((s) => s.viewingFriend);
    const onlineByUid = usePresenceSystem((s) => s.onlineByUid || {});

    useEffect(() => {
        if (tab === 'friends') {
            useFriendsSystem.getState().refresh();
        }
    }, [tab]);

    const displayAura = Math.floor(aura);
    const compactAura = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2,
    }).format(displayAura);

    const displayLevel = progression ? progression.getPlayerLevel(aura) : 1;
    const displayTitle = progression ? progression.getPlayerTitle(displayLevel) : 'Carregando...';
    const displayCombo = Math.max(comboCount, maxCombo || 0, stats.maxCombo || 0);

    const handleCopyCode = async () => {
        if (!myFriendCode) return;
        try {
            await navigator.clipboard.writeText(myFriendCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch (_) {
            /* ignore */
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteError('');
        setIsDeleting(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('Usuário não autenticado.');
            const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
            await reauthenticateWithCredential(currentUser, credential);
            await deleteDoc(doc(db, 'users', currentUser.uid));
            await deleteUser(currentUser);
            useAuraSystem.getState().spendAura(useAuraSystem.getState().aura);
            setScreen('LOGIN');
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                setDeleteError('Senha incorreta.');
            } else if (error.code === 'auth/too-many-requests') {
                setDeleteError('Muitas tentativas falhas. Tente novamente mais tarde.');
            } else {
                setDeleteError('Erro ao excluir conta. Verifique sua senha e conexão.');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const fmt = (n) => Math.floor(Number(n) || 0).toLocaleString('pt-BR');

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'sans-serif',
                overflowY: 'auto',
                overflowX: 'hidden',
            }}
        >
            <style>{`
                .profile-bg {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: linear-gradient(90deg, rgba(10, 5, 20, 0.95) 0%, rgba(10, 5, 20, 0.7) 30%, transparent 50%, rgba(10, 5, 20, 0.7) 70%, rgba(10, 5, 20, 0.95) 100%);
                    pointer-events: none; z-index: 0;
                }
                .profile-content-wrapper { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; }
                .profile-top-bar {
                    display: flex; align-items: center; justify-content: space-between; gap: 12px;
                    padding: 20px 5vw 10px; flex-wrap: wrap;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
                }
                .back-btn {
                    display: flex; align-items: center; gap: 8px; color: #fff; background: rgba(255,255,255,0.05);
                    padding: 10px 20px; border-radius: 30px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px); font-weight: 900; letter-spacing: 1px; font-size: 0.9rem;
                }
                .tab-btn {
                    padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.12);
                    background: rgba(255,255,255,0.04); color: #aaa; font-weight: 800; font-size: 0.75rem;
                    letter-spacing: 1px; cursor: pointer; display: flex; align-items: center; gap: 6px;
                }
                .tab-btn.active {
                    background: rgba(168,85,247,0.25); border-color: rgba(168,85,247,0.6); color: #fff;
                }
                .profile-layout {
                    flex: 1; display: flex; justify-content: space-between; padding: 10px 5vw 60px 5vw;
                    align-items: flex-start; pointer-events: none; gap: 16px;
                }
                .profile-panel { pointer-events: auto; padding: 16px; width: 32%; }
                .stat-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .stat-row:last-child { border-bottom: none; }
                .stat-label { color: #888; font-size: 0.8rem; font-weight: bold; letter-spacing: 1.5px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; }
                .stat-value { color: #fff; font-size: 1.15rem; font-weight: 900; text-align: right; }
                .aura-compact-text { font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 900; line-height: 1; color: #fff; }
                .glow-text { text-shadow: 0 0 30px rgba(168,85,247,0.6); }
                .friend-card {
                    display: flex; align-items: center; justify-content: space-between; gap: 10px;
                    padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px;
                }
                .friends-scroll { max-height: 48vh; overflow-y: auto; padding-right: 4px; }
                @media (max-width: 768px) {
                    .profile-bg { background: linear-gradient(180deg, rgba(10,5,20,0.95) 0%, transparent 40%, rgba(10,5,20,0.9) 100%); }
                    .profile-layout { flex-direction: column; padding: 0 5vw 40px; }
                    .profile-panel { width: 100% !important; }
                    .char-placeholder { display: none; }
                }
            `}</style>

            {showDeleteModal && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10000,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(20,5,5,0.9)',
                            padding: 30,
                            borderRadius: 20,
                            border: '1px solid #ef4444',
                            maxWidth: 400,
                            width: '90%',
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <AlertTriangle size={48} color="#ef4444" />
                            <h2 style={{ color: '#ef4444', fontWeight: 900, marginTop: 10 }}>ÁREA DE RISCO</h2>
                            <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                Excluir a conta apaga progresso e AuraCash permanentemente.
                            </p>
                        </div>
                        <input
                            type="password"
                            placeholder="Digite sua senha para confirmar"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 14,
                                borderRadius: 10,
                                border: '1px solid #555',
                                background: 'rgba(0,0,0,0.5)',
                                color: '#fff',
                                marginBottom: 10,
                            }}
                        />
                        {deleteError && (
                            <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: 10 }}>{deleteError}</div>
                        )}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteError('');
                                    setDeletePassword('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    background: '#333',
                                    border: '1px solid #555',
                                    borderRadius: 10,
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }}
                                disabled={isDeleting}
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    background: '#ef4444',
                                    border: 'none',
                                    borderRadius: 10,
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }}
                                disabled={isDeleting || !deletePassword}
                            >
                                {isDeleting ? '...' : 'EXCLUIR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewingFriend && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 9000,
                        background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                    }}
                    onClick={() => useFriendsSystem.getState().closeFriendProfile()}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '90%',
                            maxWidth: 360,
                            background: 'linear-gradient(145deg, #1a0e30, #0d0715)',
                            border: '1px solid rgba(168,85,247,0.45)',
                            borderRadius: 18,
                            padding: 22,
                            color: '#fff',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div>
                                <div style={{ color: '#a855f7', fontSize: '0.7rem', fontWeight: 900, letterSpacing: 2 }}>AMIGO</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{viewingFriend.name}</div>
                            </div>
                            <button
                                onClick={() => useFriendsSystem.getState().closeFriendProfile()}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                }}
                            >
                                <X size={22} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                            <div className="stat-row" style={{ padding: '8px 0' }}>
                                <span className="stat-label"><Sparkles size={16} color="#a855f7" /> Aura</span>
                                <span className="stat-value">{fmt(viewingFriend.aura)}</span>
                            </div>
                            <div className="stat-row" style={{ padding: '8px 0' }}>
                                <span className="stat-label"><Flame size={16} color="#fb923c" /> Max Combo</span>
                                <span className="stat-value">{fmt(viewingFriend.maxCombo)}</span>
                            </div>
                            <div className="stat-row" style={{ padding: '8px 0' }}>
                                <span className="stat-label"><Trophy size={16} color="#fcd34d" /> Semanal</span>
                                <span className="stat-value">{fmt(viewingFriend.weeklyAura)}</span>
                            </div>
                            <div className="stat-row" style={{ padding: '8px 0' }}>
                                <span className="stat-label"><Star size={16} color="#f472b6" /> Avatar</span>
                                <span className="stat-value" style={{ fontSize: '0.95rem' }}>
                                    {String(viewingFriend.activeModel || '').replace('.vrm', '').toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => useFriendsSystem.getState().removeFriend(viewingFriend.uid)}
                            style={{
                                width: '100%',
                                padding: 12,
                                borderRadius: 10,
                                border: '1px solid rgba(239,68,68,0.4)',
                                background: 'rgba(239,68,68,0.12)',
                                color: '#ef4444',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <Trash2 size={16} /> Remover amigo
                        </button>
                    </div>
                </div>
            )}

            <div className="profile-bg" />

            <div className="profile-content-wrapper">
                <div className="profile-top-bar">
                    <div className="back-btn" onClick={() => setScreen('MENU')}>
                        <ChevronLeft size={20} /> MENU
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            className={`tab-btn ${tab === 'stats' ? 'active' : ''}`}
                            onClick={() => setTab('stats')}
                        >
                            <BarChart2 size={14} /> PERFIL
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${tab === 'friends' ? 'active' : ''}`}
                            onClick={() => setTab('friends')}
                        >
                            <Users size={14} /> AMIGOS
                            {incoming.length > 0 && (
                                <span
                                    style={{
                                        background: '#ef4444',
                                        color: '#fff',
                                        borderRadius: 999,
                                        fontSize: '0.65rem',
                                        padding: '1px 6px',
                                        fontWeight: 900,
                                    }}
                                >
                                    {incoming.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {tab === 'stats' && (
                    <div className="profile-layout">
                        <div className="profile-panel" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <div style={{ color: '#a855f7', fontSize: '0.9rem', fontWeight: 900, letterSpacing: 3 }}>
                                    CAÇADOR
                                </div>
                                <div
                                    style={{
                                        color: '#fff',
                                        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {stats.nickname}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                                    <div
                                        style={{
                                            background: 'rgba(168,85,247,0.2)',
                                            border: '1px solid rgba(168,85,247,0.5)',
                                            padding: '5px 14px',
                                            borderRadius: 30,
                                            color: '#fff',
                                            fontWeight: 900,
                                        }}
                                    >
                                        LV {displayLevel}
                                    </div>
                                    <div style={{ color: '#d8b4fe', fontWeight: 900, fontStyle: 'italic' }}>
                                        {displayTitle}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div style={{ color: '#888', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 }}>
                                    AURA ACUMULADA
                                </div>
                                <div className="glow-text" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Sparkles size={32} color="#a855f7" />
                                    <span className="aura-compact-text">{compactAura}</span>
                                </div>
                            </div>
                        </div>

                        <div className="char-placeholder" style={{ flex: 1, height: '100%' }} />

                        <div className="profile-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div
                                style={{
                                    color: '#fff',
                                    fontSize: '1rem',
                                    fontWeight: 900,
                                    letterSpacing: 3,
                                    marginBottom: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <BarChart2 color="#a855f7" size={22} /> DADOS DE COMBATE
                            </div>

                            <div className="stat-row">
                                <div className="stat-label">
                                    <Flame size={18} color="#fb923c" /> Combo Máximo
                                </div>
                                <div className="stat-value">{displayCombo.toLocaleString()}</div>
                            </div>
                            <div className="stat-row">
                                <div className="stat-label">
                                    <Trophy size={18} color="#fcd34d" /> Conquistas
                                </div>
                                <div className="stat-value">{completedAchievements}</div>
                            </div>
                            <div className="stat-row">
                                <div className="stat-label">
                                    <Target size={18} color="#4ade80" /> Missões
                                </div>
                                <div className="stat-value">{completedQuests}</div>
                            </div>
                            <div className="stat-row">
                                <div className="stat-label">
                                    <User size={18} color="#60a5fa" /> Avatares
                                </div>
                                <div className="stat-value">{unlockedCharacters?.length || 1}</div>
                            </div>
                            <div className="stat-row">
                                <div className="stat-label">
                                    <Star size={18} color="#f472b6" /> Personagem
                                </div>
                                <div className="stat-value" style={{ fontSize: '1rem', color: '#fbcfe8' }}>
                                    {activeModel.replace('.vrm', '').toUpperCase()}
                                </div>
                            </div>

                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444',
                                        padding: '10px 16px',
                                        borderRadius: 10,
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <AlertTriangle size={16} /> EXCLUIR CONTA
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'friends' && (
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            padding: '10px 5vw 50px',
                            pointerEvents: 'auto',
                            maxWidth: 720,
                            width: '100%',
                            margin: '0 auto',
                        }}
                    >
                        {/* Código do jogador */}
                        <div
                            style={{
                                background: 'rgba(168,85,247,0.12)',
                                border: '1px solid rgba(168,85,247,0.35)',
                                borderRadius: 14,
                                padding: 14,
                                marginBottom: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                flexWrap: 'wrap',
                            }}
                        >
                            <div>
                                <div style={{ color: '#c4b5fd', fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1 }}>
                                    SEU CÓDIGO DE AMIGO
                                </div>
                                <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', letterSpacing: 2 }}>
                                    #{myFriendCode || '......'}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyCode}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '8px 14px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(0,0,0,0.35)',
                                    color: '#fff',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                }}
                            >
                                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>

                        {/* Busca */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search
                                    size={16}
                                    color="#888"
                                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                                />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => useFriendsSystem.getState().setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            useFriendsSystem.getState().sendRequest(searchQuery);
                                        }
                                    }}
                                    placeholder="Nick ou código (#ABC123)"
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 36px',
                                        borderRadius: 12,
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        background: 'rgba(0,0,0,0.45)',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                disabled={friendsLoading || !searchQuery.trim()}
                                onClick={() => useFriendsSystem.getState().sendRequest(searchQuery)}
                                style={{
                                    padding: '0 16px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
                                    color: '#fff',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    opacity: friendsLoading || !searchQuery.trim() ? 0.5 : 1,
                                }}
                            >
                                {friendsLoading ? <Loader2 size={16} className="anim-spin" /> : <UserPlus size={16} />}
                                Add
                            </button>
                        </div>

                        {friendsError && (
                            <div style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>
                                {friendsError}
                            </div>
                        )}
                        {lastSuccess && (
                            <div style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>
                                {lastSuccess}
                            </div>
                        )}

                        <div className="friends-scroll">
                            {incoming.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '0.75rem', letterSpacing: 1, marginBottom: 8 }}>
                                        PEDIDOS RECEBIDOS
                                    </div>
                                    {incoming.map((req) => (
                                        <div key={req.uid} className="friend-card">
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 800 }}>{req.fromName || 'Jogador'}</div>
                                                <div style={{ color: '#888', fontSize: '0.7rem' }}>Quer ser seu amigo</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => useFriendsSystem.getState().acceptRequest(req.uid)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: 8,
                                                        border: 'none',
                                                        background: '#34d399',
                                                        color: '#062',
                                                        fontWeight: 900,
                                                        cursor: 'pointer',
                                                        fontSize: '0.7rem',
                                                    }}
                                                >
                                                    Aceitar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => useFriendsSystem.getState().rejectRequest(req.uid)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: 8,
                                                        border: '1px solid #555',
                                                        background: 'transparent',
                                                        color: '#ccc',
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                        fontSize: '0.7rem',
                                                    }}
                                                >
                                                    Recusar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {outgoing.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ color: '#60a5fa', fontWeight: 900, fontSize: '0.75rem', letterSpacing: 1, marginBottom: 8 }}>
                                        PEDIDOS ENVIADOS
                                    </div>
                                    {outgoing.map((req) => (
                                        <div key={req.uid} className="friend-card">
                                            <div style={{ color: '#fff', fontWeight: 800 }}>{req.toName || 'Jogador'}</div>
                                            <button
                                                type="button"
                                                onClick={() => useFriendsSystem.getState().cancelOutgoing(req.uid)}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: 8,
                                                    border: '1px solid #555',
                                                    background: 'transparent',
                                                    color: '#aaa',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    fontSize: '0.7rem',
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ color: '#fff', fontWeight: 900, fontSize: '0.75rem', letterSpacing: 1, marginBottom: 8 }}>
                                LISTA ({friends.length})
                            </div>
                            {friendsLoading && friends.length === 0 && (
                                <div style={{ color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Loader2 size={16} /> Carregando...
                                </div>
                            )}
                            {!friendsLoading && friends.length === 0 && (
                                <div style={{ color: '#777', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                    Nenhum amigo ainda. Peça o nick ou o código de alguém e envie um pedido.
                                </div>
                            )}
                            {friends.map((f) => (
                                <div
                                    key={f.uid}
                                    className="friend-card"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => useFriendsSystem.getState().openFriendProfile(f.uid)}
                                >
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span
                                                title={onlineByUid[f.uid]?.online ? 'Online' : 'Offline'}
                                                style={{
                                                    width: 9,
                                                    height: 9,
                                                    borderRadius: '50%',
                                                    flexShrink: 0,
                                                    background: onlineByUid[f.uid]?.online ? '#22c55e' : '#64748b',
                                                    boxShadow: onlineByUid[f.uid]?.online
                                                        ? '0 0 8px rgba(34, 197, 94, 0.85)'
                                                        : 'none',
                                                }}
                                            />
                                            {f.name || 'Jogador'}
                                            {onlineByUid[f.uid]?.online && (
                                                <span style={{ color: '#4ade80', fontSize: '0.65rem', fontWeight: 700 }}>
                                                    ONLINE
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: '#888', fontSize: '0.7rem', display: 'flex', gap: 10 }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                <Sparkles size={11} color="#a855f7" /> {fmt(f.aura)}
                                            </span>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                <Flame size={11} color="#fb923c" /> {fmt(f.maxCombo)}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ color: '#a855f7', fontSize: '0.7rem', fontWeight: 800 }}>Ver →</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
