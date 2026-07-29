import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

let sharedGlowMap = null;
function getGlowMap() {
    if (sharedGlowMap) return sharedGlowMap;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

    gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    sharedGlowMap = new THREE.CanvasTexture(canvas);
    return sharedGlowMap;
}

export function AmbientMagic({ 
    count = 20, 
    color = '#a855f7', 
    radius = 3, 
    height = 4, 
    speed = 0.5, 
    size = 0.2,
    position = [0, 0, 0]
}) {
    const meshRef = useRef();

    // Cria as posições e dados iniciais das partículas
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * radius;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const y = Math.random() * height;
            
            // Fatores de velocidade individuais para variação orgânica
            const speedY = (0.5 + Math.random()) * speed;
            const speedX = (Math.random() - 0.5) * speed * 0.5;
            const speedZ = (Math.random() - 0.5) * speed * 0.5;
            
            temp.push({ x, y, z, speedY, speedX, speedZ, phase: Math.random() * Math.PI * 2 });
        }
        return temp;
    }, [count, radius, height, speed]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;

        particles.forEach((p, i) => {
            // Movimenta a partícula
            p.y += p.speedY * delta;
            p.x += p.speedX * delta + Math.sin(time + p.phase) * delta * 0.2;
            p.z += p.speedZ * delta + Math.cos(time + p.phase) * delta * 0.2;

            // Se subir demais, recicla na base
            if (p.y > height) {
                p.y = 0;
                // Reposiciona aleatoriamente na base para não ficar repetitivo
                const angle = Math.random() * Math.PI * 2;
                const r = Math.sqrt(Math.random()) * radius;
                p.x = Math.cos(angle) * r;
                p.z = Math.sin(angle) * r;
            }

            // Pulsação de tamanho baseada na altura e no tempo
            const scale = Math.sin((p.y / height) * Math.PI) * size * (0.8 + Math.sin(time * 2 + p.phase) * 0.2);

            dummy.position.set(p.x, p.y, p.z);
            dummy.scale.set(scale, scale, scale);
            // Faz a partícula sempre olhar para a câmera (billboard manual)
            dummy.rotation.copy(state.camera.rotation);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group position={position}>
            <instancedMesh ref={meshRef} args={[null, null, count]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial 
                    color={color}
                    map={getGlowMap()}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </instancedMesh>
        </group>
    );
}
