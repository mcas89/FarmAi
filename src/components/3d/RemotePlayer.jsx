import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { AnimationEngine } from '../../systems/animation/AnimationEngine';
import { Html } from '@react-three/drei';
import { Diamond } from 'lucide-react';
import { getPlayerLevel, getPlayerTitle } from '../../systems/progressionRules';

export function RemotePlayer({ playerData }) {
  const [vrm, setVrm] = useState(null);
  
  const targetPos = useRef(new THREE.Vector3(
    playerData.position?.[0] || 0, 
    playerData.position?.[1] || 0, 
    playerData.position?.[2] || 0
  ));
  const currentPos = useRef(new THREE.Vector3(
    playerData.position?.[0] || 0, 
    playerData.position?.[1] || 0, 
    playerData.position?.[2] || 0
  ));
  const groupRef = useRef();
  
  // Efeito Visual de ganho de aura (Float UP)
  const lastAuraRef = useRef(playerData.aura || 0);
  const [showAuraVfx, setShowAuraVfx] = useState(false);
  const [auraGain, setAuraGain] = useState(0);

  useEffect(() => {
    let timeout;
    if ((playerData.aura || 0) > lastAuraRef.current) {
        const diff = Math.floor((playerData.aura || 0) - lastAuraRef.current);
        setAuraGain(diff);
        setShowAuraVfx(true);
        timeout = setTimeout(() => setShowAuraVfx(false), 1200);
    }
    lastAuraRef.current = playerData.aura || 0;
    return () => clearTimeout(timeout);
  }, [playerData.aura]);
  
  // Carrega o modelo VRM correto quando o modelo mudar
  useEffect(() => {
    let isMounted = true;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    const modelFile = playerData.model || 'san.vrm';
    const url = `/models/${modelFile}`;

    loader.load(url, (gltf) => {
      if (!isMounted) {
          gltf.scene.traverse((child) => {
              if (child.isMesh) {
                  child.geometry?.dispose();
                  if (child.material) {
                      const mats = Array.isArray(child.material) ? child.material : [child.material];
                      mats.forEach(m => { m.map?.dispose(); m.dispose(); });
                  }
              }
          });
          return;
      }
      
      const vrmData = gltf.userData.vrm;
      
      gltf.scene.traverse((child) => {
          if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
          }
      });
      
      vrmData.scene.rotation.y = Math.PI; 
      vrmData.scene.position.set(0, 0, 0);
      
      // Cada RemotePlayer tem seu próprio estado de pose isolado
      AnimationEngine.setBasePose('arms_down_pose', vrmData.scene.uuid);
      setVrm(vrmData);
    }, undefined, (err) => {
      console.error(`[RemotePlayer] Erro ao carregar modelo ${modelFile}:`, err);
    });

    return () => {
      isMounted = false;
      setVrm((currentVrm) => {
          if (currentVrm) {
              currentVrm.scene.traverse((child) => {
                  if (child.isMesh) {
                      child.geometry?.dispose();
                      if (child.material) {
                          const mats = Array.isArray(child.material) ? child.material : [child.material];
                          mats.forEach(m => { m.map?.dispose(); m.dispose(); });
                      }
                  }
              });
          }
          return null;
      });
    };
  }, [playerData.model]);

  // Atualiza a posição alvo sempre que receber nova posição do servidor
  useEffect(() => {
    if (playerData.position) {
      targetPos.current.set(
        playerData.position[0] || 0, 
        playerData.position[1] || 0, 
        playerData.position[2] || 0
      );
    }
  }, [playerData.position]);

  useFrame((state, delta) => {
    if (!vrm) return;
    vrm.update(delta);
    
    // Interpola posição suavemente
    currentPos.current.lerp(targetPos.current, Math.min(10 * delta, 1));
    
    if (groupRef.current) {
        groupRef.current.position.copy(currentPos.current);
    }
    
    // Rotaciona o avatar na direção que está se movendo
    const dir = new THREE.Vector3().subVectors(targetPos.current, currentPos.current);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
        dir.normalize();
        const targetAngle = Math.atan2(dir.x, dir.z);
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
        vrm.scene.quaternion.slerp(targetQuat, Math.min(10 * delta, 1)); 
    }

    // Estado de animação vindo do servidor
    const isMoving = playerData.animation === 'run' || playerData.animation === 'walk';
    const isRunning = playerData.animation === 'run';
    const leftFarmActive = playerData.leftFarm || false;
    const rightFarmActive = playerData.rightFarm || false;
    const isIdle = !isMoving && !leftFarmActive && !rightFarmActive;

    // comboCount simulado: se está fazendo farm, usa 4 (threshold mínimo para ativar animação)
    // Os braços vão se mover se leftFarm ou rightFarm estiver ativo
    const simulatedCombo = (leftFarmActive || rightFarmActive) ? 4 : 0;
    
    // AnimationEngine é isolado por uuid do VRM — não afeta o jogador local
    AnimationEngine.update(vrm, delta, leftFarmActive, rightFarmActive, isMoving, isIdle, isRunning, simulatedCombo);
  });

  const aura = playerData.aura || 0;
  const level = getPlayerLevel(aura);
  const title = getPlayerTitle(level);
  const playerName = playerData.name || 'Jogador';

  return vrm ? (
    <group ref={groupRef}>
        <primitive object={vrm.scene} />
        
        {/* CSS para Animação Flutuante */}
        <Html>
            <style>{`
                @keyframes floatUp {
                    0% { transform: scale(0.5) translateY(0); opacity: 0; }
                    20% { transform: scale(1.2) translateY(-10px); opacity: 1; }
                    80% { transform: scale(1) translateY(-30px); opacity: 1; }
                    100% { transform: scale(0.8) translateY(-40px); opacity: 0; }
                }
            `}</style>
        </Html>

        {showAuraVfx && (
            <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none', zIndex: 10 }}>
                <div style={{
                    color: auraGain >= 50 ? '#a855f7' : '#4ade80', 
                    fontSize: '1.5rem', fontWeight: '900', fontStyle: 'italic',
                    textShadow: auraGain >= 50 ? '0 0 10px rgba(168,85,247,0.8)' : '0 0 10px rgba(74,222,128,0.8)',
                    animation: 'floatUp 1.2s ease forwards'
                }}>
                    +{auraGain}
                </div>
            </Html>
        )}

        <Html position={[0, 3.2, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{
                background: 'rgba(10, 10, 15, 0.75)', backdropFilter: 'blur(8px)',
                padding: '4px 10px', borderRadius: '12px',
                border: '1px solid rgba(168,85,247,0.4)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: '#a855f7', color: '#fff', fontSize: '0.6rem', fontWeight: '900', padding: '1px 4px', borderRadius: '4px' }}>LV {level}</span>
                    <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '900', textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>{playerName}</span>
                </div>
                <div style={{ color: '#d8b4fe', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                    {title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Diamond size={10} color="#a855f7" />
                    <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>{Math.floor(aura).toLocaleString()}</span>
                </div>
            </div>
        </Html>
    </group>
  ) : null;
}
