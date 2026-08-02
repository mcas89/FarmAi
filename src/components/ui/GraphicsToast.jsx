import React, { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';
import { useGraphicsSystem } from '../../systems/useGraphicsSystem';

/** Toast discreto quando o modo Automático rebaixa os gráficos por FPS baixo */
export function GraphicsToast() {
    const toast = useGraphicsSystem((state) => state.toast);
    const clearToast = useGraphicsSystem((state) => state.clearToast);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [toast]);

    if (!toast || !visible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '90px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                pointerEvents: 'auto',
                maxWidth: '90%',
                width: '340px',
                background: 'rgba(15, 10, 25, 0.92)',
                border: '1px solid rgba(168, 85, 247, 0.45)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
                animation: 'graphicsToastIn 0.35s ease',
            }}
            onClick={clearToast}
        >
            <style>{`
                @keyframes graphicsToastIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
            <Monitor size={18} color="#a855f7" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                    DESEMPENHO
                </div>
                <div style={{ color: '#ccc', fontSize: '0.72rem', marginTop: '2px', lineHeight: 1.35 }}>
                    {toast}
                </div>
            </div>
        </div>
    );
}
