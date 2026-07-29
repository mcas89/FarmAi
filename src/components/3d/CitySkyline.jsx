import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Helper: Seeded Random
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Componente auxiliar para carregar o modelo sem quebrar caso dê erro e com scale ajustável
function GLTFBuilding({ url, position, rotation, scale = 1 }) {
    const { scene } = useGLTF(url);
    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Desliga o toneMapped para cores mais anime se tiver material
                if (child.material) {
                    child.material.toneMapped = false;
                }
            }
        });
        return clone;
    }, [scene]);

    return <primitive object={clonedScene} position={position} rotation={rotation} scale={scale} />;
}

export function CitySkyline() {
    // Parâmetros do "Muro"
    const distance = 44; // Distância do centro
    const blockSize = 8; // Largura aproximada de cada bloco procedural

    // Gera os blocos procedurais (JS)
    const proceduralBlocks = useMemo(() => {
        const blocks = [];
        const random = mulberry32(9999);
        const sides = [
            { axis: 'z', val: distance, range: [-distance, distance], rot: 0 },
            { axis: 'z', val: -distance, range: [-distance, distance], rot: Math.PI },
            { axis: 'x', val: distance, range: [-distance, distance], rot: -Math.PI / 2 },
            { axis: 'x', val: -distance, range: [-distance, distance], rot: Math.PI / 2 },
        ];

        // Cores noturnas / anime city
        const colors = ['#1a1b26', '#24283b', '#1f2335', '#292e42'];

        sides.forEach(side => {
            for (let i = side.range[0]; i < side.range[1]; i += blockSize) {
                // Deixa um buraco nos centros (onde ficam os finais das ruas: i entre -10 e 10) 
                // para podermos colocar os prédios em GLTF ali.
                if (i > -12 && i < 12) continue;

                const width = blockSize * (0.8 + random() * 0.4);
                const height = 15 + random() * 25; // Prédios entre 15 e 40 de altura
                const depth = 4 + random() * 4;
                const x = side.axis === 'x' ? side.val : i + (random() * 2 - 1);
                const z = side.axis === 'z' ? side.val : i + (random() * 2 - 1);
                const color = colors[Math.floor(random() * colors.length)];

                blocks.push({
                    position: [x, height / 2 - 1, z],
                    args: [width, height, depth],
                    rotation: [0, side.rot, 0],
                    color: color
                });
            }
        });

        return blocks;
    }, []);

    // Posições estratégicas para os prédios GLB (Finais das 4 ruas)
    // As ruas são Norte, Sul, Leste, Oeste.
    // X=0, Z=-42 (Norte)
    // X=0, Z=42  (Sul)
    // X=42, Z=0  (Leste)
    // X=-42, Z=0 (Oeste)
    return (
        <group>
            {/* 1. Blocos de JS Puro (Levinhos) */}
            {proceduralBlocks.map((block, i) => (
                <mesh key={i} position={block.position} rotation={block.rotation} castShadow receiveShadow>
                    <boxGeometry args={block.args} />
                    <meshStandardMaterial color={block.color} roughness={0.9} metalness={0.1} toneMapped={false} />
                </mesh>
            ))}

            {/* 2. Prédios Reais (GLB) nos finais das ruas principais */}
            {/* Norte */}
            <GLTFBuilding url="/itens/predio1.glb" position={[0, 0, -42]} rotation={[0, 0, 0]} scale={1.5} />
            <GLTFBuilding url="/itens/predio2.glb" position={[-8, 0, -42]} rotation={[0, 0, 0]} scale={1.2} />
            <GLTFBuilding url="/itens/predio3.glb" position={[8, 0, -42]} rotation={[0, 0, 0]} scale={1.2} />

            {/* Sul */}
            <GLTFBuilding url="/itens/predio1.glb" position={[0, 0, 42]} rotation={[0, Math.PI, 0]} scale={1.6} />
            <GLTFBuilding url="/itens/predio2.glb" position={[8, 0, 42]} rotation={[0, Math.PI, 0]} scale={1.3} />
            
            {/* Leste */}
            <GLTFBuilding url="/itens/predio2.glb" position={[42, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={1.5} />
            <GLTFBuilding url="/itens/predio3.glb" position={[42, 0, 8]} rotation={[0, -Math.PI / 2, 0]} scale={1.2} />

            {/* Oeste */}
            <GLTFBuilding url="/itens/predio3.glb" position={[-42, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={1.5} />
            <GLTFBuilding url="/itens/predio1.glb" position={[-42, 0, -8]} rotation={[0, Math.PI / 2, 0]} scale={1.1} />
        </group>
    );
}

useGLTF.preload('/itens/predio1.glb');
useGLTF.preload('/itens/predio2.glb');
useGLTF.preload('/itens/predio3.glb');
