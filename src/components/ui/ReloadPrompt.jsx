import React, { useState, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

const UPDATE_CHECK_MS = 30 * 60 * 1000; // 30 minutos

const STAGES = [
  { until: 25, label: 'Preparando atualização…' },
  { until: 55, label: 'Baixando o novo patch…' },
  { until: 80, label: 'Ativando a nova versão…' },
  { until: 95, label: 'Quase pronto…' },
  { until: 100, label: 'Recarregando o FarmaAI…' },
];

function stageLabel(pct) {
  for (const s of STAGES) {
    if (pct <= s.until) return s.label;
  }
  return STAGES[STAGES.length - 1].label;
}

export function ReloadPrompt() {
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateError, setUpdateError] = useState('');
  const progressRef = useRef(0);
  const reloadArmed = useRef(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      console.log('SW Registered:', swUrl, r);
      if (r) {
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
    window.location.href = `${window.location.origin}${window.location.pathname}?v=${Date.now()}`;
  };

  // Barra de progresso por etapas (SW não expõe % real do download)
  useEffect(() => {
    if (!updating) return undefined;
    progressRef.current = 0;
    setProgress(0);

    const id = setInterval(() => {
      const cur = progressRef.current;
      // Sobe rápido no começo, freia perto do fim (espera o reload)
      let step = 2.2;
      if (cur > 40) step = 1.4;
      if (cur > 70) step = 0.7;
      if (cur > 88) step = 0.25;
      const next = Math.min(cur + step, 96);
      progressRef.current = next;
      setProgress(next);
    }, 120);

    return () => clearInterval(id);
  }, [updating]);

  const finishAndReload = () => {
    if (reloadArmed.current) return;
    reloadArmed.current = true;
    progressRef.current = 100;
    setProgress(100);
    window.setTimeout(() => hardReload(), 350);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateError('');
    reloadArmed.current = false;
    try {
      await updateServiceWorker(true);
    } catch (e) {
      console.warn('[PWA] updateServiceWorker falhou:', e);
      setUpdateError('Falha ao ativar. Recarregando mesmo assim…');
    }

    window.setTimeout(() => {
      try {
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (_) {
        /* ignore */
      }
      finishAndReload();
    }, 2200);
  };

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const onControllerChange = () => {
      if (updating) finishAndReload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [updating]);

  if (!needRefresh && !updating) return null;

  const pct = Math.round(progress);
  const label = stageLabel(progress);

  return (
    <>
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
          @keyframes pwaFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pwaBarShimmer {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
        `}
      </style>

      {/* Overlay central com barra de progresso */}
      {updating && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(6, 4, 14, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'pwaFadeIn 0.25s ease',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              background: 'linear-gradient(145deg, #1e1035, #12081f)',
              border: '1.5px solid rgba(168,85,247,0.55)',
              borderRadius: 20,
              padding: '28px 24px 24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.2)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'rgba(168,85,247,0.18)',
                border: '1px solid rgba(168,85,247,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={26} color="#d8b4fe" style={{ animation: 'spinSlow 2.5s linear infinite' }} />
            </div>

            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.15rem', marginBottom: 6 }}>
              Atualizando FarmaAI
            </div>
            <div style={{ color: '#c4b5fd', fontSize: '0.85rem', fontWeight: 600, minHeight: 22, marginBottom: 18 }}>
              {label}
            </div>

            <div
              style={{
                width: '100%',
                height: 12,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #7c3aed, #c026d3, #a855f7, #7c3aed)',
                  backgroundSize: '200% 100%',
                  animation: 'pwaBarShimmer 1.2s linear infinite',
                  transition: 'width 0.15s ease-out',
                  boxShadow: '0 0 14px rgba(192,38,211,0.55)',
                }}
              />
            </div>

            <div
              style={{
                marginTop: 10,
                color: '#e9d5ff',
                fontWeight: 900,
                fontSize: '1.05rem',
                letterSpacing: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {pct}%
            </div>

            {updateError && (
              <div style={{ marginTop: 12, color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600 }}>
                {updateError}
              </div>
            )}

            <p style={{ margin: '14px 0 0', color: '#888', fontSize: '0.72rem', lineHeight: 1.4 }}>
              Não feche o app. A página vai recarregar sozinha.
            </p>
          </div>
        </div>
      )}

      {/* Toast de “nova versão” (só antes de clicar) */}
      {needRefresh && !updating && (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={20} color="#d8b4fe" style={{ animation: 'spinSlow 3s linear infinite' }} />
              <strong style={{ color: '#fff', fontSize: '1.1rem' }}>Atualização Disponível!</strong>
            </div>
            <button type="button" onClick={close} style={{
              background: 'transparent', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '4px'
            }}>
              <X size={20} />
            </button>
          </div>

          <p style={{ color: '#d8b4fe', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
            O FarmaAI acabou de receber um novo patch mágico. Atualize para receber as novidades!
          </p>

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
        </div>
      )}
    </>
  );
}
