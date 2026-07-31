import React, { useState, useEffect, useRef } from 'react';
import { useMultiplayerSystem } from '../../systems/useMultiplayerSystem';
import { Send, MessageCircle, X } from 'lucide-react';

export function MultiplayerChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const chatMessages = useMultiplayerSystem(state => state.chatMessages);
    const sendChatMessage = useMultiplayerSystem(state => state.sendChatMessage);
    const messagesEndRef = useRef(null);
    const prevCountRef = useRef(chatMessages.length);

    // Scroll para o final quando novas mensagens chegam
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setUnreadCount(0);
        } else if (chatMessages.length > prevCountRef.current) {
            setUnreadCount(n => n + (chatMessages.length - prevCountRef.current));
        }
        prevCountRef.current = chatMessages.length;
    }, [chatMessages, isOpen]);

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        sendChatMessage(text);
        setInput('');
    };

    const handleKeyDown = (e) => {
        // Impede que 6 e 7 disparem o farm enquanto digitando
        e.stopPropagation();
        if (e.key === 'Enter') handleSend();
        if (e.key === 'Escape') setIsOpen(false);
    };

    return (
        <>
            {/* Botão flutuante de chat (Lado Direito) */}
            <div
                onClick={() => { setIsOpen(o => !o); setUnreadCount(0); }}
                className="top-btn anim-float"
                style={{
                    position: 'fixed', right: '15px', top: '40%', transform: 'translateY(-50%)',
                    width: '45px', height: '45px', borderRadius: '50%',
                    background: isOpen ? 'rgba(168, 85, 247, 0.4)' : 'rgba(10, 10, 15, 0.4)',
                    border: isOpen ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: (!isOpen && unreadCount > 0) ? '0 0 20px rgba(236, 72, 153, 0.8)' : (isOpen ? '0 0 15px rgba(168, 85, 247, 0.5)' : 'none'),
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    cursor: 'pointer', zIndex: 100, pointerEvents: 'auto',
                    animation: (!isOpen && unreadCount > 0) ? 'pulse 1s infinite' : 'none'
                }}
            >
                {isOpen ? <X size={18} color="#fff" /> : <MessageCircle size={18} color={(!isOpen && unreadCount > 0) ? "#ec4899" : "#a855f7"} />}
                {!isOpen && unreadCount > 0 && (
                    <div style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#ec4899', color: '#fff',
                        fontSize: '0.6rem', fontWeight: '900',
                        width: '18px', height: '18px', borderRadius: '50%',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        boxShadow: '0 0 10px rgba(236, 72, 153, 0.8)'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </div>

            {/* Painel de chat (Meio da Tela) */}
            {isOpen && (
                <div style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '320px', height: '400px', maxWidth: '90vw', maxHeight: '80vh',
                    background: 'rgba(10,10,20,0.92)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(168,85,247,0.4)',
                    borderRadius: '16px',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(168,85,247,0.2)',
                    zIndex: 105,
                    overflow: 'hidden',
                    pointerEvents: 'auto'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(168,85,247,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(168,85,247,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageCircle size={14} color="#a855f7" />
                            <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                                CHAT DA SALA
                            </span>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        >
                            <X size={18} color="#94a3b8" />
                        </button>
                    </div>

                    {/* Mensagens */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: '10px',
                        display: 'flex', flexDirection: 'column', gap: '6px',
                        scrollbarWidth: 'thin', scrollbarColor: 'rgba(168,85,247,0.3) transparent'
                    }}>
                        {chatMessages.length === 0 ? (
                            <div style={{ color: '#555', fontSize: '0.7rem', textAlign: 'center', marginTop: '20px' }}>
                                Nenhuma mensagem ainda...
                            </div>
                        ) : (
                            chatMessages.map((msg, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#a855f7', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                            {msg.sender}
                                        </span>
                                        {msg.time && (
                                            <span style={{ color: '#444', fontSize: '0.55rem' }}>{msg.time}</span>
                                        )}
                                    </div>
                                    <span style={{
                                        color: '#e2e8f0', fontSize: '0.75rem', lineHeight: '1.3',
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '4px 8px', borderRadius: '8px',
                                        wordBreak: 'break-word'
                                    }}>
                                        {msg.text}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '8px',
                        borderTop: '1px solid rgba(168,85,247,0.2)',
                        display: 'flex', gap: '6px'
                    }}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite uma mensagem..."
                            maxLength={120}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(168,85,247,0.3)',
                                borderRadius: '8px', padding: '6px 10px',
                                color: '#fff', fontSize: '0.75rem', outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleSend}
                            style={{
                                background: 'rgba(168,85,247,0.8)',
                                border: 'none', borderRadius: '8px',
                                padding: '6px 10px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <Send size={14} color="#fff" />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
            `}</style>
        </>
    );
}
