import React from 'react';
import { useUISystem } from '../../systems/useUISystem';

/**
 * Modal próprio do anti-cheat — sem alert() do navegador.
 */
export function AntiCheatModal() {
    const modal = useUISystem((s) => s.antiCheatModal);
    const dismiss = useUISystem((s) => s.dismissAntiCheatModal);

    if (!modal) return null;

    const title = modal.title || 'Auto-clique proibido';
    const body = modal.body || '';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                background: 'rgba(0,0,0,0.78)',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'auto',
                animation: 'antiCheatFadeIn 0.28s ease-out',
            }}
            onClick={dismiss}
        >
            <style>{`
                @keyframes antiCheatFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes antiCheatPop {
                    from { opacity: 0; transform: scale(0.86) translateY(16px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes antiCheatPulseX {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.45); }
                    50% { transform: scale(1.04); box-shadow: 0 0 0 14px rgba(239,68,68,0); }
                }
            `}</style>

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="anticheat-title"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: 360,
                    borderRadius: 20,
                    padding: '28px 24px 22px',
                    background: 'linear-gradient(165deg, #1a0a0c 0%, #0c0c10 55%, #12080a 100%)',
                    border: '1px solid rgba(248,113,113,0.45)',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
                    textAlign: 'center',
                    animation: 'antiCheatPop 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
            >
                {/* Selo proibido */}
                <div
                    aria-hidden
                    style={{
                        width: 84,
                        height: 84,
                        margin: '0 auto 18px',
                        borderRadius: '50%',
                        border: '5px solid #ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(239,68,68,0.12)',
                        animation: 'antiCheatPulseX 1.6s ease-in-out infinite',
                        position: 'relative',
                    }}
                >
                    <span
                        style={{
                            fontSize: 42,
                            fontWeight: 900,
                            color: '#ef4444',
                            lineHeight: 1,
                            fontFamily: 'system-ui, sans-serif',
                            transform: 'rotate(-12deg)',
                            textShadow: '0 2px 12px rgba(239,68,68,0.5)',
                        }}
                    >
                        ✕
                    </span>
                </div>

                <p
                    style={{
                        margin: '0 0 8px',
                        fontSize: 11,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#f87171',
                        fontWeight: 700,
                    }}
                >
                    Trapaça detectada
                </p>

                <h2
                    id="anticheat-title"
                    style={{
                        margin: '0 0 12px',
                        fontSize: '1.35rem',
                        color: '#fff',
                        fontWeight: 800,
                        lineHeight: 1.25,
                    }}
                >
                    {title}
                </h2>

                <p
                    style={{
                        margin: '0 0 22px',
                        fontSize: '0.95rem',
                        color: '#d4d4d8',
                        lineHeight: 1.55,
                    }}
                >
                    {body}
                </p>

                <button
                    type="button"
                    onClick={dismiss}
                    style={{
                        width: '100%',
                        border: 'none',
                        borderRadius: 12,
                        padding: '14px 16px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: '#fff',
                        background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
                        boxShadow: '0 8px 24px rgba(220,38,38,0.35)',
                    }}
                >
                    Entendi — vou jogar limpo
                </button>
            </div>
        </div>
    );
}
