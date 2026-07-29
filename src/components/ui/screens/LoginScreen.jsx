import React, { useState } from 'react';
import { useUISystem } from '../../../systems/useUISystem';
import { auth, db } from '../../../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuraSystem } from '../../../systems/useAuraSystem';
import splashImg from '../../../assets/splash.png';
import { AuracashIcon } from '../AuracashIcon';
import { Mail, Lock, User, Calendar, Loader2 } from 'lucide-react';

export function LoginScreen() {
    const setScreen = useUISystem(state => state.setScreen);
    const updateStats = useUISystem(state => state.updateStats);
    
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTerms, setShowTerms] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                // Cadastro
                
                // Verifica se o nome já existe
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('name', '==', name.trim()));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    setError('Este nome de usuário já está em uso. Por favor, escolha outro.');
                    setLoading(false);
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                const { getCurrentWeekString } = await import('../../../utils/dateUtils');
                const currentWeek = getCurrentWeekString();

                // Grava estado inicial no Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    name: name,
                    email: email,
                    birthDate: birthDate,
                    aura: 0,
                    auracash: 0,
                    comboCount: 0,
                    maxCombo: 0,
                    weeklyAura: 0,
                    lastWeeklyReset: currentWeek,
                    [`weeklyAura_${currentWeek}`]: 0,
                    dailyQuests: [],
                    lastResetDate: '',
                    activeModel: 'san.vrm', // modelo padrão inicial
                    position: { x: 0, y: 0.1, z: 0 },
                    createdAt: new Date()
                });

                // Atualiza estado local
                updateStats({ nickname: name.split(' ')[0], diamonds: 0 });
                
                setScreen('SPLASH'); 
            } else {
                // Login
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Lê os dados através do DatabaseSystem, que já trata a virada da semana
                const mDb = await import('../../../systems/useDatabaseSystem');
                const data = await mDb.useDatabaseSystem.getState().loadPlayerData();
                
                if (data) {
                    const realName = data.name ? data.name.split(' ')[0] : 'Jogador';
                    const realAura = data.aura || 0;
                    const realDiamonds = data.auracash || 0;
                    
                    updateStats({ nickname: realName, diamonds: realDiamonds });
                    useAuraSystem.setState({ 
                        aura: realAura, 
                        weeklyAura: data.weeklyAura || 0,
                        comboCount: data.comboCount || 0, 
                        maxCombo: data.maxCombo || 0 
                    });
                    
                    // Inicializa o sistema de Missões Diárias com os dados salvos
                    import('../../../systems/useQuestSystem').then(m => {
                        m.useQuestSystem.getState().initializeQuests(data.dailyQuests, data.lastResetDate);
                    });
                    
                    // Restaura posição e personagem se existirem
                    if (data.position) {
                        import('../../../systems/usePlayerSystem').then(m => {
                            m.usePlayerSystem.setState({ position: [data.position.x, data.position.y, data.position.z] });
                            if (data.activeModel) m.usePlayerSystem.setState({ activeModel: data.activeModel });
                        });
                    }
                }
                
                setScreen('SPLASH');
            }
        } catch (err) {
            console.error("🔥 Erro Auth:", err);
            if (err.code === 'auth/invalid-api-key') setError('A chave da API do Firebase é inválida. Atualize o .env');
            else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') setError('E-mail ou senha incorretos.');
            else if (err.code === 'auth/email-already-in-use') setError('Este e-mail já está em uso.');
            else if (err.code === 'auth/weak-password') setError('A senha deve ter pelo menos 6 caracteres.');
            else setError('Ocorreu um erro. Verifique sua conexão e chave do Firebase.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', 
            zIndex: 9999, pointerEvents: 'auto',
            backgroundColor: '#050505',
            padding: '20px'
        }}>
            {/* Background Otimizado da Splash */}
            <img 
                src={splashImg} 
                alt="Splash" 
                style={{
                    position: 'absolute', top: 0, left: 0, 
                    width: '100%', height: '100%', 
                    objectFit: 'cover', zIndex: -2
                }}
            />
            
            {/* Overlay para escurecer a imagem e focar no modal */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.4)', zIndex: -1
            }} />

            {/* Modal Glassmorphism */}
            <div className="login-modal">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', letterSpacing: '2px', textShadow: '0 0 10px #a855f7' }}>
                        FARM<span style={{ color: '#a855f7' }}>AI</span>
                    </h1>
                    <p style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '5px' }}>
                        {isRegistering ? 'Crie sua conta no Metaverso' : 'Acesse seu perfil'}
                    </p>
                </div>

                {error && (
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', 
                        color: '#fca5a5', padding: '10px', borderRadius: '8px', 
                        fontSize: '0.75rem', marginBottom: '15px', textAlign: 'center' 
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {isRegistering && (
                        <>
                            <div className="input-group">
                                <User size={16} color="#a855f7" className="input-icon" />
                                <input 
                                    type="text" placeholder="Nome de Usuário" 
                                    value={name} onChange={e => setName(e.target.value)}
                                    required className="glass-input" 
                                />
                            </div>
                            <div className="input-group">
                                <Calendar size={16} color="#a855f7" className="input-icon" />
                                <input 
                                    type="date" placeholder="Data de Nascimento" 
                                    value={birthDate} onChange={e => setBirthDate(e.target.value)}
                                    required className="glass-input" 
                                />
                            </div>
                        </>
                    )}

                    <div className="input-group">
                        <Mail size={16} color="#a855f7" className="input-icon" />
                        <input 
                            type="email" placeholder="E-mail" 
                            value={email} onChange={e => setEmail(e.target.value)}
                            required className="glass-input" 
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={16} color="#a855f7" className="input-icon" />
                        <input 
                            type="password" placeholder="Senha" 
                            value={password} onChange={e => setPassword(e.target.value)}
                            required className="glass-input" 
                        />
                    </div>

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? <Loader2 size={20} className="spin" /> : (isRegistering ? 'CADASTRAR' : 'ENTRAR')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem' }}>
                    <span style={{ color: '#888' }}>
                        {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                    </span>
                    <span 
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                        style={{ color: '#a855f7', fontWeight: 'bold', marginLeft: '5px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isRegistering ? 'Faça Login' : 'Cadastre-se'}
                    </span>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <span 
                        onClick={() => setShowTerms(true)}
                        style={{ color: '#666', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#a855f7'}
                        onMouseLeave={e => e.currentTarget.style.color = '#666'}
                    >
                        Termo de Responsabilidade e Política de Privacidade
                    </span>
                </div>
            </div>

            {/* Modal de Termos de Responsabilidade e Privacidade */}
            {showTerms && (
                <div className="login-modal" style={{ position: 'absolute', zIndex: 10 }}>
                    <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Termos e Privacidade
                    </h2>
                    <div style={{ 
                        color: '#bbb', fontSize: '0.8rem', maxHeight: '50vh', 
                        overflowY: 'auto', textAlign: 'left', lineHeight: '1.6',
                        paddingRight: '10px' 
                    }}>
                        <style>{`
                            .terms-content::-webkit-scrollbar { width: 5px; }
                            .terms-content::-webkit-scrollbar-thumb { background: #a855f7; border-radius: 5px; }
                        `}</style>
                        <div className="terms-content">
                            <p style={{ color: '#fff', fontWeight: 'bold' }}>Termo de Responsabilidade</p>
                            <p>Ao acessar e utilizar o FarmAi, você concorda que todas as informações, missões e dados virtuais fornecidos são para uso exclusivo dentro da plataforma, sem garantias de operação contínua.</p>
                            
                            <p style={{ color: '#fff', fontWeight: 'bold', marginTop: '15px' }}>Política de Privacidade</p>
                            <p>Respeitamos a sua privacidade. Os dados informados (Nome, E-mail, Data de Nascimento) e seu progresso no jogo são armazenados de forma segura em nossos servidores Firebase apenas para viabilizar sua experiência no Metaverso. Não comercializamos ou compartilhamos seus dados com terceiros.</p>
                            
                            <p style={{ marginTop: '15px', fontStyle: 'italic', fontSize: '0.75rem' }}>
                                *Ao se cadastrar ou fazer login, você atesta que leu e concorda com estes termos.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowTerms(false)}
                        className="submit-btn" 
                        style={{ marginTop: '20px' }}
                    >
                        FECHAR E CONCORDAR
                    </button>
                </div>
            )}

            <style>{`
                .login-modal {
                    background: rgba(20, 18, 28, 0.6);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-top: 1px solid rgba(168, 85, 247, 0.4);
                    border-radius: 24px;
                    padding: 30px 25px;
                    width: 90%; max-width: 380px;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(168, 85, 247, 0.05);
                    animation: modalFadeIn 0.5s ease-out forwards;
                }
                
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .input-group {
                    position: relative; width: 100%;
                }

                .input-icon {
                    position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
                    pointer-events: none;
                }

                .glass-input {
                    width: 100%; padding: 14px 15px 14px 40px;
                    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px; color: #fff; font-size: 0.9rem;
                    outline: none; transition: all 0.3s;
                }

                .glass-input:focus {
                    border-color: #a855f7; background: rgba(0,0,0,0.5);
                    box-shadow: 0 0 10px rgba(168,85,247,0.3);
                }
                
                .glass-input::placeholder { color: #666; }

                /* Estilizar o input date para webkit */
                .glass-input::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }

                .submit-btn {
                    width: 100%; padding: 14px; margin-top: 10px;
                    border: none; border-radius: 12px; cursor: pointer;
                    background: linear-gradient(135deg, #a855f7, #ec4899);
                    color: #fff; font-weight: 900; letter-spacing: 1px; font-size: 0.9rem;
                    display: flex; justify-content: center; align-items: center;
                    box-shadow: 0 4px 15px rgba(168,85,247,0.4);
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px); box-shadow: 0 6px 20px rgba(168,85,247,0.6);
                }

                .submit-btn:active:not(:disabled) {
                    transform: scale(0.95);
                }

                .submit-btn:disabled {
                    opacity: 0.7; cursor: not-allowed;
                }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
