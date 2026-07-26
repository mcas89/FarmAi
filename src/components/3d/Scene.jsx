import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Avatar } from './Avatar';
import { AuraEffects } from './AuraEffects';
import { PostProcessingEffects } from './PostProcessingEffects';
import { ParkEnvironment } from './ParkEnvironment';
import { usePlayerSystem } from '../../systems/usePlayerSystem';
import { useAuraSystem } from '../../systems/useAuraSystem';
import { useFarmSystem } from '../../systems/useFarmSystem';
import { useUISystem } from '../../systems/useUISystem';
import { useMultiplayerSystem } from '../../systems/useMultiplayerSystem';
import { RemotePlayer } from './RemotePlayer';
import { auth } from '../../config/firebase';
import * as THREE from 'three';

// Câmera que segue a personagem (Estilo Aventura 3D Profissional)
function CameraController() {
    const controlsRef = useRef();
    const { camera } = useThree();
    
    // Alvo fantasma para criar o "Smooth Follow" (Atraso natural elástico)
    const cameraTarget = useRef(new THREE.Vector3(0, 1.5, 0));
    const isMapMode = useUISystem((state) => state.isMapMode);
    
    useFrame((state, delta) => {
        if (!controlsRef.current) return;
        
        if (isMapMode) {
            // ==========================================
            // MODO MAPA: Visão aérea de toda a cidade
            // ==========================================
            const centerTarget = new THREE.Vector3(0, 0, 0);
            cameraTarget.current.lerp(centerTarget, delta * 3.0);
            
            camera.fov = THREE.MathUtils.lerp(camera.fov, 45, delta * 2.0);
            camera.updateProjectionMatrix();
            
            controlsRef.current.minDistance = THREE.MathUtils.lerp(controlsRef.current.minDistance || 3.5, 30, delta * 2.0);
            controlsRef.current.maxDistance = 250;
            controlsRef.current.autoRotate = true;
            controlsRef.current.autoRotateSpeed = 0.5;
            
            controlsRef.current.target.copy(cameraTarget.current);
            return;
        }

        const pos = usePlayerSystem.getState().position;
        const currentState = usePlayerSystem.getState().currentState;
        const comboCount = useAuraSystem.getState().comboCount;
        const isFarming = useFarmSystem.getState().isLeftFarming || useFarmSystem.getState().isRightFarming;
        
        // ==========================================
        // 1. ZOOM FLUIDO E SEGURO (FOV Adaptativo)
        // ==========================================
        // Usar FOV para dar a sensação de espaço ao correr/farmar, pois modificar a distância 
        // fisicamente entra em conflito com as equações esféricas do OrbitControls.
        let targetFov = 35; 
        if (currentState === 'levitating') targetFov = 65; 
        else if (currentState === 'run') targetFov = 55; // Abre a lente para dar velocidade
        else if (isFarming) targetFov = 48; // Abre para ver o personagem farmando
        else if (currentState === 'walk') targetFov = 42; 
        
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 2.0);
        camera.updateProjectionMatrix();

        // ==========================================
        // 2. Rotação Cinemática (Apenas em Idle + Aura Alta)
        // ==========================================
        let targetAutoRotateSpeed = 0;
        if (comboCount >= 1000) targetAutoRotateSpeed = 1.5;
        else if (comboCount >= 700 && currentState === 'levitating') targetAutoRotateSpeed = 0.5;
        
        if (targetAutoRotateSpeed > 0) {
            controlsRef.current.autoRotate = true;
            controlsRef.current.autoRotateSpeed = THREE.MathUtils.lerp(controlsRef.current.autoRotateSpeed || 0, targetAutoRotateSpeed, delta);
        } else {
            controlsRef.current.autoRotate = false;
        }

        // ==========================================
        // 3. Tremor de Poder e Efeito Breathing (Respiração)
        // ==========================================
        let shakeX = 0, shakeY = 0, shakeZ = 0;
        if (comboCount >= 400) {
            const shakeIntensity = comboCount >= 500 ? 0.04 : 0.01;
            shakeX = (Math.random() - 0.5) * shakeIntensity;
            shakeY = (Math.random() - 0.5) * shakeIntensity;
            shakeZ = (Math.random() - 0.5) * shakeIntensity;
        }

        let breathY = 0;
        if (currentState === 'idle' && comboCount < 700) {
            breathY = Math.sin(state.clock.elapsedTime * 1.5) * 0.03; 
        }

        // ==========================================
        // 4. Smooth Follow Target (Foco Elástico)
        // ==========================================
        // O alvo foi subido para 1.8 (mais alto, força a câmera a se manter alta olhando levemente pra baixo)
        const idealTarget = new THREE.Vector3(pos[0] + shakeX, pos[1] + 1.8 + shakeY + breathY, pos[2] + shakeZ);
        
        const followSpeed = currentState === 'run' ? 4.0 : 6.0; 
        cameraTarget.current.lerp(idealTarget, delta * followSpeed);
        
        // ==========================================
        // 5. Auto-Zoom Dinâmico (Restaurar Visão)
        // ==========================================
        // Permite zoom gigante (1.2) apenas quando parado. Se andar ou farmar, 
        // a distância mínima empurra a câmera suavemente para trás.
        const isAction = currentState !== 'idle' || isFarming;
        const targetMinDist = isAction ? 4.5 : 1.2;
        controlsRef.current.minDistance = THREE.MathUtils.lerp(controlsRef.current.minDistance || 3.5, targetMinDist, delta * 2.0);
        controlsRef.current.maxDistance = 15; // Volta ao normal se sair do modo mapa
        
        // Passamos o alvo para o OrbitControls
        controlsRef.current.target.copy(cameraTarget.current);
    });
    
    // Recalcula enablePan e outras props via componente para reatividade rápida
    const isMapModeState = useUISystem((state) => state.isMapMode);
    
    return <OrbitControls 
        ref={controlsRef} 
        enablePan={isMapModeState} 
        makeDefault 
        minDistance={1.2} // Valor inicial, será substituído no useFrame
        maxDistance={isMapModeState ? 250 : 15} 
        maxPolarAngle={Math.PI / 2 - 0.15} 
        minPolarAngle={0.1} 
        enableDamping={true} 
        dampingFactor={0.06} 
    />;
}

const MemoizedPostProcessing = React.memo(PostProcessingEffects);

export function Scene() {
    const activeModel = usePlayerSystem(state => state.activeModel);
    const isOnlineMode = useUISystem(state => state.isOnlineMode);
    const playersInRoom = useMultiplayerSystem(state => state.playersInRoom);
    const myUid = auth?.currentUser?.uid;

    return (
        <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 5.5, -14], fov: 45 }}>
            <ambientLight intensity={0.2} /> {/* Luz de preenchimento mínima extra */}
            <ParkEnvironment />
            
            <Avatar key={activeModel} url={`/models/${activeModel}`} />
            
            {/* Renderiza os outros jogadores se estiver online */}
            {isOnlineMode && Object.entries(playersInRoom).map(([uid, data]) => {
                if (uid === myUid) return null; // Não renderizar a si mesmo
                return <RemotePlayer key={uid} playerData={data} />;
            })}
            
            <AuraEffects />
            {/* <MemoizedPostProcessing /> */}
            
            <CameraController />
        </Canvas>
    );
}
