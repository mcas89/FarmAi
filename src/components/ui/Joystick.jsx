import React, { useRef, useState } from 'react';
import { useMovementSystem } from '../../systems/useMovementSystem';

export function Joystick() {
    const baseRef = useRef(null);
    const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
    const { setJoystick } = useMovementSystem();

    const radius = 20; 

    const handleMove = (clientX, clientY) => {
        if (!baseRef.current) return;
        const rect = baseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > radius) {
            deltaX = (deltaX / distance) * radius;
            deltaY = (deltaY / distance) * radius;
        }

        setStickPos({ x: deltaX, y: deltaY });
        setJoystick(deltaX / radius, deltaY / radius);
    };

    const handleEnd = () => {
        setStickPos({ x: 0, y: 0 });
        setJoystick(0, 0);
    };

    return (
        <div 
            style={{
                position: 'relative',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                touchAction: 'none',
                zIndex: 100,
                pointerEvents: 'auto' // Permite interação exclusiva
            }}
            ref={baseRef}
            onPointerDown={(e) => {
                e.target.setPointerCapture(e.pointerId);
                handleMove(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
                if (e.buttons > 0) handleMove(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
                e.target.releasePointerCapture(e.pointerId);
                handleEnd();
            }}
            onPointerCancel={handleEnd}
        >
            {/* Arrows to match reference image */}
            <div style={{ position: 'absolute', top: '-15px', color: '#666', fontSize: '10px' }}>▲</div>
            <div style={{ position: 'absolute', bottom: '-15px', color: '#666', fontSize: '10px', transform: 'rotate(180deg)' }}>▲</div>
            <div style={{ position: 'absolute', left: '-15px', color: '#666', fontSize: '10px', transform: 'rotate(-90deg)' }}>▲</div>
            <div style={{ position: 'absolute', right: '-15px', color: '#666', fontSize: '10px', transform: 'rotate(90deg)' }}>▲</div>
            
            <div 
                style={{
                    width: '25px',
                    height: '25px',
                    borderRadius: '50%',
                    background: 'rgba(168, 85, 247, 0.5)',
                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)',
                    transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
                    transition: stickPos.x === 0 && stickPos.y === 0 ? 'transform 0.2s ease-out' : 'none'
                }}
            />
        </div>
    );
}
