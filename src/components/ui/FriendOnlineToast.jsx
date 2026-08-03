import React, { useEffect } from 'react';
import { Users } from 'lucide-react';
import { usePresenceSystem } from '../../systems/usePresenceSystem';

/**
 * Card flutuante global: "Fulano está online".
 * Aparece no menu, mapa e demais telas (montado no App).
 */
export function FriendOnlineToast() {
  const toasts = usePresenceSystem((s) => (Array.isArray(s.toasts) ? s.toasts : []));
  const dismissToast = usePresenceSystem((s) => s.dismissToast);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const tick = setInterval(() => {
      const now = Date.now();
      const live = usePresenceSystem.getState().toasts;
      if (!Array.isArray(live)) return;
      for (const t of live) {
        if (t.until <= now) dismissToast(t.id);
      }
    }, 400);
    return () => clearInterval(tick);
  }, [toasts.length, dismissToast]);

  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
        width: 'min(340px, calc(100vw - 24px))',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="friend-online-toast"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(6,78,59,0.88))',
            border: '1px solid rgba(52, 211, 153, 0.45)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.45), 0 0 20px rgba(52, 211, 153, 0.15)',
            backdropFilter: 'blur(10px)',
            animation: 'friendOnlineIn 0.35s ease-out',
            cursor: 'pointer',
          }}
          onClick={() => dismissToast(t.id)}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(52, 211, 153, 0.2)',
              border: '1px solid rgba(52, 211, 153, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <Users size={18} color="#34d399" />
            <span
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #0f172a',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                color: '#ecfdf5',
                fontWeight: 800,
                fontSize: '0.92rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {t.name} está online
            </div>
            <div style={{ color: '#86efac', fontSize: '0.72rem', marginTop: 2 }}>
              Seu amigo entrou no FarmAi
            </div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes friendOnlineIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
