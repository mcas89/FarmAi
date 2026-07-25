import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAuraSystem } from '../../systems/useAuraSystem';
import { usePlayerSystem } from '../../systems/usePlayerSystem';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

// =========================================
// AURA KI — Energia Vibrante e Difusa
// =========================================
const MAX_PARTICLES = 100;

function KiAura({ comboCount }) {
    const meshRef = useRef();
    const timeRef = useRef(0);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const color = useMemo(() => new THREE.Color(), []);

    // Textura processual: Brilho muito difuso, simulando calor/fumaça energética
    const glowMap = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        
        // Centro estourado de luz, dissolvendo lentamente para as bordas invisíveis
        gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
        gradient.addColorStop(0.1, 'rgba(255,255,255,0.6)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.15)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    }, []);

    // Duas camadas de Ki:
    // 0..19: Fumaça densa (Nuvens de aura grudadas ao corpo)
    // 20..99: Faíscas leves (Pequenos fragmentos que orbitam)
    const particles = useMemo(() => {
        const arr = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const isAuraCloud = i < 20;
            arr.push({
                isCloud: isAuraCloud,
                life: Math.random(),
                lifeSpeed: isAuraCloud ? 0.3 + Math.random() * 0.2 : 0.4 + Math.random() * 0.4, // Velocidade de pulsação (nasce/morre)
                angle: Math.random() * Math.PI * 2,
                
                // Nuvens densas abraçam o corpo (raio menor), faíscas espirram um pouco mais longe
                radius: isAuraCloud ? 0.2 + Math.random() * 0.2 : 0.4 + Math.random() * 0.4, 
                
                // Tamanhos base, NÃO crescem muito nos combos altos
                baseSize: isAuraCloud ? 1.2 + Math.random() * 0.8 : 0.1 + Math.random() * 0.1,
                
                speed: isAuraCloud ? 0.5 + Math.random() * 0.5 : 1.0 + Math.random() * 1.0,
                
                // Altura FIXA da órbita. Isso impede que pareça FOGO subindo.
                // Nuvens ficam focadas no centro do corpo. Faíscas se espalham do pé à cabeça.
                heightOffset: isAuraCloud ? 0.0 + Math.random() * 1.0 : -0.5 + Math.random() * 2.0,
            });
        }
        return arr;
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        timeRef.current += delta;
        const t = timeRef.current;
        const camPos = state.camera.position;

        // Foco em INTENSIDADE e VELOCIDADE, mantendo o tamanho e movimento contidos
        let activeClouds = 0;
        let activeSparks = 0;
        let intensityMult = 1.0;
        let speedMult = 1.0;
        let targetHex = '#aaddff'; 
        
        if (comboCount >= 500) { // Estado Supremo
            activeClouds = 20;
            activeSparks = 80;
            intensityMult = 2.5; // Muito brilho, mas tamanho controlado
            speedMult = 4.0;     // Orbital altíssimo (Poder concentrado)
            targetHex = '#ffd700'; // Dourado
        } else if (comboCount >= 250) { // Energia Concentrada
            activeClouds = 20;
            activeSparks = 80;
            intensityMult = 2.0; 
            speedMult = 2.5;     // Fluxo circulatório super rápido
            targetHex = `hsl(${Math.floor(t * 150) % 360}, 100%, 70%)`; 
        } else if (comboCount >= 200) { // Forte e estável
            activeClouds = 20;
            activeSparks = 60;
            intensityMult = 1.6; 
            speedMult = 1.6;
            targetHex = '#00ffff'; 
        } else if (comboCount >= 150) {
            activeClouds = 15;
            activeSparks = 40;
            intensityMult = 1.3;
            speedMult = 1.2;
            targetHex = '#44ccff';
        } else if (comboCount >= 100) { // Estável
            activeClouds = 10;
            activeSparks = 20;
            intensityMult = 1.0;
            speedMult = 1.0;
            targetHex = '#66bbee';
        } else if (comboCount >= 50) { // Despertar
            activeClouds = 5;  
            activeSparks = 10; 
            intensityMult = 0.6; // Suave
            speedMult = 0.5; // Lento
        }

        color.set(targetHex);

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            
            const isActive = p.isCloud ? (i < activeClouds) : (i - 20 < activeSparks);
            
            if (isActive) {
                p.life += delta * p.lifeSpeed; 
                if (p.life >= 1.0) {
                    p.life = 0;
                }

                // Curva de brilho parabólica: cresce e se dissipa no ar
                const lifeCurve = p.life * (1.0 - p.life) * 4.0;
                
                // Altura com pequena oscilação orgânica
                const h = p.heightOffset + Math.sin(t * 5.0 + p.angle) * 0.05;
                
                const currentAngle = p.angle + (t * p.speed * speedMult);

                // Vibração orgânica da energia nos combos altos
                const vibration = (comboCount >= 250) ? Math.sin(t * 40 + i) * 0.03 : 0;
                const currentRadius = p.radius + vibration;

                dummy.position.set(Math.cos(currentAngle) * currentRadius, h, Math.sin(currentAngle) * currentRadius);
                dummy.lookAt(camPos);
                
                // Tamanho não cresce muito nos combos altos
                const s = p.baseSize * lifeCurve * (intensityMult > 1.5 ? 1.2 : 1.0);
                dummy.scale.set(s, s, s);
                dummy.updateMatrix();
                
                meshRef.current.setMatrixAt(i, dummy.matrix);

                // Brilho é afetado pela intensidade do combo
                const opacityMult = p.isCloud ? (0.25 * intensityMult) : (0.8 * intensityMult);
                const fadeColor = color.clone().multiplyScalar(lifeCurve * opacityMult);
                meshRef.current.setColorAt(i, fadeColor);
            } else {
                dummy.position.set(0, -9999, 0);
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
                meshRef.current.setColorAt(i, new THREE.Color(0x000000));
            }
        }
        
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    if (comboCount < 50) return null;

    return (
        <instancedMesh ref={meshRef} args={[null, null, MAX_PARTICLES]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial 
                map={glowMap}
                toneMapped={false} 
                blending={THREE.AdditiveBlending} 
                transparent 
                depthWrite={false} 
            />
        </instancedMesh>
    );
}

// =========================================
// AURA EFFECTS — Componente Principal
// =========================================
export function AuraEffects() {
    const { comboCount, hitId, lastPoints, message } = useAuraSystem();
    const position = usePlayerSystem((state) => state.position);

    const groupRef = useRef();
    const isHighCombo = comboCount >= 250;

    // Pop-up de Texto
    const textRef = useRef();
    const [popup, setPopup] = useState({ text: '', x: 0, y: 0, opacity: 0, scale: 0, isCombo: false });

    useEffect(() => {
        if (hitId !== 0 && lastPoints > 0) {
            const isCombo = lastPoints >= 50;
            const popupText = (message && message.trim() !== '') ? message : `+${lastPoints}`;
            
            setPopup({
                text: popupText,
                x: isCombo ? 0.4 : 0.0,
                y: isCombo ? 1.5 : 0.5,
                opacity: 1.5,
                scale: 0.1,
                isCombo,
            });
        }
    }, [hitId, lastPoints, message]);

    useFrame((_, delta) => {
        if (groupRef.current) {
            const shake = isHighCombo ? (Math.random() - 0.5) * 0.04 : 0;
            groupRef.current.position.set(
                position[0] + shake,
                position[1] + shake,
                position[2]
            );
        }

        if (popup.opacity > 0) {
            setPopup((prev) => {
                if (prev.opacity <= 0) return prev;
                const newOpacity = prev.opacity - delta * 0.7;
                const jumpForce  = Math.max(0, 1.5 - (1.5 - prev.opacity) * 3);
                const newY       = prev.y + delta * jumpForce;
                let newScale     = prev.scale;
                if (prev.opacity > 1.3)  newScale = prev.scale + delta * 15;
                else if (prev.scale > 1.0) newScale = prev.scale - delta * 5;
                return { ...prev, y: newY, opacity: newOpacity, scale: Math.max(0, newScale) };
            });
        }
    });

    const colorCombo  = useMemo(() => new THREE.Color('#d8b4fe').multiplyScalar(3.0), []);
    const colorNormal = useMemo(() => new THREE.Color('#86efac').multiplyScalar(3.0), []);

    return (
        <group ref={groupRef} position={[position[0], position[1], position[2]]}>
            {/* Pop-up de pontos MENOR e SEMPRE NA FRENTE */}
            <Billboard position={[popup.x, popup.y + 1.2, 0.8]}>
                <Text
                    ref={textRef}
                    fontSize={(popup.isCombo ? 0.20 : 0.13) * Math.max(0.01, popup.scale)}
                    color={popup.isCombo ? colorCombo : colorNormal}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                    outlineColor={popup.isCombo ? '#7e22ce' : '#166534'}
                    fillOpacity={Math.max(0, Math.min(popup.opacity, 1))}
                    outlineOpacity={Math.max(0, Math.min(popup.opacity, 1))}
                    depthTest={false} 
                    renderOrder={999}
                >
                    {popup.text}
                </Text>
            </Billboard>

            {/* Nova Aura de Ki: Difusa, gasosa e envolvente */}
            <KiAura comboCount={comboCount} />
        </group>
    );
}
