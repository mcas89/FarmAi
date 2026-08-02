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
import { useGraphicsSystem } from '../../systems/useGraphicsSystem';
import { RemotePlayer } from './RemotePlayer';
import { auth } from '../../config/firebase';
import * as THREE from 'three';

// Decaimento exponencial independente de framerate.
// Substitui lerp(a, b, delta*fator), que pode "estourar" (overshoot) em quedas de FPS
// e causar o efeito de câmera "chacoalhando"/oscilando.
function expDecay(current, target, decay, dt) {
    return target + (current - target) * Math.exp(-decay * dt);
}

function shortestAngleDelta(from, to) {
    let d = to - from;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
}

/**
 * Câmera chase (atrás do personagem) ao andar/correr.
 * No idle/farm, libera OrbitControls para o jogador girar livremente.
 */
function CameraController() {
    const controlsRef = useRef();
    const { camera } = useThree();
    
    const cameraTarget = useRef(new THREE.Vector3(0, 1.5, 0));
    const smoothedYaw = useRef(null);
    const idleTimer = useRef(999);
    const isMapMode = useUISystem((state) => state.isMapMode);
    
    useFrame((state, delta) => {
        if (!controlsRef.current) return;
        const controls = controlsRef.current;
        const dt = Math.min(delta, 0.05);
        
        if (isMapMode) {
            const centerTarget = new THREE.Vector3(0, 0, 0);
            cameraTarget.current.x = expDecay(cameraTarget.current.x, centerTarget.x, 3.0, dt);
            cameraTarget.current.y = expDecay(cameraTarget.current.y, centerTarget.y, 3.0, dt);
            cameraTarget.current.z = expDecay(cameraTarget.current.z, centerTarget.z, 3.0, dt);
            
            camera.fov = expDecay(camera.fov, 45, 2.0, dt);
            camera.updateProjectionMatrix();
            
            controls.minDistance = expDecay(controls.minDistance || 3.5, 30, 2.0, dt);
            controls.maxDistance = 250;
            controls.enableRotate = true;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
            controls.target.copy(cameraTarget.current);
            return;
        }

        const pos = usePlayerSystem.getState().position;
        const yaw = usePlayerSystem.getState().yaw || 0;
        const currentState = usePlayerSystem.getState().currentState;
        const comboCount = useAuraSystem.getState().comboCount;
        const isFarming = useFarmSystem.getState().isLeftFarming || useFarmSystem.getState().isRightFarming;
        const isChasing = currentState === 'walk' || currentState === 'run' || currentState === 'levitating';

        // Inicializa yaw suavizado a partir do offset atual da câmera
        if (smoothedYaw.current === null) {
            const ox = camera.position.x - pos[0];
            const oz = camera.position.z - pos[2];
            // offset câmera = atrás do personagem → yaw = atan2(-ox, -oz)
            smoothedYaw.current = Math.atan2(-ox, -oz);
        }

        let shakeX = 0, shakeY = 0, shakeZ = 0;
        if (comboCount >= 400) {
            const shakeIntensity = comboCount >= 500 ? 0.035 : 0.01;
            shakeX = (Math.random() - 0.5) * shakeIntensity;
            shakeY = (Math.random() - 0.5) * shakeIntensity;
            shakeZ = (Math.random() - 0.5) * shakeIntensity;
        }

        if (isChasing) {
            idleTimer.current = 0;
            controls.enableRotate = false;
            controls.autoRotate = false;

            const yawDelta = shortestAngleDelta(smoothedYaw.current, yaw);
            const yawFollow = currentState === 'run' ? 6.5 : 5.0;
            smoothedYaw.current += yawDelta * (1 - Math.exp(-yawFollow * dt));

            let dist = 5.8;
            let height = 2.55;
            let lookAhead = 1.15;
            let lookHeight = 1.55;
            let targetFov = 42;
            let posDecay = 5.2;

            if (currentState === 'run') {
                dist = 7.0;
                height = 2.85;
                lookAhead = 1.85;
                lookHeight = 1.5;
                targetFov = 50;
                posDecay = 6.8;
            } else if (currentState === 'levitating') {
                dist = 7.4;
                height = 3.25;
                lookAhead = 1.25;
                lookHeight = 1.9;
                targetFov = 58;
                posDecay = 4.2;
            }

            const shoulder = 0.12;
            const sy = smoothedYaw.current;
            // Atrás do personagem + bias de ombro
            const behindX = -Math.sin(sy) * dist + Math.cos(sy) * shoulder;
            const behindZ = -Math.cos(sy) * dist - Math.sin(sy) * shoulder;

            const desiredX = pos[0] + behindX + shakeX;
            const desiredY = pos[1] + height + shakeY;
            const desiredZ = pos[2] + behindZ + shakeZ;

            camera.position.x = expDecay(camera.position.x, desiredX, posDecay, dt);
            camera.position.y = expDecay(camera.position.y, desiredY, posDecay, dt);
            camera.position.z = expDecay(camera.position.z, desiredZ, posDecay, dt);

            const idealTarget = new THREE.Vector3(
                pos[0] + Math.sin(sy) * lookAhead + shakeX * 0.3,
                pos[1] + lookHeight,
                pos[2] + Math.cos(sy) * lookAhead + shakeZ * 0.3
            );

            cameraTarget.current.x = expDecay(cameraTarget.current.x, idealTarget.x, 7.5, dt);
            cameraTarget.current.y = expDecay(cameraTarget.current.y, idealTarget.y, 7.5, dt);
            cameraTarget.current.z = expDecay(cameraTarget.current.z, idealTarget.z, 7.5, dt);

            camera.fov = expDecay(camera.fov, targetFov, 2.2, dt);
            camera.updateProjectionMatrix();

            controls.minDistance = dist * 0.8;
            controls.maxDistance = 15;
            controls.target.copy(cameraTarget.current);
            controls.update();
            return;
        }

        // ==========================================
        // IDLE / FARM: orbit livre (após breve delay)
        // ==========================================
        idleTimer.current += dt;
        if (idleTimer.current > 0.4) {
            controls.enableRotate = true;
        }

        // Mantém yaw alinhado ao ângulo atual da orbit (entrada suave no próximo chase)
        {
            const ox = camera.position.x - cameraTarget.current.x;
            const oz = camera.position.z - cameraTarget.current.z;
            if (ox * ox + oz * oz > 0.01) {
                smoothedYaw.current = Math.atan2(-ox, -oz);
            }
        }

        let targetFov = 35;
        if (isFarming) targetFov = 46;
        camera.fov = expDecay(camera.fov, targetFov, 2.0, dt);
        camera.updateProjectionMatrix();

        let targetAutoRotateSpeed = 0;
        if (comboCount >= 1000) targetAutoRotateSpeed = 1.5;
        else if (comboCount >= 700 && currentState === 'levitating') targetAutoRotateSpeed = 0.5;

        if (targetAutoRotateSpeed > 0 && idleTimer.current > 0.4) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = expDecay(controls.autoRotateSpeed || 0, targetAutoRotateSpeed, 3.0, dt);
        } else {
            controls.autoRotate = false;
        }

        let breathY = 0;
        if (currentState === 'idle' && comboCount < 700) {
            breathY = Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
        }

        const idealTarget = new THREE.Vector3(
            pos[0] + shakeX,
            pos[1] + 1.7 + shakeY + breathY,
            pos[2] + shakeZ
        );

        cameraTarget.current.x = expDecay(cameraTarget.current.x, idealTarget.x, 6.0, dt);
        cameraTarget.current.y = expDecay(cameraTarget.current.y, idealTarget.y, 6.0, dt);
        cameraTarget.current.z = expDecay(cameraTarget.current.z, idealTarget.z, 6.0, dt);

        const targetMinDist = isFarming ? 4.2 : 1.4;
        controls.minDistance = expDecay(controls.minDistance || 3.5, targetMinDist, 2.0, dt);
        controls.maxDistance = 15;
        controls.target.copy(cameraTarget.current);
    });
    
    const isMapModeState = useUISystem((state) => state.isMapMode);
    
    return <OrbitControls 
        ref={controlsRef} 
        enablePan={isMapModeState} 
        makeDefault 
        minDistance={1.2}
        maxDistance={isMapModeState ? 250 : 15} 
        maxPolarAngle={Math.PI / 2 - 0.12} 
        minPolarAngle={0.15} 
        enableDamping={false} 
    />;
}

const MemoizedPostProcessing = React.memo(PostProcessingEffects);

const FPS_WARMUP_MS = 2500;
const FPS_SAMPLE_MS = 10000;

/**
 * Mede FPS no mundo e, em modo Automático, rebaixa o tier se estiver lento.
 * Roda uma vez por sessão (controlado pelo useGraphicsSystem).
 */
function FpsAdapter() {
    const samplesRef = useRef([]);
    const startRef = useRef(null);
    const doneRef = useRef(false);

    useFrame((_state, delta) => {
        if (doneRef.current) return;

        const gfx = useGraphicsSystem.getState();
        if (gfx.mode !== 'auto' || gfx.fpsAdaptedThisSession) {
            doneRef.current = true;
            return;
        }

        const now = performance.now();
        if (startRef.current === null) startRef.current = now;
        const elapsed = now - startRef.current;

        // Ignora os primeiros segundos (shader compile / loading)
        if (elapsed < FPS_WARMUP_MS) return;

        const fps = delta > 0 ? (1 / delta) : 60;
        samplesRef.current.push(Math.min(Math.max(fps, 1), 120));

        if (elapsed >= FPS_WARMUP_MS + FPS_SAMPLE_MS) {
            doneRef.current = true;
            const samples = samplesRef.current;
            if (samples.length === 0) return;
            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            useGraphicsSystem.getState().adaptFromFps(avg);
        }
    });

    return null;
}

export function Scene() {
    const activeModel = usePlayerSystem(state => state.activeModel);
    const isOnlineMode = useUISystem(state => state.isOnlineMode);
    const remotePlayers = useMultiplayerSystem(state => state.remotePlayers);
    const effectiveTier = useGraphicsSystem(state => state.effectiveTier);
    const settings = useGraphicsSystem(state => state.settings);
    const myUid = auth?.currentUser?.uid;

    return (
        <Canvas
            key={`scene-${effectiveTier}`}
            shadows={settings.shadows ? { type: THREE.PCFShadowMap } : false}
            dpr={settings.dpr}
            gl={{
                antialias: settings.antialias,
                powerPreference: settings.powerPreference,
                stencil: false,
            }}
            camera={{ position: [0, 5.5, -14], fov: 45, near: 0.1, far: 500 }}
        >
            <ambientLight intensity={0.2} /> {/* Luz de preenchimento mínima extra */}
            <ParkEnvironment />
            
            <Avatar key={activeModel} url={`/models/${activeModel}`} />
            
            {/* Renderiza os outros jogadores se estiver online */}
            {isOnlineMode && Object.entries(remotePlayers).map(([sessionId, data]) => {
                if (sessionId === useMultiplayerSystem.getState().currentRoomId) return null; // Não renderizar a si mesmo
                return <RemotePlayer key={sessionId} playerData={data} />;
            })}
            
            <AuraEffects />
            {/* <MemoizedPostProcessing /> */}
            
            <CameraController />
            <FpsAdapter />
        </Canvas>
    );
}
