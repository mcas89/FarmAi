import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMapActivitiesSystem } from '../../systems/useMapActivitiesSystem';
import { useAuraSystem } from '../../systems/useAuraSystem';
import { useUISystem } from '../../systems/useUISystem';

const PANEL_W = 200;

/**
 * Painel lateral direito (não cobre o cabeçalho):
 * dicas intercaladas + prompts de proximidade.
 * Começa aberto; seta retrai/expande.
 */
export function MapTopBanner() {
    const [open, setOpen] = useState(true);
    const nearFountain = useMapActivitiesSystem((s) => s.nearFountain);
    const nearShop = useMapActivitiesSystem((s) => s.nearShop);
    const nearChest = useMapActivitiesSystem((s) => s.nearChest);
    const chestOpened = useMapActivitiesSystem((s) => s.chestOpened);
    const keyFound = useMapActivitiesSystem((s) => s.keyFound);
    const fountainState = useMapActivitiesSystem((s) => s.fountainState);
    const fountainTarget = useMapActivitiesSystem((s) => s.fountainTarget);
    const potionSpawns = useMapActivitiesSystem((s) => s.potionSpawns);
    const tipIndex = useMapActivitiesSystem((s) => s.tipIndex);
    const comboCount = useAuraSystem((s) => s.comboCount);
    const mapToast = useMapActivitiesSystem((s) => s.mapToast);
    const [, tick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => tick((n) => n + 1), 500);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            const s = useMapActivitiesSystem.getState();
            if (s.nearFountain || s.nearShop || s.nearChest) return;
            s.advanceTip();
        }, 6000);
        return () => clearInterval(id);
    }, []);

    // Ao chegar perto de algo importante, abre o painel automaticamente
    useEffect(() => {
        if (nearFountain || nearShop || nearChest) setOpen(true);
    }, [nearFountain, nearShop, nearChest]);

    const banner = useMapActivitiesSystem.getState().getTopBanner();
    const toastLive = mapToast && Date.now() < mapToast.until;

    void nearFountain;
    void nearShop;
    void nearChest;
    void chestOpened;
    void keyFound;
    void fountainState;
    void fountainTarget;
    void potionSpawns;
    void tipIndex;
    void comboCount;

    if (!banner && !toastLive) return null;

    const handleAction = () => {
        if (!banner?.action) return;
        const map = useMapActivitiesSystem.getState();
        if (banner.action === 'accept_fountain') {
            map.startFountainChallenge();
        } else if (banner.action === 'open_shop') {
            useUISystem.getState().setShopModalOpen(true);
        } else if (banner.action === 'open_chest') {
            const res = map.openChest();
            if (res.reason === 'locked') {
                map.showToast('Você precisa encontrar a chave para abrir o baú.', 4000);
            }
        }
    };

    const isTip = banner?.kind === 'tip';
    const color = banner?.color || '#a855f7';

    return (
        <>
            {/* Painel lateral direito */}
            <div
                style={{
                    position: 'absolute',
                    top: 72,
                    right: open ? 0 : -PANEL_W,
                    zIndex: 9200,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'stretch',
                    transition: 'right 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
            >
                {/* Aba da seta — fica na borda quando retraído */}
                <button
                    type="button"
                    aria-label={open ? 'Recolher dicas' : 'Abrir dicas'}
                    onClick={() => setOpen((v) => !v)}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        pointerEvents: 'auto',
                        alignSelf: 'center',
                        width: 28,
                        height: 52,
                        marginRight: -1,
                        borderRadius: '10px 0 0 10px',
                        borderTop: `1.5px solid ${color}`,
                        borderBottom: `1.5px solid ${color}`,
                        borderLeft: `1.5px solid ${color}`,
                        borderRight: 'none',
                        background: 'rgba(10, 8, 20, 0.95)',
                        color,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '-4px 0 14px rgba(0,0,0,0.35)',
                        padding: 0,
                    }}
                >
                    {open ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
                </button>

                {/* Quadrado de missões / prompts */}
                <div
                    style={{
                        pointerEvents: open ? 'auto' : 'none',
                        width: PANEL_W,
                        maxHeight: '42vh',
                        overflowY: 'auto',
                        background: 'rgba(10, 8, 20, 0.94)',
                        borderTop: `1.5px solid ${color}`,
                        borderBottom: `1.5px solid ${color}`,
                        borderLeft: `1.5px solid ${color}`,
                        borderRight: 'none',
                        borderRadius: '12px 0 0 12px',
                        padding: '10px 11px 12px',
                        color: '#fff',
                        fontFamily: 'system-ui, sans-serif',
                        boxShadow: '-6px 4px 22px rgba(0,0,0,0.4)',
                    }}
                >
                    {banner ? (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    marginBottom: 6,
                                }}
                            >
                                <span
                                    style={{
                                        color,
                                        fontWeight: 900,
                                        fontSize: '0.68rem',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {banner.title}
                                </span>
                                {isTip && (
                                    <span style={{ color: '#888', fontSize: '0.6rem', fontWeight: 700 }}>
                                        dica do mapa
                                    </span>
                                )}
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    color: '#e5e7eb',
                                    fontSize: '0.72rem',
                                    lineHeight: 1.4,
                                    fontWeight: 600,
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {banner.text}
                            </p>
                            {banner.actionLabel && (
                                <button
                                    type="button"
                                    onClick={handleAction}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    style={{
                                        marginTop: 8,
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                                        color: '#0a0812',
                                        fontWeight: 900,
                                        fontSize: '0.72rem',
                                        boxShadow: `0 3px 10px ${color}44`,
                                    }}
                                >
                                    {banner.actionLabel}
                                </button>
                            )}
                        </>
                    ) : (
                        <p style={{ margin: 0, color: '#888', fontSize: '0.7rem', fontWeight: 600 }}>
                            Sem missões pendentes no mapa.
                        </p>
                    )}
                </div>
            </div>

            {/* Toast curto — centro baixo do header, sem cobrir o painel */}
            {toastLive && (
                <div
                    style={{
                        position: 'absolute',
                        top: 78,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9100,
                        pointerEvents: 'none',
                        maxWidth: 280,
                        width: '55%',
                        background: 'rgba(15, 10, 28, 0.92)',
                        border: '1px solid rgba(168, 85, 247, 0.55)',
                        borderRadius: 12,
                        padding: '8px 12px',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        lineHeight: 1.35,
                    }}
                >
                    {mapToast.text}
                </div>
            )}
        </>
    );
}
