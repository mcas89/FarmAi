import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

const UPDATE_CHECK_MS = 30 * 60 * 1000; // 30 minutos

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      // Checagem leve a cada 30 min — só compara o SW; download só se houver update.
      if (r) {
        setInterval(() => {
          r.update();
        }, UPDATE_CHECK_MS);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #2e1065, #4c1d95)',
      border: '2px solid #a855f7',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 10px 30px rgba(168, 85, 247, 0.4)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      minWidth: '280px',
      maxWidth: '90vw',
      animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
    }}>
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={20} color="#d8b4fe" style={{ animation: 'spinSlow 3s linear infinite' }} />
          <strong style={{ color: '#fff', fontSize: '1.1rem' }}>Atualização Disponível!</strong>
        </div>
        <button onClick={close} style={{
          background: 'transparent', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '4px'
        }}>
          <X size={20} />
        </button>
      </div>

      <p style={{ color: '#d8b4fe', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
        O FarmaAI acabou de receber um novo patch mágico. Atualize para receber as novidades!
      </p>

      <button 
        onClick={() => updateServiceWorker(true)}
        style={{
          background: 'linear-gradient(90deg, #c026d3, #9333ea)',
          color: '#fff',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: '4px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontSize: '0.8rem',
          boxShadow: '0 4px 15px rgba(192, 38, 211, 0.4)'
        }}
      >
        Atualizar Agora
      </button>
    </div>
  );
}
