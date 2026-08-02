import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Loader2 } from 'lucide-react';

const UPDATE_CHECK_MS = 30 * 60 * 1000; // 30 minutos

export function ReloadPrompt() {
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      console.log('SW Registered:', swUrl, r);
      if (r) {
        // Checagem periódica + uma checagem ao voltar pro app
        setInterval(() => {
          r.update().catch(() => {});
        }, UPDATE_CHECK_MS);

        const onVisible = () => {
          if (document.visibilityState === 'visible') {
            r.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', onVisible);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    if (updating) return;
    setNeedRefresh(false);
    setUpdateError('');
  };

  const hardReload = () => {
    // Garante que a página pega o SW novo / HTML novo
    window.location.href = `${window.location.origin}${window.location.pathname}?v=${Date.now()}`;
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateError('');
    try {
      // true = pede skipWaiting e tenta recarregar
      await updateServiceWorker(true);
    } catch (e) {
      console.warn('[PWA] updateServiceWorker falhou:', e);
    }

    // Fallback: muitos PWAs (esp. iOS/Android standalone) não disparam o reload do plugin
    window.setTimeout(() => {
      try {
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (_) {
        /* ignore */
      }
      hardReload();
    }, 800);
  };

  // Se o SW assumir o controle, recarrega
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const onControllerChange = () => {
      if (updating) hardReload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [updating]);

  if (!needRefresh && !updating) return null;

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
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      minWidth: '280px',
      maxWidth: '90vw',
      animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      pointerEvents: 'auto',
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
          {updating
            ? <Loader2 size={20} color="#d8b4fe" style={{ animation: 'spinSlow 1s linear infinite' }} />
            : <RefreshCw size={20} color="#d8b4fe" style={{ animation: 'spinSlow 3s linear infinite' }} />}
          <strong style={{ color: '#fff', fontSize: '1.1rem' }}>
            {updating ? 'Atualizando…' : 'Atualização Disponível!'}
          </strong>
        </div>
        {!updating && (
          <button type="button" onClick={close} style={{
            background: 'transparent', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '4px'
          }}>
            <X size={20} />
          </button>
        )}
      </div>

      <p style={{ color: '#d8b4fe', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
        {updating
          ? 'Baixando o patch e recarregando o FarmaAI. Aguarde alguns segundos…'
          : 'O FarmaAI acabou de receber um novo patch mágico. Atualize para receber as novidades!'}
      </p>

      {updateError && (
        <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.8rem' }}>{updateError}</p>
      )}

      {!updating && (
        <button
          type="button"
          onClick={handleUpdate}
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
      )}
    </div>
  );
}
