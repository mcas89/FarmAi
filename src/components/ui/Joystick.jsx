import React, { useRef, useState } from 'react';
import { useMovementSystem } from '../../systems/useMovementSystem';

export function Joystick({ size = 92, opacity = 0.72 }) {
    const baseRef = useRef(null);
    const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
    const [active, setActive] = useState(false);
    const { setJoystick } = useMovementSystem();

    const radius = Math.max(26, Math.round(size * 0.34));
    const knobSize = Math.round(size * 0.43);

    const handleMove = (clientX, clientY) => {
        if (!baseRef.current) return;
        const rect = baseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance > radius) {
            deltaX = (deltaX / distance) * radius;
            deltaY = (deltaY / distance) * radius;
        }

        setStickPos({ x: deltaX, y: deltaY });
        setJoystick(deltaX / radius, deltaY / radius);
    };

    const handleEnd = (e) => {
        if (e?.currentTarget?.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setActive(false);
        setStickPos({ x: 0, y: 0 });
        setJoystick(0, 0);
    };

    return (
        <div
            ref={baseRef}
            aria-label="Controle de movimento"
            style={{
                position: 'relative',
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                touchAction: 'none',
                pointerEvents: 'auto',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                opacity: active ? 1 : opacity,
                background: 'radial-gradient(circle at 42% 35%, rgba(255,255,255,0.12), rgba(20,12,38,0.72) 55%, rgba(7,5,15,0.82))',
                border: `1px solid ${active ? 'rgba(192,132,252,0.75)' : 'rgba(255,255,255,0.16)'}`,
                boxShadow: active
                    ? '0 0 28px rgba(168,85,247,0.38), inset 0 0 22px rgba(168,85,247,0.22)'
                    : '0 10px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'opacity 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease'
            }}
            onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.setPointerCapture?.(e.pointerId);
                setActive(true);
                handleMove(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
                if (active || e.currentTarget.hasPointerCapture?.(e.pointerId)) {
                    handleMove(e.clientX, e.clientY);
                }
            }}
            onPointerUp={handleEnd}
            onPointerCancel={handleEnd}
            onLostPointerCapture={handleEnd}
        >
            <div style={{
                position: 'absolute',
                width: '58%',
                height: '58%',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.08)',
                pointerEvents: 'none'
            }} />

            <div style={{
                width: `${knobSize}px`,
                height: `${knobSize}px`,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 28%, #d8b4fe, #8b5cf6 48%, #4c1d95 100%)',
                border: '1px solid rgba(255,255,255,0.32)',
                boxShadow: active
                    ? '0 0 18px rgba(192,132,252,0.8), 0 8px 16px rgba(0,0,0,0.45)'
                    : '0 0 10px rgba(168,85,247,0.35), 0 6px 12px rgba(0,0,0,0.35)',
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
                transition: stickPos.x === 0 && stickPos.y === 0 ? 'transform 0.16s ease-out' : 'none',
                pointerEvents: 'none'
            }} />
        </div>
    );
}