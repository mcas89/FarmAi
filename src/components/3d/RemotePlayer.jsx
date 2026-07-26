import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { AnimationEngine } from '../../systems/animation/AnimationEngine';
import { Html } from '@react-three/drei';

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

  return vrm ? (
    <group>
        <primitive object={vrm.scene} />
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                color: '#fff', padding: '2px 8px', borderRadius: '8px',
                fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(168,85,247,0.3)',
                whiteSpace: 'nowrap', textShadow: '0 0 5px #000'
            }}>
                {playerData.name || 'Jogador'}
            </div>
        </Html>
    </group>
  ) : null;
}
