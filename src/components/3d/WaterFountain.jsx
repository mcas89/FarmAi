import React, { useEffect, useRef } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function WaterFountain(props) {
    const { scene } = useGLTF('/itens/fonte_agua.glb');
    const waterMaterials = useRef([]);

    useEffect(() => {
        // Clona a cena para garantir que possamos modificá-la sem afetar cache global
        const clonedScene = scene.clone();
        
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                if (child.material) {
                    // Tenta identificar qual é o material da água pelo nome
                    const matName = child.material.name.toLowerCase();
                    const isWater = matName.includes('agua') || matName.includes('water') || matName.includes('liquid') || child.material.transparent;
                    
                    if (isWater) {
                        // Fazemos um clone do material para animar separadamente sem bugar outros objetos
                        child.material = child.material.clone();
                        
                        // Configurações para deixar a água no estilo Anime/Stylized
                        child.material.transparent = true;
                        child.material.opacity = 0.65;
                        child.material.color = new THREE.Color('#38bdf8'); // Azul piscina vivo
                        child.material.roughness = 0.05;
                        child.material.metalness = 0.1;
                        child.material.envMapIntensity = 2.0;

                        // Se não tiver mapa normal/bump, a gente força os UVs a repetirem para podermos deslizar a cor
                        if (child.material.map) {
                            child.material.map.wrapS = THREE.RepeatWrapping;
                            child.material.map.wrapT = THREE.RepeatWrapping;
                        }

                        waterMaterials.current.push(child.material);
                    } else {
                        // Para as pedras/concreto da fonte, deixa opaco e projeta sombra normal
                        child.material.roughness = 0.8;
                    }
                }
            }
        });
        
        // Substituímos a cena carregada pela clonada
        scene.copy(clonedScene);
        
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
            <primitive object={scene} />
        </group>
    );
}

useGLTF.preload('/itens/fonte_agua.glb');
