import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function ProceduralGrass() {
    const meshRef = useRef();
    const materialRef = useRef();

    // 25.000 instâncias garantem uma boa densidade no mobile sem pesar
    const GRASS_COUNT = 25000; 

    const { count, instances, grassGeo } = useMemo(() => {
        const random = mulberry32(444);
        const dummy = new THREE.Object3D();
        const colorObj = new THREE.Color();
        
        // Cria e translada a geometria uma única vez
        const geo = new THREE.PlaneGeometry(0.25, 0.5);
        geo.translate(0, 0.25, 0);
        
        const palettes = ['#6ee7b7', '#34d399', '#4ade80', '#22c55e'];
        const flowerColors = ['#fef08a', '#ffffff'];

        const inst = [];
        
        for (let i = 0; i < GRASS_COUNT * 2 && inst.length < GRASS_COUNT; i++) {
            const x = (random() - 0.5) * 96; 
            const z = (random() - 0.5) * 96;
            
            // Regras de Omissão (onde NÃO colocar grama)
            const inPlaza = Math.hypot(x, z) < 15.5; // Praça central
            const inCrossStreet = Math.abs(x) < 5.2 || Math.abs(z) < 5.2; // Ruas cruzadas
            
            if (inPlaza || inCrossStreet) continue;

            dummy.position.set(x, 0, z);
            dummy.rotation.y = random() * Math.PI;
            dummy.rotation.x = (random() - 0.5) * 0.15; // Inclinação leve
            dummy.rotation.z = (random() - 0.5) * 0.15;
            
            const scale = 0.5 + random() * 0.8;
            
            const isFlower = random() > 0.96; // 4% de chance de ser flor
            if (isFlower) {
                colorObj.set(flowerColors[Math.floor(random() * flowerColors.length)]);
                dummy.scale.set(scale * 0.5, scale * 0.5, scale * 0.5); // Flores menores
            } else {
                colorObj.set(palettes[Math.floor(random() * palettes.length)]);
                dummy.scale.set(scale, scale, scale);
            }
            
            dummy.updateMatrix();
            inst.push({ matrix: dummy.matrix.clone(), color: colorObj.clone() });
        }
        
        return { count: inst.length, instances: inst, grassGeo: geo };
    }, []);

    useEffect(() => {
        if (!meshRef.current) return;
        for (let i = 0; i < count; i++) {
            meshRef.current.setMatrixAt(i, instances[i].matrix);
            meshRef.current.setColorAt(i, instances[i].color);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }, [count, instances]);

    useFrame((state) => {
        if (materialRef.current && materialRef.current.userData.shader) {
            // Tempo correndo lentamente para movimento suave
            materialRef.current.userData.shader.uniforms.time.value = state.clock.elapsedTime * 0.6;
        }
    });

    const onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 };
        shader.vertexShader = `
            uniform float time;
            ${shader.vertexShader}
        `.replace(
            `#include <begin_vertex>`,
            `
            vec3 transformed = vec3(position);
            // Só movimenta a ponta da grama (y > 0)
            if (position.y > 0.0) {
                vec4 globalPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                
                // Ondas grandes e suaves de vento
                float windWave = sin(globalPos.x * 0.2 + time) * cos(globalPos.z * 0.2 + time);
                
                // Fator de movimento pequeno (0.05) multiplicado pela altura para não arrancar a base
                transformed.x += windWave * 0.05 * position.y; 
                transformed.z += windWave * 0.05 * position.y;
            }
            `
        );
        materialRef.current.userData.shader = shader;
    };

    return (
        <instancedMesh ref={meshRef} args={[grassGeo, null, count]} receiveShadow>
            <meshLambertMaterial 
                ref={materialRef}
                onBeforeCompile={onBeforeCompile}
                side={THREE.DoubleSide}
                // Habilita as cores individuais
                vertexColors={true} 
            />
        </instancedMesh>
    );
}
