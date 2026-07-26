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
  
  // Refs para lerping suave e evitar recriação
  const targetPos = useRef(new THREE.Vector3(playerData.x || 0, playerData.y || 0, playerData.z || 0));
  const currentPos = useRef(new THREE.Vector3(playerData.x || 0, playerData.y || 0, playerData.z || 0));
  
  useEffect(() => {
    let isMounted = true;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    // Fallback caso não venha model
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
      vrmData.scene.position.copy(targetPos.current);
      
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

  // Atualiza o target quando chega do banco
  useEffect(() => {
    targetPos.current.set(playerData.x || 0, playerData.y || 0, playerData.z || 0);
  }, [playerData.x, playerData.y, playerData.z]);

  useFrame((state, delta) => {
    if (!vrm) return;
    vrm.update(delta);
    
    // Interpolação suave de posição (Lerp)
    // Velocidade de lerp de 10 significa que ele cobre 60% da distancia por frame (muito suave e rapido)
    currentPos.current.lerp(targetPos.current, 10 * delta);
    
    // Calcular a direção para onde o avatar deve olhar
    const dir = new THREE.Vector3().subVectors(targetPos.current, vrm.scene.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
        dir.normalize();
        const targetAngle = Math.atan2(dir.x, dir.z);
        const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
        vrm.scene.quaternion.slerp(targetQuat, 10 * delta); 
    }
    
    vrm.scene.position.copy(currentPos.current);

    // Sistema de Animação
    const isMoving = playerData.anim === 'run' || playerData.anim === 'walk';
    const isRunning = playerData.anim === 'run';
    const isIdle = playerData.anim === 'idle' || !isMoving;
    
    // Os outros jogadores não farão a animação de bater com a ferramenta por enquanto (simplificação)
    AnimationEngine.update(vrm, delta, false, false, isMoving, isIdle, isRunning);
  });

  const aura = playerData.aura || 0;
  const level = getPlayerLevel(aura);
  const title = getPlayerTitle(level);

  return vrm ? (
    <group>
        <primitive object={vrm.scene} />
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
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
