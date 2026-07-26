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
  
  const targetPos = useRef(new THREE.Vector3(playerData.x || 0, playerData.y || 0, playerData.z || 0));
  const currentPos = useRef(new THREE.Vector3(playerData.x || 0, playerData.y || 0, playerData.z || 0));
  const groupRef = useRef();
  
  // Efeito Visual de ganho de aura (Float UP)
  const lastAuraRef = useRef(playerData.aura || 0);
  const [showAuraVfx, setShowAuraVfx] = useState(false);
  const [auraGain, setAuraGain] = useState(0);

  useEffect(() => {
    let timeout;
    if (playerData.aura > lastAuraRef.current) {
        const diff = Math.floor(playerData.aura - lastAuraRef.current);
        setAuraGain(diff);
        setShowAuraVfx(true);
        
        timeout = setTimeout(() => setShowAuraVfx(false), 1000);
    }
    lastAuraRef.current = playerData.aura || 0;
    return () => clearTimeout(timeout);
  }, [playerData.aura]);
  
  useEffect(() => {
    let isMounted = true;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    const url = playerData.model ? `/models/${playerData.model}` : '/models/san.vrm';

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
      vrmData.scene.position.set(0, 0, 0); // Vrm fica no 0,0,0 local do grupo
      
      AnimationEngine.setBasePose('arms_down_pose');
      setVrm(vrmData);
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

  useEffect(() => {
    targetPos.current.set(playerData.x || 0, playerData.y || 0, playerData.z || 0);
  }, [playerData.x, playerData.y, playerData.z]);

  useFrame((state, delta) => {
    if (!vrm) return;
    vrm.update(delta);
    
    currentPos.current.lerp(targetPos.current, 10 * delta);
    
    if (groupRef.current) {
        groupRef.current.position.copy(currentPos.current);
    }
    
    const dir = new THREE.Vector3().subVectors(targetPos.current, currentPos.current);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
        dir.normalize();
        const targetAngle = Math.atan2(dir.x, dir.z);
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
        vrm.scene.quaternion.slerp(targetQuat, 10 * delta); 
    }

    const isMoving = playerData.anim === 'run' || playerData.anim === 'walk';
    const isRunning = playerData.anim === 'run';
    
    const leftFarmActive = playerData.leftFarm || false;
    const rightFarmActive = playerData.rightFarm || false;
    
    const isIdle = (playerData.anim === 'idle' || !isMoving) && !leftFarmActive && !rightFarmActive;
    
    AnimationEngine.update(vrm, delta, leftFarmActive, rightFarmActive, isMoving, isIdle, isRunning);
  });

  const aura = playerData.aura || 0;
  const level = getPlayerLevel(aura);
  const title = getPlayerTitle(level);

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
                    animation: 'floatUp 1s ease forwards'
                }}>
                    +{auraGain}
                </div>
            </Html>
        )}

        <Html position={[0, 2.6, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{
                background: 'rgba(10, 10, 15, 0.7)', backdropFilter: 'blur(6px)',
                padding: '4px 10px', borderRadius: '12px',
                border: '1px solid rgba(168,85,247,0.4)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: '#a855f7', color: '#fff', fontSize: '0.6rem', fontWeight: '900', padding: '1px 4px', borderRadius: '4px' }}>LV {level}</span>
                    <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '900', textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>{playerData.name || 'Jogador'}</span>
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
