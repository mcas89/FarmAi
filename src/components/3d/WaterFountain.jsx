import React, { useEffect, useRef } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { AmbientMagic } from './AmbientMagic';

export function WaterFountain(props) {
    const { scene } = useGLTF('/itens/fonte_agua.glb');
    const waterMaterials = useRef([]);

    // Usa useMemo para clonar a cena de forma segura uma única vez, antes do primeiro render
    const clonedScene = React.useMemo(() => {
        const clone = scene.clone();
        waterMaterials.current = []; // reseta o array para evitar vazamento se re-renderizar
        
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                if (child.material) {
                    // Clona o material para não afetar cache
                    child.material = child.material.clone();
                    
                    const matName = child.material.name.toLowerCase();
                    const isWater = matName.includes('agua') || matName.includes('water') || matName.includes('liquid') || child.material.transparent;
                    
                    if (isWater) {
                        child.material.transparent = true;
                        child.material.opacity = 0.65;
                        child.material.color = new THREE.Color('#38bdf8'); // Azul piscina vivo
                        child.material.roughness = 0.05;
                        child.material.metalness = 0.1;
                        child.material.envMapIntensity = 2.0;

                        if (child.material.map) {
                            child.material.map.wrapS = THREE.RepeatWrapping;
                            child.material.map.wrapT = THREE.RepeatWrapping;
                        }

                        waterMaterials.current.push(child.material);
                    } else {
                        // Para as pedras/concreto da fonte
                        child.material.roughness = 0.8;
                        // Garantir que não fique preta se o mapa falhar
                        child.material.needsUpdate = true;
                    }
                }
            }
        });
        
        return clone;
    }, [scene]);

    useFrame((state, delta) => {
        // Cria a animação da água deslizando e leve onda de cor
        waterMaterials.current.forEach(mat => {
            if (mat.map) {
                mat.map.offset.y -= delta * 0.4; // Água caindo ou fluindo
                mat.map.offset.x -= delta * 0.1;
            }
            if (mat.normalMap) {
                mat.normalMap.offset.y -= delta * 0.5;
            }
            
            // Leve pulsação na opacidade para parecer viva/espuma
            mat.opacity = 0.65 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        });
    });

    return (
        <group {...props}>
            <primitive object={clonedScene} />
            <AmbientMagic count={15} color="#38bdf8" radius={2.5} height={3} speed={0.4} size={0.3} position={[0, 0, 0]} />
        </group>
    );
}

useGLTF.preload('/itens/fonte_agua.glb');
